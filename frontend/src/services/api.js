import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const JobService = {
  // Get all jobs with optional filters
  getJobs: async (filters = {}) => {
    try {
      const response = await apiClient.get('/jobs', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  },

  // Get job statistics
  getJobStats: async () => {
    try {
      const response = await apiClient.get('/jobs/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching job statistics:', error);
      throw error;
    }
  },

  // Add a new job (always adds to MongoDB)
  addJob: async (jobData) => {
    try {
      // Ensure source is set to manual for MongoDB storage
      const data = { ...jobData, source: 'manual' };
      const response = await apiClient.post('/jobs', data);
      return response.data;
    } catch (error) {
      console.error('Error adding job:', error);
      throw error;
    }
  },

  // Delete a job (works with both MongoDB and MySQL IDs)
  deleteJob: async (jobId) => {
    try {
      console.log(`Deleting job with ID: ${jobId}`);
      // Check if this is a MongoDB ObjectId (24-character hex string)
      const isMongoId = typeof jobId === 'string' && jobId.match(/^[0-9a-f]{24}$/i);
      
      // Make sure the ID is properly encoded in the URL
      const encodedId = encodeURIComponent(jobId);
      
      const response = await apiClient.delete(`/jobs/${encodedId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting job:', error);
      console.error('Error details:', error.response ? error.response.data : 'No response data');
      throw error;
    }
  },

  // Get scraper status
  getScraperStatus: async () => {
    try {
      const response = await apiClient.get('/scraper/status');
      return response.data;
    } catch (error) {
      console.error('Error fetching scraper status:', error);
      throw error;
    }
  },

  // Run the scraper manually
  runScraper: async () => {
    try {
      const response = await apiClient.post('/scraper/run');
      return response.data;
    } catch (error) {
      console.error('Error running scraper:', error);
      throw error;
    }
  },
  
  // Check database health
  checkDatabaseHealth: async () => {
    try {
      const response = await apiClient.get('/health/databases');
      return response.data;
    } catch (error) {
      console.error('Error checking database health:', error);
      throw error;
    }
  }
};

export default JobService;