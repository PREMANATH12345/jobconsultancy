
import React, { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import EmployerProfile from './pages/employer/EmployerProfile';
import CreateJob from './pages/employer/CreateJob';
import MyJobs from './pages/employer/MyJobs';
import ManageEmployers from './pages/admin/ManageEmployers';
import ManageJobs from './pages/admin/ManageJobs';
import ManageGovtJobs from './pages/admin/ManageGovtJobs';
import ManageReviews from './pages/admin/ManageReviews';
import AdminOverview from './pages/admin/AdminOverview';
import AppliedCandidates from './pages/employer/AppliedCandidates';
import CandidateDetails from './pages/employer/CandidateDetails';
import ForgotPassword from './pages/ForgotPassword';


// Main Layout to wrap all dashboard routes
const DashboardLayout = ({ user }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return <Navigate to="/login" />;

  const isApproved = user.role === 'admin' || user.status === 'approved';

  return (
    <div className="bg-slate-50 min-h-screen">
      <Sidebar role={user.role} isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white p-4 shadow-sm border-b border-slate-100 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 bg-slate-50 rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link to="/" className="font-black text-slate-900 uppercase tracking-tighter text-lg hover:text-primary transition-colors">Job Consultancy</Link>
        </div>
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-black text-xs">
          {user.name?.charAt(0) || 'U'}
        </div>
      </div>

      <main className="md:ml-64 min-h-screen transition-all duration-300">
        {!isApproved && (
          <div className="bg-amber-50 border-b border-amber-100 p-4 text-center">
            <p className="text-amber-700 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
              Your account is currently pending admin approval. Some features may be limited.
            </p>
          </div>
        )}
        <div className="max-w-[1400px] p-4 md:p-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(() => {
    return JSON.parse(sessionStorage.getItem('user')) || JSON.parse(localStorage.getItem('user'));
  });

  useEffect(() => {
    // Check for auto-login parameter
    const params = new URLSearchParams(window.location.search);
    const autoData = params.get('auto');
    if (autoData) {
      try {
        const userData = JSON.parse(decodeURIComponent(escape(atob(autoData))));
        if (userData && (userData.id || userData.email)) {
          sessionStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
          // Remove the auto param from URL to keep it clean
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {
        console.error("Auto-login in App failed:", e);
      }
    }

    // Only listen for same-tab login events
    const syncUser = () => setUser(JSON.parse(sessionStorage.getItem('user')) || JSON.parse(localStorage.getItem('user')));
    window.addEventListener('dashboard-login', syncUser);
    return () => {
      window.removeEventListener('dashboard-login', syncUser);
    };
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Dashboard Routes */}
        <Route element={<DashboardLayout user={user} />}>

          {/* Admin Specific */}
          {user?.role?.toLowerCase() === 'admin' && (
            <>
              <Route path="/admin/dashboard" element={<AdminOverview />} />
              <Route path="/admin/employers" element={<ManageEmployers />} />
              <Route path="/admin/jobs" element={<ManageJobs />} />
              <Route path="/admin/govt-jobs" element={<ManageGovtJobs />} />
              <Route path="/admin/reviews" element={<ManageReviews />} />
              <Route path="/" element={<Navigate to="/admin/dashboard" />} />
            </>
          )}

          {/* Employer Specific */}
          {user?.role?.toLowerCase() === 'employer' && (
            <>
              <Route path="/employer/profile" element={<EmployerProfile />} />
              <Route path="/employer/post-job" element={<CreateJob />} />
              <Route path="/employer/my-jobs" element={<MyJobs />} />
              <Route path="/employer/candidates" element={<AppliedCandidates />} />
              <Route path="/employer/candidate-details/:id" element={<CandidateDetails />} />
              <Route path="/" element={<Navigate to="/employer/profile" />} />
            </>
          )}

          {/* Fallback for authenticated users with no specific route */}
          <Route path="/" element={<Navigate to={user?.role?.toLowerCase() === 'admin' ? "/admin/dashboard" : "/employer/profile"} />} />
        </Route>

        {/* Global Fallback */}
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
