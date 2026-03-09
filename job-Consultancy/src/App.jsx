
import React, { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { gsap } from 'gsap';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import EmployeeRegister from './pages/EmployeeRegister';
import EmployerRegister from './pages/EmployerRegister';
import Contact from './pages/Contact';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import EmployeeProfile from './pages/EmployeeProfile';
import EmployerProfileWeb from './pages/EmployerProfileWeb';
import JobListing from './pages/JobListing';
import JobDetails from './pages/JobDetails';
import AppliedJobs from './pages/AppliedJobs';
import { About, PrivacyPolicy, TermsOfService, ServicesPage } from './pages/StaticPages';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeDashboardLayout from './pages/employee/EmployeeDashboardLayout';

// Employer Dashboard Pages
import EmployerDashboardLayout from './pages/employer/EmployerDashboardLayout';
import EmployerDashboard from './pages/employer/EmployerDashboard';
import CreateJob from './pages/employer/CreateJob';
import MyJobs from './pages/employer/MyJobs';
import CandidateDetails from './pages/employer/CandidateDetails';
import EmployerProfile from './pages/employer/EmployerProfile';
import AllDistricts from './pages/AllDistricts';
import DistrictJobs from './pages/DistrictJobs';
import ManageReviews from './pages/employer/ManageReviews';


// Scroll to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Admin Placeholder
const Admin = () => (
  <div className="flex items-center justify-center h-screen bg-black">
    <h1 className="text-xl font-black text-white uppercase tracking-widest">Admin Dashboard</h1>
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  const nodeRef = useRef(null);
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (window.innerWidth < 1024) return; // No animation on mobile/tablet

    const path = location.pathname;

    // Skip animation when navigating between dashboard sub-routes to prevent sidebar jumping
    const isDashboard = path.startsWith('/employer/') || path.startsWith('/employee/');
    const wasDashboard = prevPath.current && (prevPath.current.startsWith('/employer/') || prevPath.current.startsWith('/employee/'));

    if (isDashboard && wasDashboard) {
      prevPath.current = path;
      return;
    }

    let fromVars = { opacity: 0 };
    if (path === '/contact') fromVars.y = 50;
    else if (path === '/about') fromVars.y = -50;
    else if (path.includes('register')) fromVars.x = 50;
    else fromVars.x = -50;

    gsap.fromTo(nodeRef.current,
      fromVars,
      {
        opacity: 1,
        x: 0,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
        clearProps: "all"
      }
    );
    prevPath.current = path;
  }, [location.pathname]);


  return (
    <div ref={nodeRef} className="w-full relative min-h-screen">
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<JobListing />} />
        <Route path="/job/:slug" element={<JobDetails />} />
        <Route path="/applied-jobs" element={<AppliedJobs />} />
        <Route path="/employee-register" element={<EmployeeRegister />} />
        <Route path="/employer-register" element={<EmployerRegister />} />
        <Route path="/find-jobs" element={<EmployeeRegister />} />
        <Route path="/hire-talent" element={<EmployerRegister />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/resume" element={<ServicesPage />} />
        <Route path="/services/career" element={<ServicesPage />} />
        <Route path="/services/skill" element={<ServicesPage />} />
        <Route path="/services/training" element={<ServicesPage />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/districts" element={<AllDistricts />} />
        <Route path="/district/:name" element={<DistrictJobs />} />

        {/* Employee Dashboard Routes */}
        <Route path="/employee" element={<EmployeeDashboardLayout />}>
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="applications" element={<AppliedJobs hideHeader={true} />} />
          <Route path="profile" element={<EmployeeProfile hideHeader={true} />} />
        </Route>

        <Route path="/dashboard/employee" element={<Navigate to="/employee/dashboard" replace />} />
        <Route path="/dashboard/employer" element={<Navigate to="/employer/dashboard" replace />} />

        {/* Employer Dashboard Routes */}
        <Route path="/employer" element={<EmployerDashboardLayout />}>
          <Route path="dashboard" element={<EmployerDashboard />} />
          <Route path="post-job" element={<CreateJob />} />
          <Route path="my-jobs" element={<MyJobs />} />
          <Route path="candidate-details/:id" element={<CandidateDetails />} />
          <Route path="profile" element={<EmployerProfile />} />
          <Route path="reviews" element={<ManageReviews />} />
        </Route>

        <Route path="/admin" element={<Admin />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#000000',
            fontSize: '11px',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
            padding: '16px 24px'
          }
        }}
      />
      <MainLayout>
        <AnimatedRoutes />
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;
