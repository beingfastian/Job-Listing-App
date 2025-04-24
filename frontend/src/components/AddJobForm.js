'use client';

import { useState } from 'react';
import JobService from '@/services/api';

export default function AddJobForm({ onJobAdded }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
    posting_date: new Date().toISOString().split('T')[0],
    url: '',
    salary: '',
    job_type: 'Full-time'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await JobService.addJob(formData);
      if (response.success) {
        onJobAdded(response.job);
        setIsOpen(false);
        setFormData({
          title: '',
          company: '',
          location: '',
          description: '',
          posting_date: new Date().toISOString().split('T')[0],
          url: '',
          salary: '',
          job_type: 'Full-time'
        });
      } else {
        setError(response.message || 'Failed to add job');
      }
    } catch (err) {
      setError('Error adding job: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-8">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-5 rounded-lg flex items-center shadow-md transition duration-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add New Job
        </button>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-8 transition duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Post a New Job</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 transition duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Job Title*', id: 'title', type: 'text' },
                { label: 'Company*', id: 'company', type: 'text' },
                { label: 'Location', id: 'location', type: 'text' },
                { label: 'Salary', id: 'salary', type: 'text' },
                { label: 'Posting Date', id: 'posting_date', type: 'date' },
                { label: 'Job URL', id: 'url', type: 'url' }
              ].map(({ label, id, type }) => (
                <div key={id}>
                  <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type={type}
                    id={id}
                    name={id}
                    required={label.includes('*')}
                    value={formData[id]}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-200"
                  />
                </div>
              ))}

              <div>
                <label htmlFor="job_type" className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                <select
                  id="job_type"
                  name="job_type"
                  value={formData.job_type}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-200"
                >
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Internship</option>
                  <option>Remote</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
              <textarea
                id="description"
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-200"
              ></textarea>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 bg-white hover:bg-gray-100 transition duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition duration-300 disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Job'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}