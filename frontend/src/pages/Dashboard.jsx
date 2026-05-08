import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
  Briefcase, CheckCircle, Clock, XCircle, Search, Filter,
  ChevronRight, Calendar, ExternalLink, Plus, MoreVertical, Trash2, Edit3, Bell, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const STATUS_COLORS = {
  'Applied': '#3b82f6',
  'Screening': '#eab308',
  'Interview': '#6366f1',
  'Offer': '#22c55e',
  'Rejected': '#ef4444'
};

const StatusBadge = ({ status, onUpdate, isUpdating, index, total }) => {
  const [showOptions, setShowOptions] = useState(false);
  const menuRef = useRef(null);
  const statuses = ['Applied', 'Screening', 'Interview', 'Offer', 'Rejected'];
  const isLastRow = total > 2 && index >= total - 1;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };

    if (showOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showOptions]);

  const getStyles = () => {
    switch (status) {
      case 'Applied': return 'status-applied';
      case 'Screening': return 'status-screening';
      case 'Interview': return 'status-interview';
      case 'Offer': return 'status-offer';
      case 'Rejected': return 'status-rejected';
      default: return '';
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={isUpdating}
        className={`status-badge ${getStyles()} cursor-pointer hover:brightness-110 transition-all active:scale-95 disabled:opacity-50`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {status}
      </button>

      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ opacity: 0, y: isLastRow ? -10 : 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isLastRow ? -10 : 10, scale: 0.95 }}
            className={`absolute left-0 ${isLastRow ? 'bottom-full mb-2' : 'mt-2'} w-32 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-20 overflow-hidden`}
          >
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => {
                  onUpdate(s);
                  setShowOptions(false);
                }}
                className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-700 transition-colors ${s === status ? 'text-primary font-bold bg-primary/5' : 'text-slate-300'}`}
              >
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Reminder State
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [reminderDate, setReminderDate] = useState('');
  const [isUpdatingReminder, setIsUpdatingReminder] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    fetchJobs();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/jobs/user-dashboard-data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(res.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      if (err.response?.status === 401) navigate('/login');
    }
  };

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(res.data.data);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  };

  const handleUpdateStatus = async (jobId, newStatus) => {
    setUpdatingStatusId(jobId);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/jobs/${jobId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh both to update charts and table
      fetchJobs();
      fetchDashboardData();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status.');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleSetReminder = async (e) => {
    e.preventDefault();
    if (!selectedJob || !reminderDate) return;

    setIsUpdatingReminder(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/jobs/${selectedJob._id}/reminder`,
        { reminderDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowReminderModal(false);
      fetchJobs();
    } catch (err) {
      console.error('Error setting reminder:', err);
      alert('Failed to set reminder. Please try again.');
    } finally {
      setIsUpdatingReminder(false);
    }
  };

  const handleDeleteJob = async (id) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/jobs/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchJobs();
        fetchDashboardData();
      } catch (err) {
        console.error('Error deleting job:', err);
      }
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || job.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Transform data for charts
  const statusChartData = dashboardData?.statusStats.map(stat => ({
    name: stat._id,
    value: stat.count,
    color: STATUS_COLORS[stat._id] || '#94a3b8'
  })) || [];

  const monthlyChartData = dashboardData?.monthlyStats.map(stat => ({
    month: new Date(stat._id.year, stat._id.month - 1).toLocaleString('default', { month: 'short' }),
    count: stat.count
  })) || [];

  return (
    <div className="flex-grow container mx-auto px-6 py-8 pb-20">
      {/* Reminder Modal */}
      <AnimatePresence>
        {showReminderModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReminderModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-2xl p-8 w-full max-w-md relative z-10 shadow-2xl"
            >
              <button
                onClick={() => setShowReminderModal(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="bg-yellow-500/10 p-3 rounded-xl">
                  <Bell className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Set Reminder</h3>
                  <p className="text-sm text-slate-400">Schedule your next steps</p>
                </div>
              </div>

              <form onSubmit={handleSetReminder} className="space-y-5">
                {!selectedJob && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Select Application Number (#)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="e.g. 1"
                        min="1"
                        max={jobs.length}
                        className="input w-24"
                        onChange={(e) => {
                          const index = parseInt(e.target.value) - 1;
                          if (jobs[index]) {
                            setSelectedJob(jobs[index]);
                          } else {
                            setSelectedJob(null);
                          }
                        }}
                      />
                      <div className="flex-grow bg-slate-800/30 border border-slate-700/50 rounded-lg px-4 py-3 flex items-center">
                        <span className="text-slate-400 text-sm truncate">
                          {selectedJob ? `${selectedJob.company} - ${selectedJob.position}` : "Enter number to select..."}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedJob && (
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-1">
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Active Selection</p>
                    <h4 className="text-white font-semibold">{selectedJob.company}</h4>
                    <p className="text-xs text-slate-400">{selectedJob.position}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Reminder Type & Time</label>
                  <div className="relative group">
                    <input
                      type="datetime-local"
                      required
                      className="input w-full pr-10 custom-datetime-input"
                      value={reminderDate}
                      onChange={(e) => setReminderDate(e.target.value)}
                      onClick={(e) => e.target.showPicker?.()}
                    />
                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 pointer-events-none group-hover:text-blue-300 transition-colors" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">
                    Tip: Schedule interview times, follow-ups, or deadlines.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReminderModal(false)}
                    className="flex-1 px-4 py-3 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800 transition-all font-medium hover:cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingReminder}
                    className="flex-1 btn-primary py-3 hover:cursor-pointer"
                  >
                    {isUpdatingReminder ? 'Setting...' : 'Set Reminder'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-400 mt-2">Welcome back! Here's what's happening with your job search.</p>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/jobs')}
          className="btn-accent w-fit"
        >
          <Plus className="w-5 h-5" />
          New Application
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Total Applications', value: dashboardData?.totalApplications || 0, icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Success Rate', value: `${dashboardData?.successRate || 0}%`, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Pending Response', value: jobs.filter(j => j.status === 'Applied' || j.status === 'Screening').length, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
          { label: 'Rejected', value: jobs.filter(j => j.status === 'Rejected').length, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="stat-card"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-sm text-slate-400 font-medium">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Monthly Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 glass-card p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Application Activity
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyChartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Status Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-secondary" /> Status Breakdown
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {statusChartData.map((stat) => (
              <div key={stat.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
                  <span className="text-slate-300">{stat.name}</span>
                </div>
                <span className="text-white font-medium">{stat.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Upcoming Reminders & List Section */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-10">
        {/* Applications List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="xl:col-span-3 glass-card"
        >
          <div className="p-6 border-b border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-white">Recent Applications</h2>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search company..."
                  className="input pl-10 py-2 text-sm w-full sm:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-800/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4 w-16">#</th>
                  <th className="px-6 py-4">Company & Position</th>
                  <th className="px-6 py-4">Applied Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                <AnimatePresence>
                  {filteredJobs.length > 0 ? (
                    filteredJobs.map((job, index) => (
                      <motion.tr
                        key={job._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-white/5 transition-colors group"
                      >
                        <td className="px-6 py-4 text-slate-500 font-mono text-sm">
                          {String(index + 1).padStart(2, '0')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{job.company}</div>
                          <div className="text-sm text-slate-400">{job.position}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-300 text-sm">
                          {new Date(job.dateApplied || job.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge
                            status={job.status}
                            onUpdate={(newStatus) => handleUpdateStatus(job._id, newStatus)}
                            isUpdating={updatingStatusId === job._id}
                            index={index}
                            total={filteredJobs.length}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 transition-opacity">
                            <button
                              onClick={() => {
                                setSelectedJob(job);
                                setReminderDate(job.reminderDate ? new Date(job.reminderDate).toISOString().slice(0, 16) : '');
                                setShowReminderModal(true);
                              }}
                              className="p-2 hover:bg-yellow-500/10 rounded-lg text-slate-400 hover:text-yellow-500 transition-colors"
                              title="Set Reminder"
                            >
                              <Bell className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => navigate('/jobs', { state: { jobId: job._id } })}
                              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteJob(job._id)}
                              className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-slate-500">No applications found.</td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Reminders Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card p-6 h-fit"
        >
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" /> Reminders
          </h2>
          <div className="space-y-4">
            {jobs.filter(j => j.reminderDate && !j.reminderSent).length > 0 ? (
              jobs.filter(j => j.reminderDate && !j.reminderSent)
                .sort((a, b) => new Date(a.reminderDate) - new Date(b.reminderDate))
                .slice(0, 5)
                .map(job => (
                  <div key={job._id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-yellow-500/30 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-sm font-semibold text-white truncate w-32">{job.company}</div>
                      <div className="text-[10px] text-yellow-500 font-bold uppercase">
                        {new Date(job.reminderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{new Date(job.reminderDate).toLocaleDateString()}</div>
                      <StatusBadge status={job.status} />
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                <p className="text-xs text-slate-500">No upcoming reminders</p>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setSelectedJob(null);
              setReminderDate('');
              setShowReminderModal(true);
            }}
            className="w-full mt-6 py-3 text-sm font-bold text-[#020617] bg-yellow-600 hover:bg-yellow-500 rounded-xl transition-all shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 hover:cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            Set New Reminder
          </button>
        </motion.div>
      </div>
    </div>
  );
}
