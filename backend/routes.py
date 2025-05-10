from flask import Blueprint, jsonify, request, current_app
from models import db, Job
from mongo_models import UserJob, mongo
from datetime import datetime
import logging, re
from scraper.bot import scrape_jobs
from bson.objectid import ObjectId

# Set up logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
api = Blueprint('api', __name__)

@api.route('/jobs', methods=['GET'])
def get_jobs():
    """Get job listings with optional filtering and sorting"""
    try:
        # Get query parameters for filtering
        company = request.args.get('company')
        location = request.args.get('location')
        job_type = request.args.get('job_type')
        source = request.args.get('source')
        sort_by = request.args.get('sort_by', 'created_at')  # Default sort by creation date
        sort_order = request.args.get('sort_order', 'desc')  # Default descending
        
        filters = {}
        if company:
            filters['company'] = company
        if location:
            filters['location'] = location
        if job_type:
            filters['job_type'] = job_type
        
        # Process based on source
        if source == 'manual':
            # Get user jobs from MongoDB
            jobs_list = UserJob.get_all(filters)
        elif source == 'scraped':
            # Start with base query for scraped jobs from MySQL
            query = Job.query.filter_by(source='scraped')
            
            # Apply filters if provided
            if company:
                query = query.filter(Job.company.ilike(f'%{company}%'))
            if location:
                query = query.filter(Job.location.ilike(f'%{location}%'))
            if job_type:
                query = query.filter(Job.job_type.ilike(f'%{job_type}%'))
            
            # Apply sorting
            if hasattr(Job, sort_by):
                if sort_order.lower() == 'asc':
                    query = query.order_by(getattr(Job, sort_by).asc())
                else:
                    query = query.order_by(getattr(Job, sort_by).desc())
            else:
                logger.warning(f"Invalid sort_by parameter: {sort_by}, using default")
                query = query.order_by(Job.created_at.desc())
            
            # Execute query
            jobs = query.all()
            
            # Convert to dictionary for JSON response
            jobs_list = [job.to_dict() for job in jobs]
        else:
            # If no source specified, combine results from both databases
            # First get manual jobs from MongoDB
            manual_jobs = UserJob.get_all(filters)
            
            # Then get scraped jobs from MySQL
            query = Job.query.filter_by(source='scraped')
            
            # Apply filters if provided
            if company:
                query = query.filter(Job.company.ilike(f'%{company}%'))
            if location:
                query = query.filter(Job.location.ilike(f'%{location}%'))
            if job_type:
                query = query.filter(Job.job_type.ilike(f'%{job_type}%'))
            
            # Apply sorting
            if hasattr(Job, sort_by):
                if sort_order.lower() == 'asc':
                    query = query.order_by(getattr(Job, sort_by).asc())
                else:
                    query = query.order_by(getattr(Job, sort_by).desc())
            else:
                logger.warning(f"Invalid sort_by parameter: {sort_by}, using default")
                query = query.order_by(Job.created_at.desc())
            
            # Execute query
            scraped_jobs = query.all()
            scraped_jobs_list = [job.to_dict() for job in scraped_jobs]
            
            # Combine both lists
            jobs_list = manual_jobs + scraped_jobs_list
            
            # Sort combined list
            if sort_by in ['created_at', 'updated_at', 'posting_date']:
                # For date fields, convert strings to datetime first
                date_format = '%Y-%m-%d %H:%M:%S' if sort_by != 'posting_date' else '%Y-%m-%d'
                # Define a safe sorting function
                def safe_date_sort(job):
                    date_str = job.get(sort_by)
                    if not date_str:
                        return datetime(1970, 1, 1)  # Default for empty dates
                    try:
                        return datetime.strptime(date_str, date_format)
                    except (ValueError, TypeError):
                        return datetime(1970, 1, 1)  # Fallback for invalid formats
                
                jobs_list.sort(key=safe_date_sort, reverse=(sort_order.lower() == 'desc'))
            else:
                # For non-date fields, sort directly with a safe function
                def safe_sort(job):
                    val = job.get(sort_by, '')
                    return val if val is not None else ''
                
                jobs_list.sort(key=safe_sort, reverse=(sort_order.lower() == 'desc'))
        
        return jsonify({
            'success': True,
            'count': len(jobs_list),
            'jobs': jobs_list
        }), 200
    
    except Exception as e:
        logger.error(f"Error getting jobs: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve jobs',
            'error': str(e)
        }), 500

