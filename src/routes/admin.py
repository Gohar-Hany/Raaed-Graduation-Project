from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse
from routes.schemes.admin import TaskCreateRequest, TaskCreateResponse
from agent.admin_crew import run_admin_crew
import logging

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
        result = run_admin_crew(
            user_request=payload.request,
            google_sheets_provider=getattr(request.app, "google_sheets_provider", None),
            webhook_url=getattr(
                request.app, "_assistant_webhook_url",
                "http://localhost:5000/api/v1/agent/webhook/task"
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
