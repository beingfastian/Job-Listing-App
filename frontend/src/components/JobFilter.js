'use client';

import { useState, useEffect } from 'react';
import JobService from '@/services/api';

export default function JobFilter({ filters, onFilterChange }) {
  // Static predefined filter options
  const locationOptions = ["Karachi", "Lahore", "Islamabad", "Multan"];
  const jobTypeOptions = ["Full Time", "Part Time", "Contract", "Remote", "Internship"];
  const [companyOptions, setCompanyOptions] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    company: '',
    location: '',
    job_type: ''
  });
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters({
      company: filters?.company || '',
      location: filters?.location || '',
      job_type: filters?.job_type || ''
    });
  }, [filters]);

  // Calculate active filter count
  useEffect(() => {
    const count = Object.values(localFilters).filter(value => value).length;
    setActiveFilterCount(count);
  }, [localFilters]);

  // Attempt to fetch company options from API
  useEffect(() => {
    const fetchCompanyOptions = async () => {
      try {
        setLoading(true);
        const stats = await JobService.getJobStats();
        if (stats?.success && stats?.companies) {
          const newCompanies = stats.companies
            .map(item => item.company)
            .filter(company => company && !companyOptions.includes(company));
  
          setCompanyOptions(prev => [...prev, ...newCompanies]);
        }
      } catch (error) {
        console.error('Error loading company options:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchCompanyOptions();
  }, []);
  

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply filters
  const applyFilters = () => {
    onFilterChange(localFilters);
  };

  // Clear all filters
  const clearFilters = () => {
    const resetFilters = {
      company: '',
      location: '',
      job_type: ''
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="bg-white border rounded-lg shadow-md mb-8 overflow-hidden transition-all duration-300">
      <div 
        className="p-5 flex justify-between items-center cursor-pointer bg-gradient-to-r from-gray-50 to-white hover:from-blue-50 hover:to-white transition-colors duration-300"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-2 text-blue-600" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900">
            Filter Jobs
          </h3>
        </div>
        <div className="flex items-center">
          {activeFilterCount > 0 && (
            <div className="mr-3 flex items-center">
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center">
                {activeFilterCount}
              </span>
              <span className="ml-2 text-sm text-blue-700 hidden sm:inline">
                {activeFilterCount === 1 ? 'Filter' : 'Filters'} active
              </span>
            </div>
          )}
          <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
            <svg 
              className="w-5 h-5 text-gray-500"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expanded ? 'max-h-96' : 'max-h-0'}`}>
        <div className="p-5 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Company Filter */}
            <div className="space-y-2">
              <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                Company
              </label>
              <div className="relative">
                <select
                  id="company"
                  name="company"
                  value={localFilters.company}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 pl-3 pr-10 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                >
                  <option value="">All Companies</option>
                  {companyOptions.map((company, index) => (
                    <option key={`company-${index}`} value={company}>{company}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              {localFilters.company && (
                <div className="flex items-center mt-1 text-sm text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Filtering by company</span>
                </div>
              )}
            </div>
            
            {/* Location Filter */}
            <div className="space-y-2">
  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
    Location
  </label>
  <div className="relative">
    <select
      id="location"
      name="location"
      value={localFilters.location}
      onChange={handleInputChange}
      className="block w-full rounded-md border-gray-300 pl-3 pr-10 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
    >
      <option value="">All Locations</option>
      {locationOptions.map((location, index) => (
        <option key={`location-${index}`} value={location}>{location}</option>
      ))}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </div>
  </div>
  {localFilters.location && (
    <div className="flex items-center mt-1 text-sm text-blue-600">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      <span>Filtering by location</span>
    </div>
  )}
</div>

            
            {/* Job Type Filter */}
            <div className="space-y-2">
  <label htmlFor="job_type" className="block text-sm font-medium text-gray-700">
    Job Type
  </label>
  <div className="relative">
    <select
      id="job_type"
      name="job_type"
      value={localFilters.job_type}
      onChange={handleInputChange}
      className="block w-full rounded-md border-gray-300 pl-3 pr-10 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
    >
      <option value="">All Job Types</option>
      {jobTypeOptions.map((type, index) => (
        <option key={`job-type-${index}`} value={type}>{type}</option>
      ))}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </div>
  </div>
  {localFilters.job_type && (
    <div className="flex items-center mt-1 text-sm text-blue-600">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      <span>Filtering by job type</span>
    </div>
  )}
</div>
</div>

<div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={clearFilters}
              disabled={activeFilterCount === 0}
              className={`flex items-center justify-center px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-md ${
                activeFilterCount === 0 
                  ? 'text-gray-400 bg-gray-50 cursor-not-allowed' 
                  : 'text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear All Filters
            </button>
            <button
              type="button"
              onClick={applyFilters}
              className="flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
    );
  }