@api.route('/jobs', methods=['POST'])
def add_job():
    """Add a new job listing"""
    try:
        data = request.get_json()
        logger.info(f"Received job data: {data}")
        
        # Validate required fields
        required_fields = ['title', 'company']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Always set source to manual for MongoDB
        data['source'] = 'manual'
        
        # Create the job in MongoDB
        try:
            # Make sure posting_date is a string
            if 'posting_date' in data and not isinstance(data['posting_date'], str):
                if hasattr(data['posting_date'], 'strftime'):
                    data['posting_date'] = data['posting_date'].strftime('%Y-%m-%d')
                else:
                    # If it can't be converted, remove it
                    data.pop('posting_date', None)
            
            new_job = UserJob.create(data)
            logger.info(f"Job created in MongoDB: {new_job}")
            
            return jsonify({
                'success': True,
                'message': 'Job added successfully',
                'job': new_job
            }), 201
        
        except Exception as mongo_error:
            logger.error(f"MongoDB error: {str(mongo_error)}")
            return jsonify({
                'success': False,
                'message': 'Failed to add job',
                'error': str(mongo_error)
            }), 500
    
    except Exception as e:
        logger.error(f"Error adding job: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to add job',
            'error': str(e)
        }), 500

@api.route('/jobs/<job_id>', methods=['DELETE'])
def delete_job(job_id):
    """Delete a job listing by ID"""
    try:
        logger.info(f"Delete request received for job ID: {job_id}")
        
        # Check if this is a MongoDB ObjectId (for user jobs)
        mongo_id_pattern = r'^[0-9a-f]{24}$'
        is_mongo_id = bool(re.match(mongo_id_pattern, job_id, re.IGNORECASE))
        
        if is_mongo_id:
            logger.info(f"Attempting to delete MongoDB job with ID: {job_id}")
            # Try to delete from MongoDB
            if UserJob.delete(job_id):
                logger.info(f"Successfully deleted MongoDB job with ID: {job_id}")
                return jsonify({
                    'success': True,
                    'message': f'Job with ID {job_id} deleted successfully'
                }), 200
            else:
                logger.warning(f"MongoDB job with ID {job_id} not found")
                # If not found in MongoDB, job doesn't exist
                return jsonify({
                    'success': False,
                    'message': f'Job with ID {job_id} not found'
                }), 404
        else:
            # Try to delete from MySQL (for scraped jobs)
            try:
                logger.info(f"Attempting to delete MySQL job with ID: {job_id}")
                # Convert to int
                sql_id = int(job_id)
                job = Job.query.get(sql_id)
                
                if not job:
                    logger.warning(f"MySQL job with ID {job_id} not found")
                    return jsonify({
                        'success': False,
                        'message': f'Job with ID {job_id} not found'
                    }), 404
                
                db.session.delete(job)
                db.session.commit()
                logger.info(f"Successfully deleted MySQL job with ID: {job_id}")
                
                return jsonify({
                    'success': True,
                    'message': f'Job with ID {job_id} deleted successfully'
                }), 200
            except (ValueError, TypeError) as e:
                logger.error(f"Invalid job ID format: {job_id}, error: {str(e)}")
                return jsonify({
                    'success': False,
                    'message': f'Invalid job ID format: {job_id}'
                }), 400
    
    except Exception as e:
        if 'db' in locals():
            db.session.rollback()
        logger.error(f"Error deleting job: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to delete job',
            'error': str(e)
        }), 500


@api.route('/jobs/stats', methods=['GET'])
def get_job_stats():
    """Get statistics about job listings"""
    try:
        # Get MySQL stats (scraped jobs)
        sql_total = Job.query.filter_by(source='scraped').count()
        
        companies = db.session.query(Job.company, db.func.count(Job.id)).filter_by(source='scraped').group_by(Job.company).all()
        sql_companies_stats = [{'company': company, 'count': count} for company, count in companies]
        
        locations = db.session.query(Job.location, db.func.count(Job.id)).filter_by(source='scraped').group_by(Job.location).all()
        sql_locations_stats = [{'location': location, 'count': count} for location, count in locations]
        
        job_types = db.session.query(Job.job_type, db.func.count(Job.id)).filter_by(source='scraped').group_by(Job.job_type).all()
        sql_job_types_stats = [{'job_type': job_type, 'count': count} for job_type, count in job_types]
        
        # Get MongoDB stats (manual jobs)
        mongo_stats = UserJob.get_stats()
        mongo_total = mongo_stats.get('total', 0)
        mongo_companies_stats = mongo_stats.get('companies', [])
        mongo_locations_stats = mongo_stats.get('locations', [])
        mongo_job_types_stats = mongo_stats.get('job_types', [])
        
        # Combine stats
        total_jobs = sql_total + mongo_total
        
        # Combine and merge company stats
        company_stats = {}
        for company in sql_companies_stats:
            company_name = company['company']
            company_stats[company_name] = company_stats.get(company_name, 0) + company['count']
        
        for company in mongo_companies_stats:
            company_name = company['company']
            company_stats[company_name] = company_stats.get(company_name, 0) + company['count']
        
        combined_companies_stats = [{'company': company, 'count': count} for company, count in company_stats.items()]
        
        # Combine and merge location stats
        location_stats = {}
        for location in sql_locations_stats:
            location_name = location['location']
            location_stats[location_name] = location_stats.get(location_name, 0) + location['count']
        
        for location in mongo_locations_stats:
            location_name = location['location']
            location_stats[location_name] = location_stats.get(location_name, 0) + location['count']
        
        combined_locations_stats = [{'location': location, 'count': count} for location, count in location_stats.items()]
        
        # Combine and merge job type stats
        job_type_stats = {}
        for job_type in sql_job_types_stats:
            job_type_name = job_type['job_type']
            job_type_stats[job_type_name] = job_type_stats.get(job_type_name, 0) + job_type['count']
        
        for job_type in mongo_job_types_stats:
            job_type_name = job_type['job_type']
            job_type_stats[job_type_name] = job_type_stats.get(job_type_name, 0) + job_type['count']
        
        combined_job_types_stats = [{'job_type': job_type, 'count': count} for job_type, count in job_type_stats.items()]
        
        # Source stats
        sources_stats = [
            {'source': 'manual', 'count': mongo_total},
            {'source': 'scraped', 'count': sql_total}
        ]
        
        return jsonify({
            'success': True,
            'total_jobs': total_jobs,
            'companies': combined_companies_stats,
            'locations': combined_locations_stats,
            'job_types': combined_job_types_stats,
            'sources': sources_stats
        }), 200
    
    except Exception as e:
        logger.error(f"Error getting job stats: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve job statistics',
            'error': str(e)
        }), 500

