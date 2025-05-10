'use client';

import { useState } from 'react';
import JobService from '@/services/api';
import JobItem from './JobItem';
import JobFilter from './JobFilter';

export default function JobList({ jobs = [], loading, refreshJobs }) {
  const [filters, setFilters] = useState({
    company: '',
    location: '',
    job_type: ''
  });
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [error, setError] = useState(null);

  const handleDeleteJob = async (jobId) => {
    try {
      setError(null);
      setDeleteInProgress(true);
      console.log(`JobList: Deleting job with ID ${jobId}`);
      
      const response = await JobService.deleteJob(jobId);
      
      if (response && response.success) {
        console.log("Delete successful:", response);
        if (refreshJobs) {
          // Refresh the jobs list after successful deletion
          refreshJobs();
        }
      } else {
        console.error('Failed to delete job', response);
        setError(`Failed to delete job: ${response?.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error deleting job:', err);
      let errorMessage = 'Failed to delete job. Please try again.';
      
      // Get more details from the error response if available
      if (err.response && err.response.data) {
        errorMessage += ` (${err.response.data.message || err.response.data.error || ''})`;
      }
      
      setError(errorMessage);
    } finally {
      setDeleteInProgress(false);
    }
  };

  // Filter jobs based on current filters
  const filteredJobs = jobs.filter(job => {
    return (
      (!filters.company || (job.company && job.company.toLowerCase().includes(filters.company.toLowerCase()))) &&
      (!filters.location || (job.location && job.location.toLowerCase().includes(filters.location.toLowerCase()))) &&
      (!filters.job_type || (job.job_type && job.job_type.toLowerCase().includes(filters.job_type.toLowerCase())))
    );
  });

  return (
    <div>
      <JobFilter 
        filters={filters}
        onFilterChange={setFilters}
      />
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {loading || deleteInProgress ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="mt-2 text-gray-600">
            {deleteInProgress ? 'Deleting job...' : 'Loading job listings...'}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex justify-between items-center">
            <p className="text-gray-600">
              {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found 
              <span className="ml-1 text-gray-400">(from MongoDB)</span>
            </p>
            
            <div className="flex items-center">
              <button 
                onClick={refreshJobs}
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
          
          {filteredJobs.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No jobs found. Try adjusting your filters or add a new job.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map(job => (
                <JobItem 
                  key={job.id} 
                  job={job} 
                  onDelete={handleDeleteJob} 
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}