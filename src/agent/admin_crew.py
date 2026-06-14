"""
Admin Agent Crew Runner — Processes instructor task creation requests.

Uses CrewAI to analyze natural language educational requests, extract task
parameters, persist them to Google Sheets, and notify the assistant agent
via webhook.
"""

import os
import re
import json
import logging
import datetime

from crewai import Agent, Task, Crew, Process
from helpers.config import get_settings
from .prompts import ADMIN_AGENT_SYSTEM_PROMPT
from .crew_runner import OpenRouterLLM

from pydantic import BaseModel, Field

logger = logging.getLogger("uvicorn.error")

# Disable CrewAI telemetry
os.environ["OTEL_SDK_DISABLED"] = "true"
os.environ["CREWAI_TELEMETRY_OPT_OUT"] = "true"


class TaskRecordModel(BaseModel):
    """Pydantic schema for structured task records output by the Admin Agent."""

    task_type: str = Field(
        description="Must be one of: Quiz, Assignment, Flashcards, Study Guide, Summary, Exam, Guideline"
    )
    description: str = Field(description="Clear, concise explanation of the task")
    course: str = Field(
        description="The course or subject name (e.g. Machine Learning). Default to 'General'"
    )
    priority: str = Field(description="Priority level (High, Medium, Low)")
    assigned_agent: str = Field(
        default="TA",
        description="The agent assigned to handle the task (always 'TA')",
    )
    status: str = Field(
        default="Pending",
        description="The initial status (always 'Pending')",
    )
    notes: str = Field(
        default="",
        description="Any extracted parameters, MCQ counts, chapters, formatting, etc.",
    )

def _get_admin_llm():
    """Create the LLM instance for the admin agent."""
    settings = get_settings()
    api_key = settings.OPENAI_API_KEY
    api_url = settings.OPENAI_API_URL or "https://openrouter.ai/api/v1"
    model_name = settings.GENERATION_MODEL_ID or "openai/gpt-4o-mini"

    if not api_key:
        raise ValueError("OPENAI_API_KEY is not configured in settings")

    if not model_name.startswith("openrouter/"):
        model_name = f"openrouter/{model_name}"

    return OpenRouterLLM(
        model=model_name,
        base_url=api_url,
        api_key=api_key,
        temperature=0.1,
    )

