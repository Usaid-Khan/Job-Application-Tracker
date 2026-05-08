import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import Login from './pages/Login';
import Register from './pages/Register';
import JobManager from './pages/JobManager';
import Dashboard from './pages/Dashboard';
import { LayoutDashboard, Briefcase, LogOut, User, X, Edit3, Check, Loader as LoaderIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const Navbar = () => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPreferences, setEditedPreferences] = useState('');
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
      setEditedPreferences(res.data.careerPreferences || '');
      setShowProfile(true);
      setIsEditing(false);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const res = await axios.put('/api/auth/profile', {
        careerPreferences: editedPreferences
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(prev => ({ ...prev, careerPreferences: res.data.careerPreferences }));
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!token || location.pathname === '/login' || location.pathname === '/register') return null;

  return (
    <>
      <header className="border-b border-white/5 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-10">
            <Link to="/dashboard" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent flex items-center gap-2 group">
              <div className="bg-blue-600/20 p-2 rounded-lg group-hover:bg-blue-600/30 transition-colors">
                <Briefcase className="w-5 h-5 text-blue-500" />
              </div>
              JobTracker
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link 
                to="/dashboard" 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${location.pathname === '/dashboard' ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link 
                to="/jobs" 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${location.pathname === '/jobs' ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
              >
                <Briefcase className="w-4 h-4" />
                Manage Jobs
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={fetchProfile}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-white transition-colors relative cursor-pointer"
            >
              <User className={`w-5 h-5 ${loading ? 'animate-pulse' : ''}`} />
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && user && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfile(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-md relative z-10 shadow-2xl overflow-hidden"
            >
              {/* Decorative Background */}
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-600/10 to-transparent -z-10" />
              
              <button 
                onClick={() => setShowProfile(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-slate-900 flex items-center justify-center shadow-xl mb-4 overflow-hidden">
                  {user.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-blue-500" />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-white">{user.username}</h3>
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-full mt-2 uppercase tracking-widest border border-blue-500/20">
                  {user.role}
                </span>
              </div>

              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Email Address</p>
                  <p className="text-white bg-white/5 p-3 rounded-xl border border-white/5">{user.email}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Career Preferences</p>
                    {!isEditing ? (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="text-[10px] text-blue-500 hover:text-blue-400 font-bold uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                    ) : (
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setIsEditing(false)}
                          className="text-[10px] text-slate-500 hover:text-slate-400 font-bold uppercase tracking-widest cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleUpdateProfile}
                          disabled={loading}
                          className="text-[10px] text-green-500 hover:text-green-400 font-bold uppercase tracking-widest flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {loading ? <LoaderIcon className="w-3 h-3 animate-spin" /> : <><Check className="w-3 h-3" /> Save</>}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {!isEditing ? (
                    <div className="text-slate-300 bg-white/5 p-4 rounded-xl border border-white/5 min-h-[80px] italic text-sm leading-relaxed">
                      {user.careerPreferences || "No career preferences set yet."}
                    </div>
                  ) : (
                    <textarea
                      value={editedPreferences}
                      onChange={(e) => setEditedPreferences(e.target.value)}
                      className="w-full bg-slate-950 border border-blue-500/30 rounded-xl p-4 text-sm text-white outline-none focus:border-blue-500 transition-all min-h-[120px] resize-none"
                      placeholder="e.g. Seeking Frontend Developer roles, interested in Fintech and AI startups..."
                      autoFocus
                    />
                  )}
                </div>
              </div>

              <button 
                onClick={() => setShowProfile(false)}
                className="w-full mt-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl transition-all font-bold cursor-pointer"
              >
                Close Profile
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-blue-500/30 selection:text-white">
        <Navbar />

        <main className="flex-grow flex flex-col">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/jobs" 
              element={
                <ProtectedRoute>
                  <JobManager />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
