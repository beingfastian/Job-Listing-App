import logging
import time
import threading
import schedule
from datetime import datetime
from scraper.bot import scrape_jobs

# Set up logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables
scheduler_running = False
scheduler_thread = None

def scheduled_job(app):
    """Function to run the scheduled job with app context"""
    logger.info(f"Running scheduled job at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    with app.app_context():
        result = scrape_jobs()
        if result.get('success', False):
            logger.info(f"Scheduled job completed successfully. Jobs saved: {result.get('jobs_saved', 0)}")
        else:
            logger.error(f"Scheduled job failed: {result.get('error', 'Unknown error')}")

def schedule_scraper(app):
    """Set up the scheduler with the configured times"""
    global scheduler_running
    
    # Get scheduled times from config
    scheduled_times = app.config.get('SCRAPER_SCHEDULE', {})
    for name, time_str in scheduled_times.items():
        logger.info(f"Scheduling scraper to run at {time_str} ({name})")
        schedule.every().day.at(time_str).do(scheduled_job, app=app)
    
    # Test mode - run every few minutes
    test_interval = app.config.get('SCRAPER_TEST_INTERVAL')
    if test_interval:
        logger.info(f"Scheduling scraper to run every {test_interval} minutes (test mode)")
        schedule.every(test_interval).minutes.do(scheduled_job, app=app)
    
    scheduler_running = True

def run_scheduler(app):
    """Main function to run the scheduler in a loop"""
    global scheduler_running, scheduler_thread
    
    logger.info("Starting job scheduler")
    schedule_scraper(app)
    
    # Create a thread to run the scheduler
    def run_scheduler_thread():
        global scheduler_running
        logger.info("Scheduler thread started")
        while scheduler_running:
            schedule.run_pending()
            time.sleep(1)
        logger.info("Scheduler thread stopped")
    
    scheduler_thread = threading.Thread(target=run_scheduler_thread)
    scheduler_thread.daemon = True
    scheduler_thread.start()
    
    return scheduler_thread

def stop_scheduler(thread=None):
    """Stop the scheduler"""
    global scheduler_running, scheduler_thread
    
    if thread is None:
        thread = scheduler_thread
    
    if thread and thread.is_alive():
        logger.info("Stopping scheduler")
        scheduler_running = False
        # Clear all scheduled jobs
        schedule.clear()
        # Wait for thread to finish
        if threading.current_thread() != thread:
            thread.join(timeout=5)
        logger.info("Scheduler stopped")
    else:
        logger.warning("Scheduler not running or thread not found")