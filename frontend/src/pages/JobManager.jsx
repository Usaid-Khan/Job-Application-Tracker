import { useState, useRef } from 'react';
import axios from 'axios';
import { Briefcase, Loader, LogOut, FileUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function JobManager() {
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'update'
  const [jobId, setJobId] = useState('');
  
  // State matching backend model
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    jobLink: '',
    status: 'Applied',
    contactPerson: '',
    note: ''
  });

  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState('resume');
  const fileInputRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      if (activeTab === 'update') {
        if (!jobId) {
          setMessage('Please provide a Job ID to update.');
          setMessageType('error');
          setIsLoading(false);
          return;
        }

        // 1. Update text metadata
        await axios.put(`/api/jobs/${jobId}`, formData, config);
        
        // 2. If an additional file was attached during update, send it to the document endpoint separately
        if (file) {
          const documentData = new FormData();
          documentData.append('file', file);
          documentData.append('type', fileType);
          await axios.post(`/api/jobs/${jobId}/document`, documentData, config);
        }

        setMessage('Job updated successfully!');
      } else {
        // Create Request handles text and file on the same route!
        const createData = new FormData();
        createData.append('company', formData.company);
        createData.append('position', formData.position);
        createData.append('jobLink', formData.jobLink);
        createData.append('status', formData.status);
        createData.append('contactPerson', formData.contactPerson);
        createData.append('note', formData.note);
        
        if (file) {
          createData.append('file', file);
          createData.append('type', fileType);
        }

        await axios.post('/api/jobs', createData, config);
        setMessage('Job created successfully!');
        
        // Reset purely visual data
        setFormData({ company: '', position: '', jobLink: '', status: 'Applied', contactPerson: '', note: '' });
        setFile(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
      }
      setMessageType('success');
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout();
      }
      setMessage(err.response?.data?.message || 'Error occurred while saving job.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-grow container mx-auto px-4 py-12 flex justify-center">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Briefcase className="w-8 h-8 text-primary" />
              Manage Jobs
            </h1>
            <p className="text-slate-300 mt-1">Create or update your job applications</p>
          </div>
          <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors hover:cursor-pointer" title="Logout">
            <LogOut className="w-6 h-6" />
          </button>
        </div>

        <div className="glass-card overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-700/50">
            <button
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'create' ? 'text-primary border-b-2 border-primary bg-slate-800/50' : 'text-slate-400 hover:text-slate-200 hover:cursor-pointer'
              }`}
              onClick={() => { setActiveTab('create'); setMessage(''); }}
            >
              Create New Job
            </button>
            <button
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'update' ? 'text-primary border-b-2 border-primary bg-slate-800/50' : 'text-slate-400 hover:text-slate-200 hover:cursor-pointer'
              }`}
              onClick={() => { setActiveTab('update'); setMessage(''); }}
            >
              Update Existing Job
            </button>
          </div>

          <div className="p-8 bg-gray-900">
            {message && (
              <div className={`mb-6 p-4 rounded-lg border text-sm ${
                messageType === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {activeTab === 'update' && (
                <div className="pb-4 border-b border-slate-700/50 mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Target Job ID *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="Enter the Job ID to update"
                    value={jobId}
                    onChange={(e) => setJobId(e.target.value)}
                  />
                  <p className="text-xs text-slate-500 mt-2">The fields below will override the existing job data. Any file attached below will be ADDED to the existing job.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Company Name *</label>
                  <input
                    name="company"
                    required={activeTab === 'create'}
                    className="input"
                    placeholder="e.g. Google"
                    value={formData.company}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Position Title *</label>
                  <input
                    name="position"
                    required={activeTab === 'create'}
                    className="input"
                    placeholder="e.g. Frontend Developer"
                    value={formData.position}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Job Link</label>
                <input
                  name="jobLink"
                  type="url"
                  className="input"
                  placeholder="https://careers.google.com/..."
                  value={formData.jobLink}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Current Status</label>
                  <select
                    name="status"
                    className="input appearance-none bg-slate-800/80 hover:cursor-pointer"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="Applied">Applied</option>
                    <option value="Screening">Screening</option>
                    <option value="Interview">Interview</option>
                    <option value="Offer">Offer</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Contact Info</label>
                  <input
                    name="contactPerson"
                    className="input"
                    placeholder="e.g. recruiter@google.com"
                    value={formData.contactPerson}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Notes</label>
                <textarea
                  name="note"
                  className="input min-h-[80px]"
                  placeholder="Any extra details, interview dates, etc..."
                  value={formData.note}
                  onChange={handleChange}
                ></textarea>
              </div>

              {/* Attachments Section */}
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-5 mt-2">
                <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                  <FileUp className="w-4 h-4 text-primary" /> Attach Document
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Document Type</label>
                    <select
                      className="input appearance-none bg-slate-800/80 text-sm py-2 hover:cursor-pointer"
                      value={fileType}
                      onChange={(e) => setFileType(e.target.value)}
                    >
                      <option value="resume">Resume</option>
                      <option value="cover_letter">Cover Letter</option>
                      <option value="job_description">Job Description</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">File</label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-sky-600 hover:file:bg-primary/10 outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full mt-6 py-3 hover:cursor-pointer"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader className="w-5 h-5 animate-spin" /> Processing...
                  </div>
                ) : (
                  activeTab === 'create' ? 'Create Application' : 'Update Application'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
