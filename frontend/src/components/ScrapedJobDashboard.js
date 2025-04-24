'use client';

import { useState, useEffect } from 'react';
import JobService from '@/services/api';
import JobItem from './JobItem';
import JobFilter from './JobFilter';

export default function ScrapedJobDashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    companies: [],
    locations: []
  });
  const [filters, setFilters] = useState({
    company: '',
    location: '',
    job_type: ''
  });

  // Fetch only scraped jobs
  const fetchScrapedJobs = async () => {
    try {
      setLoading(true);
      // Add source=scraped to the filters
      const params = { ...filters, source: 'scraped' };
      const response = await JobService.getJobs(params);
      
      if (response && response.success) {
        setJobs(response.jobs || []);
      } else {
        console.error('Failed to fetch scraped jobs', response);
      }
    } catch (error) {
      console.error('Error fetching scraped jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch job statistics
  const fetchJobStats = async () => {
    try {
      const response = await JobService.getJobStats();
      if (response && response.success) {
        setStats({
          total: response.total_jobs || 0,
          companies: response.companies || [],
          locations: response.locations || []
        });
      }
    } catch (error) {
      console.error('Error fetching job stats:', error);
    }
  };

  // Run once on component mount
  useEffect(() => {
    fetchScrapedJobs();
    fetchJobStats();
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    fetchScrapedJobs();
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Handle job deletion
  const handleDeleteJob = async (jobId) => {
    try {
      const response = await JobService.deleteJob(jobId);
      if (response && response.success) {
        // Remove the deleted job from the state
        setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
        // Refresh stats after deletion
        fetchJobStats();
      } else {
        console.error('Failed to delete job', response);
        alert('Failed to delete job. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job. Please try again.');
    }
  };

  // Handle manual scraper trigger
  const triggerScraper = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/scraper/run`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Scraper started successfully in the background.');
        // Wait 5 seconds before refreshing to give the scraper time to work
        setTimeout(() => {
          fetchScrapedJobs();
          fetchJobStats();
        }, 5000);
      } else {
        alert('Failed to start scraper: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error triggering scraper:', error);
      alert('Error triggering scraper: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Get scraped jobs count
  const scrapedJobsCount = jobs.length;
  const scrapedCompanies = stats.companies.filter(company => 
    jobs.some(job => job.company === company.company)
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-0">Scraped Jobs Dashboard</h2>
        <button
          onClick={triggerScraper}
          disabled={loading}
          className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 disabled:bg-indigo-400"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Run Scraper Now
            </>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="text-sm font-medium text-blue-800 mb-1">Total Scraped Jobs</h3>
          <p className="text-2xl font-bold text-blue-900">{scrapedJobsCount}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <h3 className="text-sm font-medium text-green-800 mb-1">Companies</h3>
          <p className="text-2xl font-bold text-green-900">{scrapedCompanies.length}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <h3 className="text-sm font-medium text-purple-800 mb-1">Last Updated</h3>
          <p className="text-lg font-medium text-purple-900">
            {jobs[0] ? new Date(jobs[0].updated_at).toLocaleString() : 'No data'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <JobFilter 
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Jobs list */}
      {loading && scrapedJobsCount === 0 ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="mt-2 text-gray-600">Loading scraped jobs...</p>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <p className="text-gray-600">
              {scrapedJobsCount} scraped job{scrapedJobsCount !== 1 ? 's' : ''} found
            </p>
          </div>
          
          {scrapedJobsCount === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No scraped jobs found. Try running the scraper or adjusting your filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map(job => (
                <JobItem 
                  key={job.id} 
                  job={job} 
                  onDelete={handleDeleteJob} 
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}