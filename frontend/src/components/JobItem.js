'use client';

import { useState } from 'react';

export default function JobItem({ job, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date)
      ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : dateString;
  };

  // Handle delete button click
  const handleDeleteClick = (e) => {
    e.stopPropagation();
    
    if (confirmDelete) {
      try {
        // Clear any previous errors
        setDeleteError(null);
        
        // Make sure we have a valid ID
        if (!job.id) {
          setDeleteError("Missing job ID");
          return;
        }
        
        console.log(`Attempting to delete job with ID: ${job.id}`);
        onDelete(job.id);
        setConfirmDelete(false);
      } catch (error) {
        console.error("Error in delete handler:", error);
        setDeleteError("Failed to delete job");
      }
    } else {
      setConfirmDelete(true);
      // Auto-reset confirmation after 3 seconds
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  // Determine database source - MongoDB IDs are 24-character hex strings
  const isMongoDBJob = typeof job.id === 'string' && job.id.match(/^[0-9a-f]{24}$/i);

  return (
    <div className="border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 bg-white overflow-hidden">
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-blue-900">{job.title}</h3>
            <div className="mt-1 text-gray-600">
              <span className="font-medium">{job.company}</span>
              {job.location && (
                <span className="ml-2 text-gray-500">
                  <span className="mx-1">•</span> {job.location}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Show badge based on data source */}
            {job.source === 'scraped' ? (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Scraped</span>
            ) : (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Manual</span>
            )}
            <span className="text-sm text-gray-500">{formatDate(job.posting_date)}</span>
            <button
              onClick={handleDeleteClick}
              className={`ml-2 p-1 rounded-full ${
                confirmDelete ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-red-500'
              }`}
              title={confirmDelete ? "Click again to confirm" : "Delete job"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Job metadata */}
        <div className="mt-2 flex flex-wrap gap-2">
          {job.job_type && (
            <span className="inline-block bg-gray-100 rounded-full px-3 py-1 text-xs font-semibold text-gray-700">
              {job.job_type}
            </span>
          )}
          {job.salary && (
            <span className="inline-block bg-green-100 rounded-full px-3 py-1 text-xs font-semibold text-green-700">
              {job.salary}
            </span>
          )}
          {job.experience_level && (
            <span className="inline-block bg-purple-100 rounded-full px-3 py-1 text-xs font-semibold text-purple-700">
              {job.experience_level}
            </span>
          )}
          {isMongoDBJob && (
            <span className="inline-block bg-yellow-100 rounded-full px-3 py-1 text-xs font-semibold text-yellow-700">
              MongoDB
            </span>
          )}
        </div>
        
        {/* Display delete error if any */}
        {deleteError && (
          <div className="mt-2 p-2 text-sm text-red-700 bg-red-100 rounded">
            Error: {deleteError}
          </div>
        )}
        
        {/* Expanded content */}
        {expanded && (
          <div className="mt-4 border-t pt-4">
            {job.description ? (
              <div className="text-gray-700 whitespace-pre-line">
                {job.description}
              </div>
            ) : (
              <p className="text-gray-500 italic">No description available</p>
            )}
            
            {job.url && (
              <div className="mt-4">
                <a 
                  href={job.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Job
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
            
            {/* Show additional metadata in expanded view */}
            <div className="mt-4 pt-3 border-t border-gray-200 text-sm text-gray-500">
              <p>Source: {job.source}</p>
              <p>ID: {job.id}</p>
              <p>Created: {formatDate(job.created_at)}</p>
              <p>Last Updated: {formatDate(job.updated_at)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}