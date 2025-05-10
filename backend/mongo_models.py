from flask_pymongo import PyMongo
from bson.objectid import ObjectId
from datetime import datetime

# Initialize MongoDB
mongo = PyMongo()

class UserJob:
    """MongoDB collection for user-added jobs"""
    
    @staticmethod
    def create(job_data):
        """Create a new user job document"""
        # Set timestamps
        job_data['created_at'] = datetime.utcnow()
        job_data['updated_at'] = datetime.utcnow()
        job_data['source'] = 'manual'  # Force source to manual for user-added jobs
        
        # Handle date conversion for posting_date - convert to string format for MongoDB
        if 'posting_date' in job_data:
            if isinstance(job_data['posting_date'], str):
                # Keep string format
                pass
            elif hasattr(job_data['posting_date'], 'strftime'):
                # Convert datetime or date object to string
                job_data['posting_date'] = job_data['posting_date'].strftime('%Y-%m-%d')
            else:
                # If not a string or date object, remove it to avoid serialization issues
                job_data.pop('posting_date', None)
        
        result = mongo.db.user_jobs.insert_one(job_data)
        job_data['_id'] = str(result.inserted_id)
        return job_data
    
    @staticmethod
    def get_all(filters=None):
        """Retrieve all user jobs with optional filtering"""
        if filters is None:
            filters = {}
        
        # Convert string filters to regex for case-insensitive search
        query = {}
        if 'company' in filters and filters['company']:
            query['company'] = {'$regex': filters['company'], '$options': 'i'}
        if 'location' in filters and filters['location']:
            query['location'] = {'$regex': filters['location'], '$options': 'i'}
        if 'job_type' in filters and filters['job_type']:
            query['job_type'] = {'$regex': filters['job_type'], '$options': 'i'}
        
        # Add source=manual by default (this is a user job collection)
        query['source'] = 'manual'
        
        cursor = mongo.db.user_jobs.find(query).sort('created_at', -1)  # -1 for descending order
        
        # Convert MongoDB documents to dictionaries and convert ObjectId to string
        jobs = []
        for job in cursor:
            job['id'] = str(job['_id'])  # Map MongoDB _id to id for frontend consistency
            del job['_id']  # Remove the original _id
            
            # Format dates to match SQL format for frontend consistency
            if 'created_at' in job and isinstance(job['created_at'], datetime):
                job['created_at'] = job['created_at'].strftime('%Y-%m-%d %H:%M:%S')
            if 'updated_at' in job and isinstance(job['updated_at'], datetime):
                job['updated_at'] = job['updated_at'].strftime('%Y-%m-%d %H:%M:%S')
            
            jobs.append(job)
        
        return jobs
    
    @staticmethod
    def get_by_id(job_id):
        """Retrieve a user job by ID"""
        if not ObjectId.is_valid(job_id):
            return None
        
        job = mongo.db.user_jobs.find_one({'_id': ObjectId(job_id)})
        if job:
            job['id'] = str(job['_id'])
            del job['_id']
            
            # Format dates
            if 'created_at' in job and isinstance(job['created_at'], datetime):
                job['created_at'] = job['created_at'].strftime('%Y-%m-%d %H:%M:%S')
            if 'updated_at' in job and isinstance(job['updated_at'], datetime):
                job['updated_at'] = job['updated_at'].strftime('%Y-%m-%d %H:%M:%S')
                    
        return job
    
    @staticmethod
    def delete(job_id):
        """Delete a user job by ID"""
        if not ObjectId.is_valid(job_id):
            return False
        
        result = mongo.db.user_jobs.delete_one({'_id': ObjectId(job_id)})
        return result.deleted_count > 0
    
    @staticmethod
    def get_stats():
        """Get statistics about user jobs"""
        total = mongo.db.user_jobs.count_documents({})
        
        # Get company stats
        company_pipeline = [
            {'$group': {'_id': '$company', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}}
        ]
        companies = list(mongo.db.user_jobs.aggregate(company_pipeline))
        companies_stats = [{'company': company['_id'], 'count': company['count']} for company in companies]
        
        # Get location stats
        location_pipeline = [
            {'$group': {'_id': '$location', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}}
        ]
        locations = list(mongo.db.user_jobs.aggregate(location_pipeline))
        locations_stats = [{'location': location['_id'], 'count': location['count']} for location in locations]
        
        # Get job type stats
        job_type_pipeline = [
            {'$group': {'_id': '$job_type', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}}
        ]
        job_types = list(mongo.db.user_jobs.aggregate(job_type_pipeline))
        job_types_stats = [{'job_type': job_type['_id'], 'count': job_type['count']} for job_type in job_types]
        
        return {
            'total': total,
            'companies': companies_stats,
            'locations': locations_stats,
            'job_types': job_types_stats
        }