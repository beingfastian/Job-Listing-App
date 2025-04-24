from flask import Flask
from flask_cors import CORS
import logging
import os
from config import Config
from models import db, Job
from routes import api
from scraper.bot import scrape_jobs
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
import atexit

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global variables
flask_app = None
scheduler = None

def create_app():
    """Create and configure the Flask application"""
    global flask_app
    app = Flask(__name__)
    flask_app = app
    
    app.config.from_object(Config)
    
    # Initialize extensions
    db.init_app(app)
    CORS(app)
    
    # Register blueprints
    app.register_blueprint(api, url_prefix='/api')
    
    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()
        logger.info("Database tables created")
    
    return app

def configure_scheduler(app):
    """Configure the scheduler with jobs based on app config"""
    global scheduler
    
    # Create scheduler if it doesn't exist
    if scheduler is None:
        scheduler = BackgroundScheduler()
    
    with app.app_context():
        # Get schedule times from config
        schedule_config = app.config.get('SCRAPER_SCHEDULE', {})
        test_interval = app.config.get('SCRAPER_TEST_INTERVAL', 3)  # Default to 3 minutes
        
        # Schedule regular runs
        for name, time_str in schedule_config.items():
            hour, minute = map(int, time_str.split(':'))
            job_id = f'scraper_{name}'
            
            # Remove job if it exists
            if scheduler.get_job(job_id):
                scheduler.remove_job(job_id)
                
            # Add the job
            scheduler.add_job(
                scrape_jobs,
                CronTrigger(hour=hour, minute=minute),
                id=job_id,
                name=f'Scraper run at {time_str} ({name})',
                max_instances=1,
                coalesce=True,
                misfire_grace_time=3600  # Allow misfires up to 1 hour
            )
            logger.info(f"Scheduling scraper to run at {time_str} ({name})")
        
        # Schedule test interval runs
        test_job_id = 'scraper_test'
        
        # Remove test job if it exists
        if scheduler.get_job(test_job_id):
            scheduler.remove_job(test_job_id)
            
        # Add the test job
        scheduler.add_job(
            scrape_jobs,
            IntervalTrigger(minutes=test_interval),
            id=test_job_id,
            name=f'Scraper run every {test_interval} minutes (test mode)',
            max_instances=1,
            coalesce=True,
            misfire_grace_time=300  # 5 minutes grace time for test runs
        )
        logger.info(f"Scheduling scraper to run every {test_interval} minutes (test mode)")
        
        # Add a job to run immediately when the app starts
        immediate_job_id = 'scraper_immediate'
        if scheduler.get_job(immediate_job_id):
            scheduler.remove_job(immediate_job_id)
            
        scheduler.add_job(
            scrape_jobs,
            id=immediate_job_id,
            name='Initial scraper run at startup',
            next_run_time=None  # Will be replaced with current time when scheduler starts
        )
        logger.info("Scheduling immediate scraper run at startup")
    
    return scheduler

def start_scheduler(app):
    """Start the scheduler with configured jobs"""
    global scheduler
    
    # Configure the scheduler
    scheduler = configure_scheduler(app)
    
    # Start the scheduler if it's not already running
    if not scheduler.running:
        scheduler.start()
        logger.info("Scheduler started")
    
    return scheduler

if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", 5000))
    
    # Start the scheduler in the main Flask process only
    if os.environ.get('WERKZEUG_RUN_MAIN') == 'true' or not app.debug:
        # Start the scheduler
        scheduler = start_scheduler(app)
        
        # Register shutdown function to ensure clean shutdown
        atexit.register(lambda: scheduler.shutdown() if scheduler and scheduler.running else None)
    
    logger.info(f"Starting Flask application on port {port}")
    app.run(host="0.0.0.0", port=port, debug=True)