from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

scheduler = BackgroundScheduler()


def _cleanup_old_notifications() -> None:
    from backend.app.db.session import SessionLocal
    from backend.app.services.notification_service import NotificationService

    session = SessionLocal()
    try:
        service = NotificationService(session)
        count = service.cleanup_old_notifications()
        if count:
            import logging
            logging.getLogger(__name__).info("Cleaned up %d old notifications", count)
    except Exception as exc:
        import logging
        logging.getLogger(__name__).warning("Notification cleanup failed: %s", exc)
    finally:
        session.close()


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
    scheduler.add_job(
        _cleanup_old_notifications,
        trigger=IntervalTrigger(hours=1),
        id="notification_cleanup",
        name="Cleanup old notifications",
        replace_existing=True,
        max_instances=1,
    )
    scheduler.start()


def stop_alert_scheduler() -> None:
    scheduler.shutdown(wait=False)
