# import logging
# import time
# from datetime import datetime, timedelta
# from selenium import webdriver
# from selenium.webdriver.common.by import By
# from selenium.webdriver.chrome.service import Service
# from selenium.webdriver.chrome.options import Options
# from selenium.webdriver.support.ui import WebDriverWait
# from selenium.webdriver.support import expected_conditions as EC
# from webdriver_manager.chrome import ChromeDriverManager
# from flask import current_app
# from models import db, Job

# # Set up logger
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# # Function to convert relative time to datetime
# def parse_time(time_text):
#     now = datetime.utcnow()
#     if "h ago" in time_text:
#         hours = int(time_text.split("h")[0])
#         return now - timedelta(hours=hours)
#     elif "d ago" in time_text:
#         days = int(time_text.split("d")[0])
#         return now - timedelta(days=days)
#     elif "m ago" in time_text:
#         minutes = int(time_text.split("m")[0])
#         return now - timedelta(minutes=minutes)
#     return now  # Default to now if format is unknown

# def scrape_jobs():
#     """Scrape job listings from the configured source"""
#     logger.info("Job scraping started.")
    
#     try:
#         # Configure Selenium WebDriver
#         options = Options()
#         options.add_argument("--headless")  
#         options.add_argument("--disable-gpu")
#         options.add_argument("--window-size=1920,1080")
        
#         service = Service(ChromeDriverManager().install())
#         driver = webdriver.Chrome(service=service, options=options)
        
#         base_url = current_app.config.get('SCRAPER_URL', 'https://www.actuarylist.com/')
#         jobs_saved = 0
#         max_jobs = current_app.config.get('SCRAPER_MAX_JOBS', 20)
        
#         for page in range(1, max_jobs):
#             url = base_url if page == 1 else f"{base_url}?page={page}"
#             logger.info(f"Scraping page {page}: {url}")
#             jobs = get_jobs(driver, url)
            
#             for job in jobs:
#                 existing_job = Job.query.filter_by(title=job["title"], company=job["company"], location=job["location"]).first()
#                 if not existing_job:
#                     # Store category information in job_type or description to work with existing schema
#                     job_description = job.get("description", "")
#                     if job.get("category") and job.get("category") != "N/A":
#                         job_description = f"Category: {job['category']}\n\n{job_description}"
                    
#                     new_job = Job(
#                         title=job["title"],
#                         company=job["company"],
#                         location=job["location"],
#                         description=job_description,
#                         job_type=job.get("category", "Not specified"),  # Store category in job_type
#                         posting_date=job.get("created_at", datetime.utcnow()).date(),
#                         source="scraped"
#                     )
#                     db.session.add(new_job)
#                     jobs_saved += 1
            
#             db.session.commit()
#             logger.info(f"Saved {jobs_saved} jobs from page {page}")
        
#         driver.quit()
#         logger.info(f"Scraping completed. Saved {jobs_saved} new jobs to database.")
#         return {'success': True, 'jobs_saved': jobs_saved}
    
#     except Exception as e:
#         logger.error(f"Error during job scraping: {str(e)}")
#         return {'success': False, 'error': str(e)}

# # Function to extract job descriptions
# def get_description(driver, url):
#     driver.get(url)
#     time.sleep(2) 
#     try:
#         description_element = WebDriverWait(driver, 10).until(
#             EC.presence_of_element_located((By.XPATH, "//p[text()='Job Description']/following-sibling::ul"))
#         )
#         return description_element.text.strip()
#     except:
#         logger.warning(f"Failed to extract description from {url}")
#         return "N/A"

# # Function to extract job listings
# def get_jobs(driver, url):
#     driver.get(url)
#     job_list = []
    
#     try:
#         # Wait for job cards to load
#         WebDriverWait(driver, current_app.config.get('SCRAPER_TIMEOUT', 60)).until(
#             EC.presence_of_element_located((By.TAG_NAME, "article"))
#         )
        
#         job_cards = driver.find_elements(By.TAG_NAME, "article")
#         logger.info(f"Found {len(job_cards)} job cards on {url}")
        
