'use client';
// In _app.js
import "../styles/globals.css";
import { useState, useEffect } from 'react';
import JobList from '@/components/JobList';
import AddJobForm from '@/components/AddJobForm';
import ScrapedJobDashboard from '@/components/ScrapedJobDashboard'; // Import the new component
import JobService from '@/services/api';

export default function Home() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'scraped'

  const fetchJobs = async () => {
    try {
      setLoading(true);
      // Only fetch manual jobs for the job list
      const response = await JobService.getJobs({ source: 'manual' });
      if (response && response.jobs) {
        setJobs(response.jobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleJobAdded = (newJob) => {
    if (newJob.source === 'manual') {
      setJobs(prevJobs => [newJob, ...prevJobs]);
    }
    // If scraped job was added and we're on the manual tab, no need to update
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Job Listings Portal</h1>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('manual')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'manual'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Manual Jobs
          </button>
          <button
            onClick={() => setActiveTab('scraped')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'scraped'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Scraped Jobs Dashboard
          </button>
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'manual' ? (
        <div>
          <h2 className="text-2xl font-bold mb-6">Manage Manual Job Listings</h2>
          <AddJobForm onJobAdded={handleJobAdded} />
          <JobList 
            jobs={jobs} 
            loading={loading} 
            refreshJobs={fetchJobs} 
          />
        </div>
      ) : (
        <ScrapedJobDashboard />
      )}
    </div>
  );
}