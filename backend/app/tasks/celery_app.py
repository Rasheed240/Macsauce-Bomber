"""
Celery application configuration
"""
from celery import Celery
from app.core.config import settings

# Create Celery app
celery_app = Celery(
    'macsauce_bomber',
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=['app.tasks.email_tasks']
)

# Celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Optional: Beat schedule for periodic tasks
celery_app.conf.beat_schedule = {
    # Example: Check scheduled campaigns every minute
    'check-scheduled-campaigns': {
        'task': 'app.tasks.email_tasks.check_scheduled_campaigns',
        'schedule': 60.0,  # Every 60 seconds
    },
}