#         for job in job_cards:
#             try:
#                 job_title = job.find_element(By.CLASS_NAME, "Job_job-card__position__ic1rc").text.strip()
#             except:
#                 job_title = "N/A"
#                 logger.warning("Could not extract job title")
            
#             try:
#                 job_company = job.find_element(By.CLASS_NAME, "Job_job-card__company__7T9qY").text.strip()
#             except:
#                 job_company = "N/A"
#                 logger.warning("Could not extract company name")
            
#             try:
#                 job_country = job.find_element(By.CLASS_NAME, "Job_job-card__country__GRVhK").text.strip()
#             except:
#                 job_country = "N/A"
#                 logger.warning("Could not extract location")
            
#             try:
#                 posted_time = job.find_element(By.CLASS_NAME, "Job_job-card__posted-on__NCZaJ").text.strip()
#                 created_at = parse_time(posted_time)  # Convert relative time
#             except:
#                 created_at = datetime.utcnow()
#                 logger.warning("Could not extract posting time, using current time")

#             try:
#                 parent_div = job.find_element(By.CLASS_NAME, "Job_job-card__tags__zfriA")  
#                 job_category = parent_div.find_element(By.CLASS_NAME, "Job_job-card__location__bq7jX").text.strip()
#             except:
#                 job_category = "N/A"
#                 logger.warning("Could not extract job category")
            
#             try:
#                 job_link = job.find_element(By.CLASS_NAME, "Job_job-page-link__a5I5g").get_attribute("href")
#             except:
#                 job_link = "N/A"
#                 logger.warning("Could not extract job link")
            
#             # Only get description if we have a valid URL
#             job_description = get_description(driver, job_link) if job_link != "N/A" else "N/A"

#             job_list.append({
#                 "title": job_title,
#                 "company": job_company,
#                 "location": job_country,
#                 "description": job_description,
#                 "category": job_category,
#                 "created_at": created_at  # Store parsed datetime
#             })
    
#     except Exception as e:
#         logger.error(f"Error scraping jobs from {url}: {str(e)}")
    
#     return job_list








import logging
import time
from datetime import datetime, timedelta
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException, NoSuchElementException
from flask import current_app
from models import db, Job

# Set up logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Function to convert relative time to datetime
def parse_time(time_text):
    now = datetime.utcnow()
    if "h ago" in time_text:
        hours = int(time_text.split("h")[0])
        return now - timedelta(hours=hours)
    elif "d ago" in time_text:
        days = int(time_text.split("d")[0])
        return now - timedelta(days=days)
    elif "m ago" in time_text:
        minutes = int(time_text.split("m")[0])
        return now - timedelta(minutes=minutes)
    return now  # Default to now if format is unknown

def setup_driver():
    """Set up and return a configured Chrome webdriver for Docker environment"""
    # Configure Selenium WebDriver
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage") 
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    
    try:
        # For Docker environment, use a direct path to chromedriver
        if current_app.config.get('DOCKER_ENV', False):
            service = Service("/usr/local/bin/chromedriver")
        else:
            # For local development, use webdriver_manager
            from webdriver_manager.chrome import ChromeDriverManager
            service = Service(ChromeDriverManager().install())
            
        driver = webdriver.Chrome(service=service, options=options)
        return driver
    except Exception as e:
        logger.error(f"Failed to set up Chrome driver: {str(e)}")
        raise

def scrape_jobs():
    """Scrape job listings from the configured source"""
    logger.info("Job scraping started.")
    
    driver = None
    try:
        # Set up the driver
        driver = setup_driver()
        
        base_url = current_app.config.get('SCRAPER_URL', 'https://www.actuarylist.com/')
        jobs_saved = 0
        max_jobs = current_app.config.get('SCRAPER_MAX_JOBS', 20)
        
        for page in range(1, max_jobs):
            url = base_url if page == 1 else f"{base_url}?page={page}"
            logger.info(f"Scraping page {page}: {url}")
            jobs = get_jobs(driver, url)
            
            for job in jobs:
                existing_job = Job.query.filter_by(title=job["title"], company=job["company"], location=job["location"]).first()
                if not existing_job:
                    # Store category information in job_type or description to work with existing schema
                    job_description = job.get("description", "")
                    if job.get("category") and job.get("category") != "N/A":
                        job_description = f"Category: {job['category']}\n\n{job_description}"
                    
                    new_job = Job(
                        title=job["title"],
                        company=job["company"],
                        location=job["location"],
                        description=job_description,
                        job_type=job.get("category", "Not specified"),  # Store category in job_type
                        posting_date=job.get("created_at", datetime.utcnow()).date(),
                        source="scraped"
                    )
                    db.session.add(new_job)
                    jobs_saved += 1
            
            db.session.commit()
            logger.info(f"Saved {jobs_saved} jobs from page {page}")
        
        logger.info(f"Scraping completed. Saved {jobs_saved} new jobs to database.")
        return {'success': True, 'jobs_saved': jobs_saved}
    
    except Exception as e:
        logger.error(f"Error during job scraping: {str(e)}")
        db.session.rollback()
        return {'success': False, 'error': str(e)}
    
    finally:
        if driver:
            driver.quit()

