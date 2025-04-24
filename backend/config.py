import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    # Database configuration
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URI', 'mysql://honey:12345@localhost/job_listings')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Application configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    
    # CORS configuration
    CORS_HEADERS = 'Content-Type'
    
    # Scraper configuration
    SCRAPER_URL = os.getenv('SCRAPER_URL', 'https://www.actuarylist.com/')
    SCRAPER_SCHEDULE = {
        'midnight': '00:00',
        'early_morning': '03:00',
        'morning': '06:00'
    }
    # For testing, run every 3 minutes
    SCRAPER_TEST_INTERVAL = int(os.getenv('SCRAPER_TEST_INTERVAL', '3'))  # minutes
    
    # Maximum number of jobs to process in one run
    SCRAPER_MAX_JOBS = int(os.getenv('SCRAPER_MAX_JOBS', '20'))
    
    # Connection timeouts for the scraper (in seconds)
    SCRAPER_TIMEOUT = int(os.getenv('SCRAPER_TIMEOUT', '60'))