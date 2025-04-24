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

  const handleDeleteJob = async (jobId) => {
    try {
      const response = await JobService.deleteJob(jobId);
      if (response && response.success) {
        if (refreshJobs) refreshJobs();
      } else {
        console.error('Failed to delete job', response);
        alert('Failed to delete job. Please try again.');
      }
    } catch (err) {
      console.error('Error deleting job:', err);
      alert('Failed to delete job. Please try again.');
    }
  };

  // Filter jobs based on current filters
  const filteredJobs = jobs.filter(job => {
    return (
      (!filters.company || job.company.toLowerCase().includes(filters.company.toLowerCase())) &&
      (!filters.location || job.location?.toLowerCase().includes(filters.location.toLowerCase())) &&
      (!filters.job_type || job.job_type?.toLowerCase().includes(filters.job_type.toLowerCase()))
    );
  });

  return (
    <div>
      <JobFilter 
        filters={filters}
        onFilterChange={setFilters}
      />
      
      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="mt-2 text-gray-600">Loading job listings...</p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex justify-between items-center">
            <p className="text-gray-600">
              {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
            </p>
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