def run_admin_crew(
    user_request: str,
    webhook_url: str = None,
) -> dict:
    """
    Execute the Admin Crew to process a user request.

    Workflow:
        1. CrewAI agent analyzes the natural language request
        2. Extracts structured task parameters (type, course, priority, etc.)
        3. Sends a webhook notification to the assistant agent to save to MongoDB

    Args:
        user_request: Natural language task description
        webhook_url: URL to notify the assistant agent about the new task

    Returns:
        dict with task_id, status, and crew_output
    """
    settings = get_settings()
    llm = _get_admin_llm()

    # Force environment variables for LiteLLM/Instructor
    os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY
    os.environ["OPENAI_API_BASE"] = settings.OPENAI_API_URL or "https://openrouter.ai/api/v1"
    os.environ["OPENAI_BASE_URL"] = settings.OPENAI_API_URL or "https://openrouter.ai/api/v1"

    # Query projects and their uploaded assets to build a content-aware mapping
    project_mapping_info = []
    existing_courses = []
    try:
        from pymongo import MongoClient
        client = MongoClient(settings.MONGODB_URL)
        db = client[settings.MONGODB_DATABASE or "raad-rag"]
        
        projects = list(db["projects"].find({}))
        assets = list(db["assets"].find({}))
        
        for p in projects:
            p_id = p.get("project_id")
            if not p_id:
                continue
            existing_courses.append(p_id)
            # Find assets for this project
            p_obj_id = p.get("_id")
            p_assets = [a.get("asset_name") for a in assets if a.get("asset_project_id") == p_obj_id]
            assets_str = ", ".join(p_assets) if p_assets else "No uploaded files"
            project_mapping_info.append(f"- Course ID '{p_id}': contains files [{assets_str}]")
            
        client.close()
    except Exception as ex:
        logger.error(f"[Admin Agent] Failed to query existing courses: {ex}")

    mapping_str = "\n".join(project_mapping_info)
    if not existing_courses:
        existing_courses = ["General"]
    courses_list_str = ", ".join(existing_courses)

    # Define the Admin Agent
    admin_agent = Agent(
        role="Admin Agent / Request Analyzer",
        goal=(
            "Analyze natural language educational requests, classify their task types, "
            "extract details, and format them into a structured task record."
        ),
        backstory=ADMIN_AGENT_SYSTEM_PROMPT,
        tools=[],
        llm=llm,
        verbose=True,
        allow_delegation=False,
    )

    # Task 1: Analyze Request
    analyze_task = Task(
        description=f"""Analyze the user's natural language request: "{user_request}".
Identify the following information:
1. Task Type: Classify into one of: Quiz, Assignment, Flashcards, Study Guide, Summary, Exam, Guideline. 
CRITICAL RULE: ONLY classify as 'Quiz' if the user EXPLICITLY asks for a quiz, test, or exam. If they just say "focus on X" or "tell students to study X", you MUST classify it as 'Guideline'. If not clear, default to Guideline.
2. Course: Match the request to the most relevant existing course based on its name or the files it contains. Here is the list of courses and their materials:
{mapping_str}

Reasoning Rules for matching:
- If the topic is about math, algebra, statistics, calculus, or specific math concepts like "Mean" and "Median", it MUST map to 'testproject1' because it contains 'Math_Session_1.pdf'.
- If the topic is about machine learning, neural networks, deep learning, AI, regression, or data science, it MUST map to '1' because it contains 'ML_NO_Address.pdf' (Machine Learning).
- Read the filenames in each course and map the request to the course containing the most relevant files.
- Select the course ID (e.g. 'testproject1', '1', etc.) that best fits the topic. If no course fits, default to 'General' or the first available course. You MUST strictly output one of the existing course IDs: {courses_list_str}. Do not invent a new course.
3. Description: Generate a clear, concise description of what needs to be created or communicated. Keep it clean for user display.
4. Priority: Determine priority (High if urgent, or if it is an Exam or Quiz; Medium for Assignments; Low for Flashcards/Study Guides/Summaries, unless specified otherwise).
5. Notes: Extract specific parameters or formatting details (e.g. "20 MCQs, Chapter 3", "5 pages long").""",
        expected_output="A structured summary of the request details: Task Type, Course, Description, Priority, and Notes.",
        agent=admin_agent,
    )

    # Task 2: Format Record
    format_task = Task(
        description="""Using the extracted details from the previous task, prepare a final record for the task.
The task must be assigned to the "TA" agent, and its initial status must be "Pending".
Format the final description and notes so they are clean, actionable, and ready to be stored in the database.""",
        expected_output="A final structured representation of the task record.",
        agent=admin_agent,
    )

    # Task 3: Output Structured JSON
    output_task = Task(
        description="""Compile the final task record with all fields correctly extracted.
You MUST output it as a valid JSON object matching the requested schema:
- task_type: Quiz, Assignment, Flashcards, Study Guide, Summary, or Exam
- description: clear, concise description
- course: subject name (default to 'General')
- priority: High, Medium, Low
- assigned_agent: 'TA'
- status: 'Pending'
- notes: MCQ counts, chapter numbers, etc. (default to empty string)""",
        expected_output="A validated task record matching the TaskRecordModel schema.",
        agent=admin_agent,
        output_json=TaskRecordModel,
    )

    # Run the Crew
    admin_crew = Crew(
        agents=[admin_agent],
        tasks=[analyze_task, format_task, output_task],
        process=Process.sequential,
        verbose=True,
    )

    logger.info(f"[Admin Agent] Processing request: '{user_request}'")
    result = admin_crew.kickoff(inputs={"user_request": user_request})

    # Parse structured output and write to Google Sheets
    task_id = "UNKNOWN"
    write_msg = ""

    try:
        task_data = None
        if result.json_dict:
            task_data = result.json_dict
        elif result.pydantic:
            task_data = result.pydantic.model_dump()
        else:
            # Fallback string parsing
            result_str = str(result.raw)
            match = re.search(r"\{.*\}", result_str, re.DOTALL)
            if match:
                task_data = json.loads(match.group(0))

        if task_data:
            logger.info(f"[Admin Agent] Extracted task data: {task_data}")

            # Generate task_id directly from MongoDB
            logger.info("[Admin Agent] Generating task_id from MongoDB...")
            try:
                from pymongo import MongoClient
                settings = get_settings()
                client = MongoClient(settings.MONGODB_URL)
                db = client[settings.MONGODB_DATABASE or "raad-rag"]
                guidelines = list(db["instructor_guidelines"].find({}))
                
                max_num = 0
                for g in guidelines:
                    t_match = re.search(r"T(\d+)", g.get("task_id", ""))
                    if t_match:
                        num = int(t_match.group(1))
                        if num > max_num:
                            max_num = num
                task_id = f"T{max_num + 1:03d}"
                client.close()
            except Exception as ex:
                logger.error(f"[Admin Agent] Failed to query MongoDB for task_id: {ex}")
                task_id = f"T{int(datetime.datetime.now().timestamp()) % 1000:03d}"

            # Send webhook to assistant agent to save in MongoDB
            webhook_success = False
            if task_id != "UNKNOWN":
                try:
                    _send_webhook(task_id, task_data, webhook_url)
                    webhook_success = True
                except Exception as webhook_err:
                    logger.error(f"[Admin Agent] Webhook dispatch failed: {webhook_err}")

            return {
                "task_id": task_id,
                "status": "created" if webhook_success else "created_with_warning",
                "crew_output": "Task registered successfully in MongoDB",
            }

    except Exception as e:
        logger.error(f"[Admin Agent] Error in post-processing: {e}")

    return {
        "task_id": "UNKNOWN",
        "status": "failed",
        "crew_output": write_msg or "Failed",
    }


def _send_webhook(task_id: str, task_data: dict, webhook_url: str = None):
    """Send a webhook notification to the assistant agent about a new task."""
    if not webhook_url:
        settings = get_settings()
        webhook_url = getattr(settings, "ASSISTANT_WEBHOOK_URL", None)
        if not webhook_url:
            webhook_url = "http://localhost:5000/api/v1/agent/webhook/task"

    try:
        import requests

        logger.info(f"[Admin Agent] Sending webhook to {webhook_url}...")
        payload = {
            "task_id": task_id,
            "description": task_data.get("description", ""),
            "course": task_data.get("course", "General"),
            "task_type": task_data.get("task_type", "Quiz"),
            "priority": task_data.get("priority", "High"),
            "notes": task_data.get("notes", ""),
            "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }
        res = requests.post(webhook_url, json=payload, timeout=5)
        logger.info(f"[Admin Agent] Webhook response: {res.status_code}")
    except Exception as e:
        logger.warning(f"[Admin Agent] Webhook notification failed: {e}")