@api.route('/scraper/run', methods=['POST'])
def trigger_scraper():
    """Manually trigger the job scraper"""
    try:
        result = scrape_jobs()
        
        return jsonify({
            'success': True,
            'message': 'Job scraper completed successfully',
            'jobs_processed': result.get('jobs_saved', 0) if isinstance(result, dict) else 0
        }), 200
    
    except Exception as e:
        logger.error(f"Error triggering scraper: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to trigger job scraper',
            'error': str(e)
        }), 500

@api.route('/scraper/status', methods=['GET'])
def get_scraper_status():
    """Get the status of the job scraper"""
    try:
        # Get job counts from MySQL (scraped jobs)
        scraped_jobs = Job.query.filter_by(source='scraped').count()
        
        # Get job counts from MongoDB (manual jobs)
        mongo_stats = UserJob.get_stats()
        manual_jobs = mongo_stats.get('total', 0)
        
        total_jobs = scraped_jobs + manual_jobs
        
        # Get the most recent job from MySQL
        most_recent_sql = Job.query.order_by(Job.updated_at.desc()).first()
        most_recent_sql_time = most_recent_sql.updated_at.strftime('%Y-%m-%d %H:%M:%S') if most_recent_sql else None
        
        # Schedule info from config
        schedule_times = current_app.config.get('SCRAPER_SCHEDULE', {})
        test_interval = current_app.config.get('SCRAPER_TEST_INTERVAL', 3)
        
        return jsonify({
            'success': True,
            'stats': {
                'total_jobs': total_jobs,
                'scraped_jobs': scraped_jobs,
                'manual_jobs': manual_jobs,
                'most_recent_update': most_recent_sql_time
            },
            'schedule': {
                'regular_times': list(schedule_times.values()),
                'test_interval_minutes': test_interval
            },
            'database_health': {
                'mysql': 'connected',
                'mongodb': 'connected'
            }
        }), 200
    
    except Exception as e:
        logger.error(f"Error getting scraper status: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get scraper status',
            'error': str(e)
        }), 500

@api.route('/health/databases', methods=['GET'])
def check_database_health():
    """Check the health of all database connections"""
    result = {
        'success': True,
        'mysql': {'status': 'unknown', 'message': ''},
        'mongodb': {'status': 'unknown', 'message': ''}
    }
    
    # Check MySQL connection
    try:
        # Try a simple query
        job_count = Job.query.count()
        result['mysql'] = {
            'status': 'connected',
            'message': f'Successfully connected. Found {job_count} jobs in MySQL.'
        }
    except Exception as e:
        logger.error(f"MySQL connection error: {str(e)}")
        result['mysql'] = {
            'status': 'error',
            'message': f'Failed to connect: {str(e)}'
        }
        result['success'] = False
    
    # Check MongoDB connection
    try:
        # Try a ping command
        mongo.db.command('ping')
        job_count = mongo.db.user_jobs.count_documents({})
        result['mongodb'] = {
            'status': 'connected',
            'message': f'Successfully connected. Found {job_count} jobs in MongoDB.'
        }
    except Exception as e:
        logger.error(f"MongoDB connection error: {str(e)}")
        result['mongodb'] = {
            'status': 'error',
            'message': f'Failed to connect: {str(e)}'
        }
        result['success'] = False
    
    return jsonify(result)