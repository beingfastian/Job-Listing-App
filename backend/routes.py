from flask import Blueprint, jsonify, request, current_app
from models import db, Job
from datetime import datetime
import logging
from scraper.bot import scrape_jobs

# Set up logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
api = Blueprint('api', __name__)

@api.route('/jobs', methods=['GET'])
def get_jobs():
    """Get all job listings with optional filtering and sorting"""
    try:
        # Get query parameters for filtering
        company = request.args.get('company')
        location = request.args.get('location')
        job_type = request.args.get('job_type')
        source = request.args.get('source')
        sort_by = request.args.get('sort_by', 'created_at')  # Default sort by creation date
        sort_order = request.args.get('sort_order', 'desc')  # Default descending
        
        # Start with base query
        query = Job.query
        
        # Apply filters if provided
        if company:
            query = query.filter(Job.company.ilike(f'%{company}%'))
        if location:
            query = query.filter(Job.location.ilike(f'%{location}%'))
        if job_type:
            query = query.filter(Job.job_type.ilike(f'%{job_type}%'))
        if source:
            query = query.filter(Job.source == source)
        
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
        
        # Validate required fields
        required_fields = ['title', 'company']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Handle date conversion
        posting_date = None
        if 'posting_date' in data and data['posting_date']:
            try:
                posting_date = datetime.strptime(data['posting_date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'Invalid date format. Use YYYY-MM-DD'
                }), 400
        
        # Create new job
        new_job = Job(
            title=data['title'],
            company=data['company'],
            location=data.get('location'),
            description=data.get('description'),
            posting_date=posting_date,
            url=data.get('url'),
            salary=data.get('salary'),
            job_type=data.get('job_type'),
            experience_level=data.get('experience_level'),
            source=data.get('source', 'manual')
        )
        
        db.session.add(new_job)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Job added successfully',
            'job': new_job.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error adding job: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to add job',
            'error': str(e)
        }), 500

@api.route('/jobs/<int:job_id>', methods=['DELETE'])
def delete_job(job_id):
    """Delete a job listing by ID"""
    try:
        job = Job.query.get(job_id)
        
        if not job:
            return jsonify({
                'success': False,
                'message': f'Job with ID {job_id} not found'
            }), 404
        
        db.session.delete(job)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Job with ID {job_id} deleted successfully'
        }), 200
    
    except Exception as e:
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
        total_jobs = Job.query.count()
        companies = db.session.query(Job.company, db.func.count(Job.id)).group_by(Job.company).all()
        companies_stats = [{'company': company, 'count': count} for company, count in companies]
        
        locations = db.session.query(Job.location, db.func.count(Job.id)).group_by(Job.location).all()
        locations_stats = [{'location': location, 'count': count} for location, count in locations]
        
        job_types = db.session.query(Job.job_type, db.func.count(Job.id)).group_by(Job.job_type).all()
        job_types_stats = [{'job_type': job_type, 'count': count} for job_type, count in job_types]
        
        sources = db.session.query(Job.source, db.func.count(Job.id)).group_by(Job.source).all()
        sources_stats = [{'source': source, 'count': count} for source, count in sources]
        
        return jsonify({
            'success': True,
            'total_jobs': total_jobs,
            'companies': companies_stats,
            'locations': locations_stats,
            'job_types': job_types_stats,
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
        # Get job counts
        total_jobs = Job.query.count()
        scraped_jobs = Job.query.filter_by(source='scraped').count()
        manual_jobs = Job.query.filter_by(source='manual').count()
        
        # Get the most recent job
        most_recent = Job.query.order_by(Job.updated_at.desc()).first()
        most_recent_time = most_recent.updated_at.strftime('%Y-%m-%d %H:%M:%S') if most_recent else None
        
        # Get schedule info from config
        schedule_times = current_app.config.get('SCRAPER_SCHEDULE', {})
        test_interval = current_app.config.get('SCRAPER_TEST_INTERVAL', 3)
        
        return jsonify({
            'success': True,
            'stats': {
                'total_jobs': total_jobs,
                'scraped_jobs': scraped_jobs,
                'manual_jobs': manual_jobs,
                'most_recent_update': most_recent_time
            },
            'schedule': {
                'regular_times': list(schedule_times.values()),
                'test_interval_minutes': test_interval
            }
        }), 200
    
    except Exception as e:
        logger.error(f"Error getting scraper status: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get scraper status',
            'error': str(e)
        }), 500