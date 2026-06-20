from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

scheduler = BackgroundScheduler()


def start_alert_scheduler() -> None:
    from backend.app.services.alert_evaluation_service import run_alert_evaluation

    scheduler.add_job(
        run_alert_evaluation,
        trigger=IntervalTrigger(minutes=5),
        id="alert_evaluation",
        name="Evaluate all active alerts",
        replace_existing=True,
        max_instances=1,
    )
    scheduler.start()


def stop_alert_scheduler() -> None:
    scheduler.shutdown(wait=False)
