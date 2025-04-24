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

  // Add a new job
  addJob: async (jobData) => {
    try {
      const response = await apiClient.post('/jobs', jobData);
      return response.data;
    } catch (error) {
      console.error('Error adding job:', error);
      throw error;
    }
  },

  // Delete a job
  deleteJob: async (jobId) => {
    try {
      const response = await apiClient.delete(`/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  }
};

export default JobService;