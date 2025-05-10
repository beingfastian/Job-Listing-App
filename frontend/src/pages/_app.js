'use client';

import "../styles/globals.css";
import { useState, useEffect } from 'react';
import JobList from '@/components/JobList';
import AddJobForm from '@/components/AddJobForm';
import ScrapedJobDashboard from '@/components/ScrapedJobDashboard';
import JobService from '@/services/api';

export default function Home() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'scraped'
  const [dbStatus, setDbStatus] = useState({
    mongodb: 'unknown',
    mysql: 'unknown'
  });

  // Fetch manual jobs from MongoDB
  const fetchManualJobs = async () => {
    try {
      setLoading(true);
      // Fetch only manual jobs (stored in MongoDB)
      const response = await JobService.getJobs({ source: 'manual' });
      
      if (response && response.success) {
        setJobs(response.jobs || []);
        setDbStatus(prev => ({ ...prev, mongodb: 'connected' }));
      } else {
        console.error('Failed to fetch manual jobs', response);
        setDbStatus(prev => ({ ...prev, mongodb: 'error' }));
      }
    } catch (error) {
      console.error('Error fetching manual jobs:', error);
      setDbStatus(prev => ({ ...prev, mongodb: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  // Check MySQL connectivity by fetching scraped job stats
  const checkMySQLConnection = async () => {
    try {
      const response = await JobService.getScraperStatus();
      if (response && response.success) {
        setDbStatus(prev => ({ ...prev, mysql: 'connected' }));
      } else {
        setDbStatus(prev => ({ ...prev, mysql: 'error' }));
      }
    } catch (error) {
      console.error('Error checking MySQL connection:', error);
      setDbStatus(prev => ({ ...prev, mysql: 'error' }));
    }
  };

  // Run on component mount
  useEffect(() => {
    fetchManualJobs();
    checkMySQLConnection();
  }, []);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // If switching to manual tab, refresh manual jobs
    if (tab === 'manual') {
      fetchManualJobs();
    }
  };

  // Handle job added event
  const handleJobAdded = (newJob) => {
    if (newJob.source === 'manual' && activeTab === 'manual') {
      // Add the new job to the top of the list
      setJobs(prevJobs => [newJob, ...prevJobs]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Job Listings Portal</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            dbStatus.mongodb === 'connected' ? 'bg-green-100 text-green-800' : 
            dbStatus.mongodb === 'error' ? 'bg-red-100 text-red-800' : 
            'bg-gray-100 text-gray-800'
          }`}>
            MongoDB: {dbStatus.mongodb === 'connected' ? 'Connected' : 
                      dbStatus.mongodb === 'error' ? 'Error' : 'Checking...'}
          </div>
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            dbStatus.mysql === 'connected' ? 'bg-green-100 text-green-800' : 
            dbStatus.mysql === 'error' ? 'bg-red-100 text-red-800' : 
            'bg-gray-100 text-gray-800'
          }`}>
            MySQL: {dbStatus.mysql === 'connected' ? 'Connected' : 
                    dbStatus.mysql === 'error' ? 'Error' : 'Checking...'}
          </div>
        </div>
      </header>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8">
          <button
            onClick={() => handleTabChange('manual')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'manual'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Manual Jobs (MongoDB)
          </button>
          <button
            onClick={() => handleTabChange('scraped')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'scraped'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Scraped Jobs (MySQL)
          </button>
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'manual' ? (
        <div>
          <h2 className="text-2xl font-bold mb-6">Manage Manual Job Listings</h2>
          {dbStatus.mongodb === 'error' ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <p className="font-bold">MongoDB Connection Error</p>
              <p>Unable to connect to MongoDB database. Please check your backend configuration.</p>
            </div>
          ) : (
            <>
              <AddJobForm onJobAdded={handleJobAdded} />
              <JobList 
                jobs={jobs} 
                loading={loading} 
                refreshJobs={fetchManualJobs} 
              />
            </>
          )}
        </div>
      ) : (
        <div>
          {dbStatus.mysql === 'error' ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <p className="font-bold">MySQL Connection Error</p>
              <p>Unable to connect to MySQL database. Please check your backend configuration.</p>
            </div>
          ) : (
            <ScrapedJobDashboard />
          )}
        </div>
      )}
    </div>
  );
}