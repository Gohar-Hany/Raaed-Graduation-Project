from fastapi import APIRouter, Request, status, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.concurrency import run_in_threadpool
from routes.schemes.admin import TaskCreateRequest, TaskCreateResponse
from agent.admin_crew import run_admin_crew
from models.db_schemes.instructor_guideline import InstructorGuideline
from models.InstructorGuidelineModel import InstructorGuidelineModel
from routes.agent import generate_and_save_quiz_background
import logging
import re
import datetime

logger = logging.getLogger("uvicorn.error")

admin_router = APIRouter(
    prefix="/api/v1/admin",
    tags=["api_v1", "admin"],
)


@admin_router.post(
    "/task/create",
    response_model=TaskCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task and queue it in Google Sheets memory",
)
async def create_task(request: Request, payload: TaskCreateRequest):
    """
    Receives a natural language request, extracts task parameters using a CrewAI Agent,
    writes the structured task record to Google Sheets, and returns the generated task ID.
    """
    logger.info(f"[Admin] Received task creation request: '{payload.request}'")
    try:
        result = await run_in_threadpool(
            run_admin_crew,
            user_request=payload.request,
            webhook_url=getattr(
                request.app, "_assistant_webhook_url",
                "http://localhost:8000/api/v1/agent/webhook/task"
            ),
        )

        logger.info(f"[Admin] Task created: {result['task_id']}")

        return TaskCreateResponse(
            task_id=result["task_id"],
            status="created",
        )
    except Exception as e:
        logger.exception("[Admin] Error during task processing")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": f"Failed to process task: {str(e)}"},
        )


@admin_router.get("/health", status_code=status.HTTP_200_OK, summary="Admin Agent Health Check")
async def admin_health_check():
    """Returns the health status of the admin agent service."""
    return {"status": "healthy", "service": "Admin Agent"}


@admin_router.get("/guidelines")
async def get_guidelines(request: Request):
    try:
        guideline_model = await InstructorGuidelineModel.create_instance(db_client=request.app.db_client)
        guidelines = await guideline_model.get_all_guidelines()
        return [
            {
                "_id": str(g.id),
                "project_id": g.project_id,
                "task_id": g.task_id,
                "task_type": g.task_type,
                "description": g.description,
                "priority": g.priority,
                "status": g.status,
                "notes": g.notes,
                "created_at": g.created_at,
                "is_active": g.is_active
            }
            for g in guidelines
        ]
    except Exception as e:
        logger.error(f"Error listing guidelines: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})


@admin_router.post("/guidelines")
async def create_or_update_guideline(request: Request, payload: dict, background_tasks: BackgroundTasks):
    try:
        guideline_model = await InstructorGuidelineModel.create_instance(db_client=request.app.db_client)
        
        task_id = payload.get("task_id")
        if not task_id:
            guidelines = await guideline_model.get_all_guidelines()
            max_num = 0
            for g in guidelines:
                match = re.search(r"T(\d+)", g.task_id)
                if match:
                    num = int(match.group(1))
                    if num > max_num:
                        max_num = num
            task_id = f"T{max_num + 1:03d}"
        
        course_name = payload.get("course") or payload.get("project_id") or "General"
        project_id = re.sub(r'[^a-zA-Z0-9]', '', course_name.lower())
        if not project_id:
            project_id = "general"

        from models.ProjectModel import ProjectModel
        project_model = await ProjectModel.create_instance(db_client=request.app.db_client)
        await project_model.get_project_or_create_one(project_id=project_id)
        
        task_type = payload.get("task_type", "Quiz")
        guideline = InstructorGuideline(
            project_id=project_id,
            task_id=task_id,
            task_type=task_type,
            description=payload.get("description", ""),
            priority=payload.get("priority", "Medium"),
            status=payload.get("status", "Pending"),
            notes=payload.get("notes", ""),
            created_at=payload.get("created_at") or datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            is_active=payload.get("is_active", True) if payload.get("is_active") is not None else True
        )
        
        await guideline_model.create_or_update_guideline(guideline)

        # Trigger background quiz generation if task_type is Quiz
        if task_type.lower() == "quiz":
            topic = payload.get("notes") or payload.get("description") or "General Topic"
            background_tasks.add_task(
                generate_and_save_quiz_background,
                request.app,
                project_id,
                task_id,
                topic
            )

        return {"status": "success", "task_id": task_id}
    except Exception as e:
        logger.error(f"Error creating/updating guideline: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})


@admin_router.put("/guidelines/{task_id}/toggle")
async def toggle_guideline(request: Request, task_id: str):
    try:
        doc = await request.app.db_client["instructor_guidelines"].find_one({"task_id": task_id})
        if not doc:
            return JSONResponse(status_code=404, content={"detail": "Guideline not found"})
        
        new_active = not doc.get("is_active", True)
        await request.app.db_client["instructor_guidelines"].update_one(
            {"task_id": task_id},
            {"$set": {"is_active": new_active}}
        )
        return {"status": "success", "task_id": task_id, "is_active": new_active}
    except Exception as e:
        logger.error(f"Error toggling guideline: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})


@admin_router.delete("/guidelines/{task_id}")
async def delete_guideline(request: Request, task_id: str):
    try:
        guideline_model = await InstructorGuidelineModel.create_instance(db_client=request.app.db_client)
        deleted = await guideline_model.delete_guideline(task_id)
        if not deleted:
            return JSONResponse(status_code=404, content={"detail": "Guideline not found"})
        return {"status": "success", "task_id": task_id}
    except Exception as e:
        logger.error(f"Error deleting guideline: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})

