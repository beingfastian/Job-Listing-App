from pymongo import MongoClient
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_mongodb_connection():
    """Test connection to MongoDB and insert a sample document"""
    # Connection string
    connection_string = "mongodb://localhost:27017/"
    
    logger.info(f"Connecting to MongoDB at: {connection_string}")
    
    try:
        # Create a MongoDB client
        client = MongoClient(connection_string, serverSelectionTimeoutMS=5000)
        
        # Force a connection to verify it works
        client.admin.command('ping')
        logger.info("MongoDB connection successful!")
        
        # Get a reference to the job_listings database
        db = client.job_listings
        
        # Create a sample job
        sample_job = {
            "title": "Test Job",
            "company": "Test Company",
            "location": "Test Location",
            "description": "This is a test job to verify MongoDB connection.",
            "posting_date": datetime.utcnow().date(),
            "url": "https://example.com/test-job",
            "salary": "$100,000 - $120,000",
            "job_type": "Full-time",
            "experience_level": "Mid-level",
            "source": "manual",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert the sample job
        result = db.user_jobs.insert_one(sample_job)
        logger.info(f"Sample job inserted with ID: {result.inserted_id}")
        
        # Verify we can retrieve the job
        retrieved_job = db.user_jobs.find_one({"_id": result.inserted_id})
        logger.info(f"Retrieved job with title: {retrieved_job['title']}")
        
        # List all jobs in the collection
        job_count = db.user_jobs.count_documents({})
        logger.info(f"Total jobs in the collection: {job_count}")
        
        logger.info("MongoDB test completed successfully!")
        
    except Exception as e:
        logger.error(f"MongoDB connection test failed: {str(e)}")

if __name__ == "__main__":
    test_mongodb_connection()