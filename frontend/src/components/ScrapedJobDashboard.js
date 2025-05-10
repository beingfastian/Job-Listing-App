'use client';

import { useState, useEffect } from 'react';
import JobService from '@/services/api';
import JobItem from './JobItem';
import JobFilter from './JobFilter';

export default function ScrapedJobDashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrapingInProgress, setScrapingInProgress] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    companies: [],
    locations: []
  });
  const [scraperStatus, setScraperStatus] = useState(null);
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
          locations: response.locations || [],
          sources: response.sources || []
        });
      }
    } catch (error) {
      console.error('Error fetching job stats:', error);
    }
  };

  // Fetch scraper status
  const fetchScraperStatus = async () => {
    try {
      const response = await JobService.getScraperStatus();
      if (response && response.success) {
        setScraperStatus(response);
      }
    } catch (error) {
      console.error('Error fetching scraper status:', error);
    }
  };

  // Run once on component mount
  useEffect(() => {
    fetchScrapedJobs();
    fetchJobStats();
    fetchScraperStatus();
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
      setScrapingInProgress(true);
      const response = await JobService.runScraper();
      
      if (response && response.success) {
        const jobsProcessed = response.jobs_processed || 0;
        alert(`Scraper completed successfully. ${jobsProcessed} new jobs processed.`);
        
        // Refresh the data
        await fetchScrapedJobs();
        await fetchJobStats();
        await fetchScraperStatus();
      } else {
        alert('Failed to run scraper: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error triggering scraper:', error);
      alert('Error triggering scraper: ' + error.message);
    } finally {
      setScrapingInProgress(false);
    }
  };

  // Get scraped jobs count
  const scrapedJobsCount = jobs.length;
  
  // Get total scraped jobs from stats
  const scrapedJobsTotal = stats.sources?.find(source => source.source === 'scraped')?.count || 0;
  
  // Extract companies from scraped jobs
  const scrapedCompanies = new Set(jobs.map(job => job.company)).size;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-0">Scraped Jobs Dashboard</h2>
        <button
          onClick={triggerScraper}
          disabled={loading || scrapingInProgress}
          className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 disabled:bg-indigo-400"
        >
          {loading || scrapingInProgress ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {scrapingInProgress ? 'Scraping...' : 'Loading...'}
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
          <p className="text-2xl font-bold text-blue-900">{scrapedJobsTotal}</p>
          <p className="text-xs text-blue-700 mt-1">{scrapedJobsCount} shown with current filters</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <h3 className="text-sm font-medium text-green-800 mb-1">Companies</h3>
          <p className="text-2xl font-bold text-green-900">{scrapedCompanies}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <h3 className="text-sm font-medium text-purple-800 mb-1">Last Updated</h3>
          <p className="text-lg font-medium text-purple-900">
            {scraperStatus?.stats?.most_recent_update 
              ? new Date(scraperStatus.stats.most_recent_update).toLocaleString() 
              : 'No data'}
          </p>
          {scraperStatus?.schedule?.regular_times && (
            <p className="text-xs text-purple-700 mt-1">Scheduled at: {scraperStatus.schedule.regular_times.join(', ')}</p>
          )}
        </div>
      </div>

      {/* Filters */}
      <JobFilter 
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Jobs list */}
      {loading ? (
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