# Function to extract job descriptions
def get_description(driver, url):
    try:
        driver.get(url)
        time.sleep(2) 
        try:
            description_element = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//p[text()='Job Description']/following-sibling::ul"))
            )
            return description_element.text.strip()
        except:
            # Try alternative selectors for descriptions
            selectors = [
                "//div[contains(@class, 'job-description')]",
                "//div[contains(@class, 'description')]",
                "//section[contains(@class, 'job-description')]"
            ]
            for selector in selectors:
                try:
                    element = driver.find_element(By.XPATH, selector)
                    if element.text.strip():
                        return element.text.strip()
                except:
                    pass
            
            logger.warning(f"Failed to extract description from {url}")
            return "No description available"
    except Exception as e:
        logger.warning(f"Error accessing job URL {url}: {str(e)}")
        return "Failed to load job description"

# Function to extract job listings
def get_jobs(driver, url):
    driver.get(url)
    job_list = []
    
    try:
        # Wait for job cards to load
        WebDriverWait(driver, current_app.config.get('SCRAPER_TIMEOUT', 60)).until(
            EC.presence_of_element_located((By.TAG_NAME, "article"))
        )
        
        job_cards = driver.find_elements(By.TAG_NAME, "article")
        logger.info(f"Found {len(job_cards)} job cards on {url}")
        
        for job in job_cards:
            try:
                job_title = job.find_element(By.CLASS_NAME, "Job_job-card__position__ic1rc").text.strip()
            except:
                job_title = "Unspecified Position"
                logger.warning("Could not extract job title")
            
            try:
                job_company = job.find_element(By.CLASS_NAME, "Job_job-card__company__7T9qY").text.strip()
            except:
                job_company = "Unspecified Company"
                logger.warning("Could not extract company name")
            
            try:
                job_country = job.find_element(By.CLASS_NAME, "Job_job-card__country__GRVhK").text.strip()
            except:
                job_country = "Location Not Specified"
                logger.warning("Could not extract location")
            
            try:
                posted_time = job.find_element(By.CLASS_NAME, "Job_job-card__posted-on__NCZaJ").text.strip()
                created_at = parse_time(posted_time)  # Convert relative time
            except:
                created_at = datetime.utcnow()
                logger.warning("Could not extract posting time, using current time")

            try:
                parent_div = job.find_element(By.CLASS_NAME, "Job_job-card__tags__zfriA")  
                job_category = parent_div.find_element(By.CLASS_NAME, "Job_job-card__location__bq7jX").text.strip()
            except:
                job_category = "Not Specified"
                logger.warning("Could not extract job category")
            
            try:
                job_link = job.find_element(By.CLASS_NAME, "Job_job-page-link__a5I5g").get_attribute("href")
            except:
                job_link = url  # Use the main URL as fallback
                logger.warning("Could not extract job link")
            
            # Only get description if we have a valid URL
            job_description = get_description(driver, job_link) if job_link != url else "No description available"

            job_list.append({
                "title": job_title,
                "company": job_company,
                "location": job_country,
                "description": job_description,
                "category": job_category,
                "created_at": created_at,  # Store parsed datetime
                "url": job_link
            })
    
    except Exception as e:
        logger.error(f"Error scraping jobs from {url}: {str(e)}")
    
    return job_list