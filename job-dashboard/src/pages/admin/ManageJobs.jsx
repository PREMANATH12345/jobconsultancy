import React, { useState, useEffect } from 'react';
import { Briefcase, CheckCircle2, XCircle, Clock, MapPin, IndianRupee, Filter, Search, User, Edit3, Building2, Calendar, ShieldCheck, ArrowLeft, Users, Eye, Mail, Phone, Globe, FileText, GraduationCap, LayoutDashboard, Award, Landmark, Download, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { allService } from '../../services/api';
import JobModal from '../../components/JobModal';

const ManageJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [employers, setEmployers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filterStatus, setFilterStatus] = useState('all');
    const [filterEmployer, setFilterEmployer] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterGovtType, setFilterGovtType] = useState('all');

    // List View State
    const [view, setView] = useState('employers'); // 'employers', 'jobs', 'applicants', 'candidate', 'edit'
    const [selectedEmployer, setSelectedEmployer] = useState(null);
    const [subscriptions, setSubscriptions] = useState([]);
    const [dbPlans, setDbPlans] = useState([]);
    const [jobsPostedCounts, setJobsPostedCounts] = useState({});
    const [applications, setApplications] = useState([]);
    const [selectedJobForApplicants, setSelectedJobForApplicants] = useState(null);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [exportingId, setExportingId] = useState(null);

    // Edit Job State
    const [editFormData, setEditFormData] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('edit'); // 'edit', 'reject'
    const [selectedJob, setSelectedJob] = useState(null);

    const getSubscription = (empId) => {
        if (!empId || !Array.isArray(subscriptions)) return null;
        
        const activeSubs = subscriptions.filter(s =>
            String(s.employer_id).trim() == String(empId).trim() &&
            String(s.status).trim().toLowerCase() === 'active'
        );

        if (activeSubs.length === 0) return null;

        let totalLimit = 0;
        let hasUnlimited = false;

        // Start with plans from DB, falling back if empty
        const fallbackNames = ['Growth', 'Starter', 'Unlimited'];
        const planNames = (dbPlans && dbPlans.length > 0) 
            ? dbPlans.map(p => p.plan_name)
            : fallbackNames;

        const planCounts = {};
        planNames.forEach(name => planCounts[name] = 0);

        activeSubs.forEach(s => {
            const limit = parseInt(s.job_limit);
            if (limit === -1) hasUnlimited = true;
            else totalLimit += limit;
            
            const pName = s.plan_name || 'Custom Plan';
            // Find a matching plan name in our known db plans (fuzzy matching for historical data)
            const lowerPName = pName.toLowerCase();
            const matchingName = planNames.find(n => 
                lowerPName === n.toLowerCase() ||
                n.toLowerCase().includes(lowerPName.replace(/s$/, '')) || // handles 'starter' -> 'new starters'
                lowerPName.includes(n.toLowerCase().replace(/s$/, ''))
            );

            if (matchingName) {
                planCounts[matchingName]++;
            } else {
                planCounts[pName] = (planCounts[pName] || 0) + 1;
            }
        });

        // Initialize display arrays
        const orderedPlanCounts = [];
        const planMap = new Set();
        
        planNames.forEach(name => {
            orderedPlanCounts.push({ name: name, count: planCounts[name] });
            planMap.add(name);
        });

        Object.keys(planCounts).forEach(k => {
            if (!planMap.has(k)) {
                orderedPlanCounts.push({ name: k, count: planCounts[k] });
            }
        });

        let currentPlan = 'No Plan';
        let planLimit = 0;
        let planDate = null;
        
        // Find latest matching plan dynamically instead of strict if statements. Order of precedence defaults simply to most recent.
        const latestSub = activeSubs.sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0];
        
        if (latestSub) {
             currentPlan = latestSub.plan_name || 'Custom';
             planLimit = parseInt(latestSub.job_limit);
             planDate = latestSub.created_at;
        }

        return {
            job_limit: planLimit,
            plan_counts: orderedPlanCounts,
            currentPlan: currentPlan,
            plan_date: planDate
        };
    };

    useEffect(() => {
        fetchData();
    }, []);

    const downloadApplicantsExcel = async (job) => {
        try {
            setExportingId(job.id);
            toast.loading("Preparing report...", { id: 'export-toast' });

            // 1. Fetch all applications for this job
            const applicationsData = await allService.getData('job_applications', { job_id: job.id });
            const jobApps = Array.isArray(applicationsData) ? applicationsData : [];

            if (jobApps.length === 0) {
                toast.error("No applicants found for this job", { id: 'export-toast' });
                setExportingId(null);
                return;
            }

            // 2. Enrich applications with user data
            const enrichedData = await Promise.all(
                jobApps.map(async (app) => {
                    try {
                        const userData = await allService.getData('users', { id: app.user_id });
                        const candidate = Array.isArray(userData) && userData.length > 0 ? userData[0] : null;

                        let details = {};
                        try {
                            if (candidate?.user_details) {
                                details = typeof candidate.user_details === 'string'
                                    ? JSON.parse(candidate.user_details)
                                    : candidate.user_details;
                            }
                        } catch (e) {
                            console.error('Details parse error:', e);
                        }

                        return {
                            id: app.id,
                            applied_date: new Date(app.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                            status: app.status || 'applied',
                            candidate_name: candidate?.name || 'N/A',
                            candidate_email: candidate?.email || 'N/A',
                            candidate_phone: candidate?.phone || 'N/A',
                            whatsapp: candidate?.whatsapp_no || candidate?.phone || 'N/A',
                            gender: details?.gender || candidate?.gender || 'N/A',
                            dob: details?.dob ? new Date(details.dob).toLocaleDateString('en-GB') : 'N/A',
                            location: details?.address?.district || details?.address?.city || details?.location || 'N/A',
                            education: details?.education || 'N/A',
                            experience_type: details?.experience?.type || 'Fresher',
                            designation: details?.experience?.type === 'Experienced' ? (details?.experience?.designation || 'N/A') : 'N/A',
                            years_exp: details?.experience?.type === 'Experienced' ? (details?.experience?.years || '0') : '0',
                            last_salary: details?.experience?.type === 'Experienced' ? (details?.experience?.lastSalary || 'N/A') : 'N/A',
                            expected_salary: details?.expectations?.expectedSalary || 'N/A',
                            preferred_spot: details?.expectations?.workPlace || 'N/A',
                            desired_role: details?.expectations?.job || 'N/A',
                            job_title: job.title,
                            category: job.category
                        };
                    } catch (err) {
                        return { id: app.id, candidate_name: 'Error loading' };
                    }
                })
            );

            // 3. Create CSV Content
            const headers = [
                "Applied Date",
                "Job Title",
                "Job Category",
                "Candidate Name",
                "Email",
                "Phone",
                "WhatsApp",
                "Gender",
                "DOB",
                "Location",
                "Education",
                "Experience Type",
                "Current/Last Designation",
                "Years of Exp",
                "Last Salary",
                "Expected Salary",
                "Preferred Location",
                "Desired Role",
                "Application Status"
            ];

            const rows = enrichedData.map(d => [
                `="${d.applied_date}"`,
                d.job_title,
                d.category,
                d.candidate_name,
                d.candidate_email,
                `="${d.candidate_phone}"`,
                `="${d.whatsapp}"`,
                d.gender,
                `="${d.dob}"`,
                d.location,
                d.education,
                d.experience_type,
                d.designation,
                d.years_exp,
                d.last_salary,
                d.expected_salary,
                d.preferred_spot,
                d.desired_role,
                d.status
            ]);

            const csvContent = [
                headers.join(","),
                ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
            ].join("\n");

            // 4. Trigger Download
            const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `Applicants_${job.title.replace(/\s+/g, '_')}_${new Date().toLocaleDateString()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("Excel report downloaded successfully!", { id: 'export-toast' });
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Failed to generate report", { id: 'export-toast' });
        } finally {
            setExportingId(null);
        }
    };

    const fetchData = async () => {
        try {
            const [jobsDataRaw, allUsersDataRaw, subsDataRaw, appsDataRaw, limitsDataRaw, fetchedPlansRaw] = await Promise.all([
                allService.getData('jobs'),
                allService.getData('users'),
                allService.getData('subscriptions'),
                allService.getData('job_applications'),
                allService.getData('jobs_limits'),
                allService.getData('plan_limits').catch(() => [])
            ]);

            const allUsers = Array.isArray(allUsersDataRaw) ? allUsersDataRaw : (allUsersDataRaw?.data || []);
            const allJobs = Array.isArray(jobsDataRaw) ? jobsDataRaw : (jobsDataRaw?.data || []);
            const allSubs = Array.isArray(subsDataRaw) ? subsDataRaw : (subsDataRaw?.data || []);
            const allApps = Array.isArray(appsDataRaw) ? appsDataRaw : (appsDataRaw?.data || []);
            const fetchedPlans = Array.isArray(fetchedPlansRaw) ? fetchedPlansRaw : (fetchedPlansRaw?.data || []);
            setDbPlans(fetchedPlans);
            const allLimits = Array.isArray(limitsDataRaw) ? limitsDataRaw : (limitsDataRaw?.data || []);

            const userMap = {};
            if (Array.isArray(allUsers)) {
                allUsers.forEach(u => userMap[String(u.id)] = u);
            }

            // Filter out deleted jobs (deleted_at = 1)
            const activeJobs = allJobs.filter(j => String(j.deleted_at) !== '1');
            setJobs(activeJobs);
            setSubscriptions(allSubs);

            // Enrich applications with user data
            const enrichedApps = allApps.map(app => ({
                ...app,
                user_name: app.user_name || userMap[String(app.user_id)]?.name,
                user_email: app.user_email || userMap[String(app.user_id)]?.email
            }));
            setApplications(enrichedApps);

            // Filter for employers only
            const empList = allUsers.filter(u => u.role === 'employer');
            setEmployers(empList);

            // Create Employer Stats
            const employerStats = {};
            empList.forEach(emp => {
                const sub = getSubscription(emp.id);
                // Use allJobs instead of activeJobs to count even after deletion
                const empAllJobs = allJobs.filter(j => String(j.employer_id) === String(emp.id));
                
                const totalPosted = empAllJobs.length;
                
                const employerLimit = allLimits.find(l => String(l.employer_id) === String(emp.id));
                const planLimit = employerLimit ? parseInt(employerLimit.current_plan_limit || 0) : (sub ? sub.job_limit : 0);
                const planPosted = employerLimit ? parseInt(employerLimit.current_plan_posted || 0) : ((sub && sub.plan_date) ? empAllJobs.filter(j => new Date(j.created_at) >= new Date(sub.plan_date)).length : 0);
                
                employerStats[emp.id] = {
                    totalPosted,
                    planPosted,
                    planLimit: planLimit,
                    planBalance: planLimit === -1 ? -1 : Math.max(0, planLimit - planPosted)
                };
            });

            setJobsPostedCounts(employerStats);

            // AUTO-APPROVE LOGIC
            const pendingJobs = activeJobs.filter(j => (j.status || 'pending').toLowerCase() === 'pending');
            const toAutoApprove = pendingJobs.filter(j => {
                const emp = empList.find(e => String(e.id) === String(j.employer_id));
                return emp?.auto_approve_jobs == 1;
            });

            if (toAutoApprove.length > 0) {
                await Promise.all(toAutoApprove.map(j =>
                    allService.updateData('jobs', { id: j.id }, { status: 'approved' })
                ));
                const updatedJobsRes = await allService.getData('jobs');
                const updatedJobsRaw = Array.isArray(updatedJobsRes) ? updatedJobsRes : (updatedJobsRes?.data || []);
                setJobs(updatedJobsRaw.filter(j => String(j.deleted_at) !== '1'));
            }

        } catch (error) {
            console.error("Fetch error:", error);
            toast.error("Error fetching data");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateJob = async (id, formData) => {
        try {
            const cleanedData = {};
            const commonFields = ['title', 'description', 'category', 'job_role_category', 'status', 'rejection_reason', 'job_expiry'];
            const govtFields = ['govt_type', 'department', 'sector', 'vacancy', 'application_mode', 'exam_fee', 'last_date', 'post_name', 'application_start_date', 'min_age', 'max_age', 'age_relaxation', 'selection_process'];
            const privateFields = ['company_name', 'company_logo', 'location', 'salary_range', 'job_type', 'skills', 'experience', 'qualification', 'shift', 'work_mode', 'company_type', 'company_employees', 'company_turnover', 'application_deadline', 'posted_date', 'shortlisted_count', 'company_industry'];

            const relevantFields = formData.category === 'Government'
                ? [...commonFields, ...govtFields]
                : [...commonFields, ...privateFields];

            relevantFields.forEach(field => {
                if (formData[field] !== undefined) {
                    const value = formData[field];
                    if (value === '0000-00-00') {
                        cleanedData[field] = null;
                    } else if (value === '' && ['title', 'description', 'location', 'status'].includes(field)) {
                        cleanedData[field] = "";
                    } else if (value === '') {
                        cleanedData[field] = null;
                    } else {
                        cleanedData[field] = value;
                    }
                }
            });

            await allService.updateData('jobs', { id }, cleanedData);
            toast.success("Job updated successfully!");
            fetchData();
        } catch (error) {
            toast.error("Update failed: " + error.message);
        }
    };

    const handleRejectClick = (job) => {
        setSelectedJob(job);
        setModalMode('reject');
        setModalOpen(true);
    };

    const handleEditClick = (job) => {
        setSelectedJob(job);

        let exDate = '';
        let exTime = '23:59';
        if (job.job_expiry) {
            const dateObj = new Date(job.job_expiry);
            exDate = dateObj.toISOString().split('T')[0];
            const hours = dateObj.getHours().toString().padStart(2, '0');
            const minutes = dateObj.getMinutes().toString().padStart(2, '0');
            exTime = `${hours}:${minutes}`;
        }

        setEditFormData({
            ...job,
            expiry_date: exDate,
            expiry_time: exTime
        });
        setView('edit');
    };

    const handleViewJob = (job) => {
        setSelectedJob(job);
        setView('blueprint');
    };

    const filteredEmployers = Array.isArray(employers) ? employers.filter(emp => {
        return emp.name.toLowerCase().includes(filterEmployer.toLowerCase());
    }) : [];

    const filteredJobs = jobs.filter(job => {
        const matchesEmployerId = !selectedEmployer || String(job.employer_id) === String(selectedEmployer.id);
        const matchesCategory = filterCategory === 'all' || job.category === filterCategory;
        const matchesGovt = filterGovtType === 'all' || job.govt_type?.includes(filterGovtType);
        const currentStatus = String(job.status || 'pending').trim().toLowerCase();
        const matchesStatus = filterStatus === 'all' ? currentStatus !== 'rejected' : currentStatus === filterStatus;
        const matchesSearch = !filterEmployer || job.title?.toLowerCase().includes(filterEmployer.toLowerCase());
        return matchesEmployerId && matchesStatus && matchesCategory && matchesGovt && matchesSearch;
    });

    if (loading) {
        return <div className="p-10 text-center uppercase font-black text-slate-400 tracking-widest">Loading Dashboard...</div>;
    }

    return (
        <div className="p-4 md:p-8">
            <div className="mb-8 flex flex-col gap-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-6 gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Job Board Control</h1>
                        <p className="text-sm font-medium text-slate-500 mt-1">Review, Edit, or Approve jobs posted by company partners.</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xl">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            placeholder={view === 'employers' ? "Find Employer..." : view === 'applicants' ? "Search Candidates..." : "Search Jobs..."}
                            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-100 text-sm font-bold outline-none focus:border-emerald-500 transition-all bg-slate-50"
                            value={filterEmployer}
                            onChange={(e) => setFilterEmployer(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {view === 'employers' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 animate-in fade-in duration-700">
                    {filteredEmployers.map(emp => {
                        const sub = getSubscription(emp.id);
                        const stats = jobsPostedCounts[emp.id] || { totalPosted: 0, planPosted: 0, planBalance: 0 };
                        return (
                            <div key={emp.id} className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 hover:border-emerald-500 transition-all group relative overflow-hidden flex flex-col justify-between h-full shadow-xl">
                                <div className="absolute top-0 right-0 p-6 md:p-8 flex flex-col items-end gap-2 z-10">
                                    {sub ? (
                                        <div className="flex flex-col items-end">
                                            <span className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20 mb-1 z-10">Active</span>
                                            <div className="flex flex-col items-start gap-1.5 mt-2 text-left bg-emerald-50/80 backdrop-blur-sm p-3 rounded-2xl border border-emerald-100/50 min-w-[140px] shadow-sm relative z-20">
                                                {sub.plan_counts.map((p, i) => (
                                                    <div key={p.name} className="flex justify-between items-center w-full gap-4">
                                                        <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider">{i + 1}. {p.name}</span>
                                                        <span className="text-[10px] font-black text-emerald-600 bg-white/80 border border-emerald-100 px-2 py-0.5 rounded-md shadow-sm min-w-[24px] text-center">{p.count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-end">
                                            <span className="bg-slate-100 text-slate-400 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-slate-200 mb-1">No Active Plan</span>
                                        </div>
                                    )}
                                </div>
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 md:mb-8 border border-emerald-100 group-hover:bg-emerald-500 transition-all shadow-sm group-hover:rotate-3 relative z-10">
                                    <Building2 className="w-8 h-8 md:w-10 md:h-10 text-emerald-500 group-hover:text-white" />
                                </div>
                                <div className="relative z-10 text-left">
                                    <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mb-0.5 truncate">{emp.name}</h3>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border ${sub ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                            Active Plan: {sub?.currentPlan || 'None'}
                                        </span>
                                    </div>
                                    <p className="text-xs md:text-sm font-medium text-slate-500 mb-6 md:mb-8 lowercase line-clamp-1 text-left">{emp.email}</p>
                                    <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-3 mb-6 md:mb-8 text-left">
                                        <div className="bg-emerald-50/50 p-3 md:p-3.5 rounded-2xl border border-emerald-100 transition-all group-hover:bg-white text-left">
                                            <p className="text-[8px] md:text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1 truncate">Current Plan Limit</p>
                                            <p className="text-xl md:text-xl font-bold text-emerald-600">{sub ? (stats.planLimit === -1 ? '∞' : stats.planLimit) : 0}</p>
                                        </div>
                                        <div className="bg-blue-50/50 p-3 md:p-3.5 rounded-2xl border border-blue-100 transition-all group-hover:bg-white text-left">
                                            <p className="text-[8px] md:text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-1 truncate">Total Jobs Posted</p>
                                            <p className="text-xl md:text-xl font-bold text-blue-600">{stats.totalPosted}</p>
                                        </div>
                                        <div className="bg-amber-50/50 p-3 md:p-3.5 rounded-2xl border border-amber-100 transition-all group-hover:bg-white text-left">
                                            <p className="text-[8px] md:text-[9px] font-bold text-amber-600 uppercase tracking-widest mb-1 truncate">Current Plan Posted</p>
                                            <p className="text-xl md:text-xl font-bold text-amber-600">{stats.planPosted}</p>
                                        </div>
                                        <div className="bg-slate-50 p-3 md:p-3.5 rounded-2xl border border-slate-100 transition-all group-hover:bg-white text-left">
                                            <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">Current Plan Balance</p>
                                            <p className="text-xl md:text-xl font-bold text-slate-900">{sub ? (stats.planLimit === -1 ? '∞' : stats.planBalance) : 0}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setView('jobs'); setSelectedEmployer(emp); }}
                                        className="w-full bg-slate-900 text-white hover:bg-emerald-500 py-4 md:py-5 rounded-xl md:rounded-2xl font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 group/btn active:scale-95 shadow-lg"
                                    >
                                        View Listings <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 rotate-180" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : view === 'jobs' ? (
                <div className="space-y-8">
                    <button
                        onClick={() => { setView('employers'); setSelectedEmployer(null); }}
                        className="bg-black text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-[10px] md:text-sm uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl flex items-center gap-3 transform hover:-translate-x-2"
                    >
                        <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" /> Return to Employers
                    </button>
                    <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100 flex items-center justify-between relative overflow-hidden group">
                        <div className="flex items-center gap-4 md:gap-6 relative z-10 text-left">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 shadow-sm">
                                <Building2 className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg md:text-xl font-bold text-slate-900 uppercase tracking-tight leading-none truncate max-w-[200px] sm:max-w-none">View {selectedEmployer?.name} Jobs</h2>
                                <p className="text-[10px] md:text-[11px] font-medium text-slate-400 mt-1">Explore and manage all job postings for this company.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mt-8">
                        {filteredJobs.map((job) => {
                            const currentStatus = String(job.status || 'pending').trim().toLowerCase();
                            const jobApplications = applications.filter(app => String(app.job_id) === String(job.id));
                            return (
                                <div key={job.id} className="bg-white rounded-[2.5rem] md:rounded-[4rem] shadow-2xl border border-slate-100 group hover:border-emerald-500 transition-all flex flex-col overflow-hidden relative text-left">
                                    <div className="h-3 md:h-4 w-full bg-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.3)]" />
                                    <div className="p-6 md:p-8 flex-1 relative z-10">
                                        <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
                                            <span className={`px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider shadow-sm ${currentStatus === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100/50 text-amber-600'}`}>
                                                {job.status || 'pending'}
                                            </span>
                                            <span className="text-[9px] md:text-[10px] font-bold text-white bg-black px-3 md:px-4 py-1 md:py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                                                {job.category === 'Private' ? 'PRIVATE' : 'GOVERNMENT'}
                                            </span>
                                        </div>
                                        <h3 className="text-lg md:text-2xl font-bold text-slate-900 tracking-tight mb-4 md:mb-6 line-clamp-2 leading-snug">
                                            {job.title}
                                        </h3>
                                        <div className="space-y-3 md:space-y-4 mb-4 md:mb-6 text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-wide">
                                            <div className="flex items-center gap-3">
                                                <MapPin className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
                                                <span className="truncate">{job.location || job.sector}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Briefcase className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
                                                <span className="truncate">{job.job_role_category}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-6 md:px-8 pb-6 md:pb-8 pt-4 md:pt-6 flex flex-col gap-3 relative z-10 bg-slate-50/30 border-t border-slate-100">
                                        <div className="flex gap-2 md:gap-3">
                                            <button
                                                onClick={() => handleViewJob(job)}
                                                className="flex-1 bg-white border-2 border-slate-100 text-black hover:border-emerald-500 hover:text-emerald-600 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-[9px] md:text-[10px] uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2"
                                                title="View Details"
                                            >
                                                <Eye className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
                                            </button>
                                            <button
                                                onClick={() => handleEditClick(job)}
                                                className="flex-1 bg-white border-2 border-slate-100 text-black hover:border-emerald-500 hover:text-emerald-600 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-[9px] md:text-[10px] uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2"
                                                title="Edit Blueprint"
                                            >
                                                <Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" /> Edit
                                            </button>
                                            <button
                                                onClick={() => { setView('applicants'); setSelectedJobForApplicants(job); }}
                                                className="flex-1 bg-black text-white hover:bg-emerald-500 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-[9px] md:text-[10px] uppercase tracking-wider transition-all shadow-2xl flex flex-col items-center justify-center"
                                            >
                                                <span className="text-emerald-400 leading-none mb-0.5 md:mb-1 text-xs md:text-sm">{jobApplications.length}</span>
                                                <span className="text-[7px] md:text-[8px] opacity-60">Applicants</span>
                                            </button>
                                        </div>
                                        {currentStatus === 'pending' && (
                                            <div className="flex gap-2 md:gap-3">
                                                <button
                                                    onClick={() => handleUpdateJob(job.id, { status: 'approved' })}
                                                    className="flex-1 bg-emerald-500 text-white hover:bg-emerald-600 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-[9px] md:text-[10px] uppercase tracking-wider transition-all"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleRejectClick(job)}
                                                    className="flex-1 bg-rose-500 text-white hover:bg-rose-600 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-[9px] md:text-[10px] uppercase tracking-wider transition-all"
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : view === 'applicants' ? (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
                    <button
                        onClick={() => setView('jobs')}
                        className="bg-black text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-[10px] md:text-[11px] uppercase tracking-wider hover:bg-emerald-500 transition-all shadow-xl flex items-center gap-3 transform hover:-translate-x-2 italic"
                    >
                        <ArrowLeft className="w-5 h-5" /> Back to Console
                    </button>

                    <div className="space-y-8">
                        {/* Header Section */}
                        <div className="bg-slate-900 p-8 md:p-10 text-white rounded-[2rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden mb-8">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 relative z-10">
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-xl rounded-2xl md:rounded-[2rem] flex items-center justify-center text-emerald-400 border border-white/10 shadow-2xl lg:rotate-3">
                                    <Users className="w-8 h-8 md:w-10 md:h-10" />
                                </div>
                                <div className="text-center md:text-left">
                                    <h2 className="text-2xl md:text-4xl font-extrabold uppercase tracking-tighter leading-none mb-3">Applicants Queue</h2>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                        <span className="bg-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">{selectedJobForApplicants?.title}</span>
                                        <span className="bg-white/5 text-slate-400 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/5">{applications.filter(app => String(app.job_id) === String(selectedJobForApplicants?.id)).filter(app => !filterEmployer || app.user_name?.toLowerCase().includes(filterEmployer.toLowerCase()) || app.user_email?.toLowerCase().includes(filterEmployer.toLowerCase())).length} Candidates Found</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mb-8 px-2 md:px-6">
                            <button
                                onClick={() => downloadApplicantsExcel(selectedJobForApplicants)}
                                disabled={exportingId === selectedJobForApplicants?.id || applications.filter(app => String(app.job_id) === String(selectedJobForApplicants?.id)).length === 0}
                                className="w-full md:w-auto bg-emerald-500 text-white px-8 md:px-10 py-4 md:py-4 rounded-xl md:rounded-[1.5rem] font-extrabold text-[10px] md:text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 md:gap-4 disabled:opacity-50 group/btn"
                            >
                                {exportingId === selectedJobForApplicants?.id ? (
                                    <Loader2 className="w-4 h-4 md:w-5 h-5 animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4 md:w-5 h-5 group-hover/btn:-translate-y-1 transition-transform" />
                                )}
                                {exportingId === selectedJobForApplicants?.id ? 'Exporting...' : 'Download in Excel'}
                            </button>
                        </div>

                        <div className="px-2 md:px-6">
                            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                                Live Recruitment Stream
                            </h4>

                            <div className="space-y-0 border-t border-slate-100">
                                {applications.filter(app => String(app.job_id) === String(selectedJobForApplicants?.id)).filter(app => !filterEmployer || app.user_name?.toLowerCase().includes(filterEmployer.toLowerCase()) || app.user_email?.toLowerCase().includes(filterEmployer.toLowerCase())).map(app => (
                                    <div key={app.id} className="py-8 md:py-12 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between group hover:bg-slate-50/50 px-4 md:px-8 transition-all gap-8 -mx-4 md:-mx-8 rounded-3xl">
                                        <div className="flex items-center gap-6 md:gap-10 w-full sm:w-auto text-left">
                                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] bg-slate-900 flex items-center justify-center text-white font-black text-xl md:text-2xl uppercase border-4 border-white shadow-xl shrink-0 group-hover:rotate-3 transition-transform">
                                                {app.user_name?.substring(0, 2) || 'NA'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight mb-2 truncate">{app.user_name || 'Anonymous'}</h3>
                                                <div className="flex flex-wrap items-center gap-4">
                                                    <span className="text-[10px] md:text-[11px] font-bold text-slate-400 flex items-center gap-2 truncate"><Mail className="w-4 h-4 text-emerald-500" /> {app.user_email}</span>
                                                    <div className="hidden md:flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                        System Verified
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                const userDataResult = await allService.getData('users', { id: app.user_id });
                                                const userRow = Array.isArray(userDataResult) ? userDataResult[0] : userDataResult;
                                                let parsedDetails = {};
                                                
                                                try {
                                                    if (userRow?.user_details) {
                                                        parsedDetails = typeof userRow.user_details === 'string'
                                                            ? JSON.parse(userRow.user_details)
                                                            : userRow.user_details;
                                                    }
                                                } catch (e) { console.error('Error parsing details', e); }

                                                const getFullUrl = (url) => {
                                                    if (!url) return null;
                                                    if (url.startsWith('http')) return url;
                                                    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
                                                    return `https://apiphp.dsofthub.com/jobconsultancy/${cleanUrl}`;
                                                };

                                                const addr = parsedDetails?.address;
                                                const exp = parsedDetails?.experience;
                                                
                                                const addressStr = addr?.city || addr?.district ? `${addr.city || ''}${addr.city && addr.district ? ', ' : ''}${addr.district || ''}` : 'UNSPECIFIED LOCATION';
                                                
                                                const experienceStr = exp?.type === 'Fresher' ? 'ENTRY LEVEL / FRESH' : (exp?.designation ? `${exp.type} - ${exp.designation}` : 'ENTRY LEVEL / FRESH');

                                                setSelectedCandidate({
                                                    ...userRow,
                                                    resume: getFullUrl(app.resume || parsedDetails?.documents?.resume),
                                                    idProof: getFullUrl(parsedDetails?.documents?.idProof),
                                                    passportPhoto: getFullUrl(parsedDetails?.documents?.passportPhoto),
                                                    skills: parsedDetails?.expectations?.job || 'NO DESIRED JOB CODIFIED',
                                                    experience: experienceStr,
                                                    education: parsedDetails?.education || 'NOT DECLARED',
                                                    address: addressStr,
                                                    dob: parsedDetails?.dob,
                                                    gender: parsedDetails?.gender,
                                                    expectedSalary: parsedDetails?.expectations?.expectedSalary,
                                                    preferredLocation: parsedDetails?.expectations?.workPlace,
                                                    noticePeriod: parsedDetails?.expectations?.workTime
                                                });
                                                setView('candidate');
                                            }}
                                            className="w-full sm:w-auto bg-slate-900 text-white hover:bg-emerald-500 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95"
                                        >
                                            <Eye className="w-5 h-5" /> Inspect Profile
                                        </button>
                                    </div>
                                ))}

                                {applications.filter(app => String(app.job_id) === String(selectedJobForApplicants?.id)).filter(app => !filterEmployer || app.user_name?.toLowerCase().includes(filterEmployer.toLowerCase()) || app.user_email?.toLowerCase().includes(filterEmployer.toLowerCase())).length === 0 && (
                                    <div className="py-20 text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Users className="w-10 h-10 text-slate-200" />
                                        </div>
                                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No active applications in queue.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : view === 'edit' ? (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
                    <button
                        onClick={() => setView('jobs')}
                        className="bg-black text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-[10px] md:text-[11px] uppercase tracking-wider hover:bg-emerald-500 transition-all shadow-xl flex items-center gap-3 transform hover:-translate-x-2 italic"
                    >
                        <ArrowLeft className="w-5 h-5" /> Back to Console
                    </button>

                    <div className="space-y-8">
                        {/* Header Section */}
                        <div className="bg-slate-900 p-8 md:p-10 text-white rounded-[2rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden mb-8">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 relative z-10">
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-xl rounded-2xl md:rounded-[2rem] flex items-center justify-center text-emerald-400 border border-white/10 shadow-2xl lg:-rotate-3">
                                    <Edit3 className="w-8 h-8 md:w-10 md:h-10" />
                                </div>
                                <div className="text-center md:text-left">
                                    <h2 className="text-2xl md:text-4xl font-extrabold uppercase tracking-tighter leading-none mb-3">Edit Listing</h2>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                        <span className="bg-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">{editFormData?.category} Listing</span>
                                        <span className="bg-white/5 text-slate-400 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/5">Ref ID #{selectedJob?.id}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            setIsUpdating(true);
                            let job_expiry = null;
                            if (editFormData.expiry_date && editFormData.expiry_time) {
                                job_expiry = `${editFormData.expiry_date} ${editFormData.expiry_time}:00`;
                            }
                            const payload = { ...editFormData, job_expiry };
                            delete payload.expiry_date;
                            delete payload.expiry_time;

                            await handleUpdateJob(selectedJob.id, payload);
                            setIsUpdating(false);
                            setView('jobs');
                        }} className="space-y-20 px-2 md:px-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-12 md:gap-y-16 gap-x-12">
                                <div className="lg:col-span-3">
                                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-8 flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                                        Core Listing Parameters
                                    </h4>
                                </div>
                                {editFormData?.category === 'Government' ? (
                                    <>
                                        <div className="md:col-span-2">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Official Designation</label>
                                            <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all placeholder:text-slate-300"
                                                value={editFormData.title || ''} onChange={e => setEditFormData({ ...editFormData, title: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Jurisdiction / Type</label>
                                            <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all cursor-pointer"
                                                value={editFormData.govt_type || ''} onChange={e => setEditFormData({ ...editFormData, govt_type: e.target.value })}>
                                                <option value="State">State Government</option>
                                                <option value="Central">Central Government</option>
                                                <option value="PSU">Public Sector Unit</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Governing Department</label>
                                            <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all"
                                                value={editFormData.department || ''} onChange={e => setEditFormData({ ...editFormData, department: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Industrial Sector</label>
                                            <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all"
                                                value={editFormData.sector || ''} onChange={e => setEditFormData({ ...editFormData, sector: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Available Vacancies</label>
                                            <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all"
                                                value={editFormData.vacancy || ''} onChange={e => setEditFormData({ ...editFormData, vacancy: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Submission Protocol</label>
                                            <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all cursor-pointer"
                                                value={editFormData.application_mode || ''} onChange={e => setEditFormData({ ...editFormData, application_mode: e.target.value })}>
                                                <option value="Online">Online</option>
                                                <option value="Offline">Offline</option>
                                                <option value="Both">Both</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Administrative Fee</label>
                                            <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all"
                                                value={editFormData.exam_fee || ''} onChange={e => setEditFormData({ ...editFormData, exam_fee: e.target.value })} />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Selection Methodology</label>
                                            <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all"
                                                value={editFormData.selection_process || ''} onChange={e => setEditFormData({ ...editFormData, selection_process: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Final Deadline</label>
                                            <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all font-mono"
                                                value={editFormData.last_date || ''} onChange={e => setEditFormData({ ...editFormData, last_date: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Minimum Age Threshold</label>
                                            <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all"
                                                value={editFormData.min_age || ''} onChange={e => setEditFormData({ ...editFormData, min_age: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Maximum Age Limit</label>
                                            <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all"
                                                value={editFormData.max_age || ''} onChange={e => setEditFormData({ ...editFormData, max_age: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Age Relaxation Criteria</label>
                                            <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all"
                                                value={editFormData.age_relaxation || ''} onChange={e => setEditFormData({ ...editFormData, age_relaxation: e.target.value })} />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="md:col-span-2">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Position Title</label>
                                            <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all"
                                                value={editFormData.title || ''} onChange={e => setEditFormData({ ...editFormData, title: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Parent Organization</label>
                                            <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all"
                                                value={editFormData.company_name || ''} onChange={e => setEditFormData({ ...editFormData, company_name: e.target.value })} />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Corporate Identity (Logo URL)</label>
                                            <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all flex-1"
                                                value={editFormData.company_logo || ''} onChange={e => setEditFormData({ ...editFormData, company_logo: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Base Location</label>
                                            <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all"
                                                value={editFormData.location || ''} onChange={e => setEditFormData({ ...editFormData, location: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Compensation Package / CTC</label>
                                            <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all"
                                                value={editFormData.salary_range || ''} onChange={e => setEditFormData({ ...editFormData, salary_range: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Employment Nature</label>
                                            <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all cursor-pointer"
                                                value={editFormData.job_type || ''} onChange={e => setEditFormData({ ...editFormData, job_type: e.target.value })}>
                                                <option value="Full Time">Full Time</option>
                                                <option value="Part Time">Part Time</option>
                                                <option value="Internship">Internship</option>
                                                <option value="Remote">Remote</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Experience Requirement</label>
                                            <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all"
                                                value={editFormData.experience || ''} onChange={e => setEditFormData({ ...editFormData, experience: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Primary Skillset</label>
                                            <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all"
                                                value={editFormData.skills || ''} onChange={e => setEditFormData({ ...editFormData, skills: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Minimum Qualification</label>
                                            <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all"
                                                value={editFormData.qualification || ''} onChange={e => setEditFormData({ ...editFormData, qualification: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Operational Shift</label>
                                            <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all"
                                                value={editFormData.shift || ''} onChange={e => setEditFormData({ ...editFormData, shift: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Work Environment Mode</label>
                                            <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all cursor-pointer"
                                                value={editFormData.work_mode || ''} onChange={e => setEditFormData({ ...editFormData, work_mode: e.target.value })}>
                                                <option value="Work from Office">Work from Office</option>
                                                <option value="Remote">Remote</option>
                                                <option value="Hybrid">Hybrid</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Industry Sector</label>
                                            <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all"
                                                value={editFormData.company_industry || ''} onChange={e => setEditFormData({ ...editFormData, company_industry: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Organization Turnover</label>
                                            <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all"
                                                value={editFormData.company_turnover || ''} onChange={e => setEditFormData({ ...editFormData, company_turnover: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Listing Initialization Date</label>
                                            <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all font-mono"
                                                value={editFormData.posted_date || ''} onChange={e => setEditFormData({ ...editFormData, posted_date: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Application Expiration</label>
                                            <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all font-mono"
                                                value={editFormData.application_deadline || ''} onChange={e => setEditFormData({ ...editFormData, application_deadline: e.target.value })} />
                                        </div>
                                    </>
                                )}
                                <div className="lg:col-span-3">
                                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mt-10 mb-8 flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                                        Mission Parameters & Detailed Specifications
                                    </h4>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Full Description & Eligibility Architecture</label>
                                    <textarea required rows={8} className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all resize-none italic"
                                        value={editFormData.description || ''} onChange={e => setEditFormData({ ...editFormData, description: e.target.value })} />
                                </div>
                                <div className="lg:col-span-3">
                                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mt-10 mb-8 flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                                        Post Expiry Protocols
                                    </h4>
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Automated Termination Date</label>
                                    <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all font-mono"
                                        value={editFormData.expiry_date || ''} onChange={e => setEditFormData({ ...editFormData, expiry_date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">Termination Timecode</label>
                                    <input type="time" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none font-semibold text-base md:text-lg text-slate-900 transition-all font-mono"
                                        value={editFormData.expiry_time || ''} onChange={e => setEditFormData({ ...editFormData, expiry_time: e.target.value })} />
                                </div>
                            </div>
                            <div className="pt-12 pb-20">
                                <button
                                    disabled={isUpdating}
                                    className="w-full bg-slate-900 text-white hover:bg-emerald-500 py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                >
                                    {isUpdating ? (
                                        <>
                                            <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                            Synchronizing Data...
                                        </>
                                    ) : 'Confirm Listing Updates'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : view === 'candidate' ? (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
                    <button
                        onClick={() => setView('applicants')}
                        className="bg-black text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-[10px] md:text-[11px] uppercase tracking-wider hover:bg-emerald-500 transition-all shadow-xl flex items-center gap-3 transform hover:-translate-x-2 italic"
                    >
                        <ArrowLeft className="w-5 h-5" /> Back to Applicants
                    </button>

                    <div className="space-y-8">
                        {/* Header Section */}
                        <div className="bg-slate-900 p-6 md:p-8 text-white rounded-[1.5rem] md:rounded-[2rem] shadow-xl relative overflow-hidden mb-8">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                            <div className="flex flex-col md:flex-row items-center gap-5 md:gap-6 relative z-10">
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-xl rounded-xl md:rounded-[1.5rem] overflow-hidden flex items-center justify-center text-emerald-400 border border-white/10 shadow-xl font-bold text-xl md:text-2xl uppercase">
                                    {selectedCandidate?.passportPhoto ? (
                                        <img src={selectedCandidate.passportPhoto} alt="Applicant" className="w-full h-full object-cover" />
                                    ) : (
                                        selectedCandidate?.name?.substring(0, 2) || 'NA'
                                    )}
                                </div>
                                <div className="text-center md:text-left">
                                    <h2 className="text-xl md:text-3xl font-extrabold uppercase tracking-tight mb-2">{selectedCandidate?.name}</h2>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-2 max-w-full">
                                        <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border border-emerald-500/20">Verified Talent</span>
                                        <span className="bg-white/5 text-slate-400 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border border-white/5">Candidate ID #{selectedCandidate?.id || 'ALPHA'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-12 md:gap-y-20 gap-x-16 px-2 md:px-6">
                            {/* Column 1: Core Info */}
                            <div className="space-y-10">
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                                    Contact Registry
                                </h4>
                                <div className="space-y-8">
                                    <div className="group">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 group-hover:text-emerald-500 transition-colors">Digital Mail</p>
                                        <p className="text-lg font-semibold text-slate-900 break-all">{selectedCandidate?.email}</p>
                                    </div>
                                    <div className="group">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 group-hover:text-emerald-500 transition-colors">Direct Line</p>
                                        <p className="text-lg font-semibold text-slate-900">{selectedCandidate?.phone ? `+91 ${selectedCandidate.phone}` : 'NOT PROVIDED'}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="group">
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 group-hover:text-emerald-500 transition-colors">Date of Birth</p>
                                            <p className="text-base font-semibold text-slate-900">{selectedCandidate?.dob || 'NOT CODIFIED'}</p>
                                        </div>
                                        <div className="group">
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 group-hover:text-emerald-500 transition-colors">Gender</p>
                                            <p className="text-base font-semibold text-slate-900 capitalize">{selectedCandidate?.gender || 'NOT CODIFIED'}</p>
                                        </div>
                                    </div>
                                    <div className="group">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 group-hover:text-emerald-500 transition-colors">Residential Matrix</p>
                                        <p className="text-lg font-semibold text-slate-900 leading-tight">{selectedCandidate?.address || 'UNSPECIFIED LOCATION'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Column 2: Background */}
                            <div className="space-y-10">
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                                    Career blueprint
                                </h4>
                                <div className="space-y-8">
                                    <div className="group">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 group-hover:text-emerald-500 transition-colors">Target Designation</p>
                                        <p className="text-lg font-semibold text-slate-900">{selectedCandidate?.skills || 'NO DESIGNATION CODIFIED'}</p>
                                    </div>
                                    <div className="group">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 group-hover:text-emerald-500 transition-colors">Experience Quotient</p>
                                        <p className="text-lg font-semibold text-slate-900 uppercase">{selectedCandidate?.experience || 'ENTRY LEVEL / FRESH'}</p>
                                    </div>
                                    <div className="group">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 group-hover:text-emerald-500 transition-colors">Academic Credentials</p>
                                        <p className="text-lg font-semibold text-slate-900 uppercase">{selectedCandidate?.education || selectedCandidate?.qualification || 'NOT DECLARED'}</p>
                                    </div>
                                    <div className="group">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 group-hover:text-emerald-500 transition-colors">Compensation Expectation</p>
                                        <p className="text-lg font-semibold text-emerald-600 uppercase">{selectedCandidate?.expectedSalary ? `₹ ${selectedCandidate.expectedSalary}` : 'NOT CODIFIED'}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="group">
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 group-hover:text-emerald-500 transition-colors">Pref. Location</p>
                                            <p className="text-base font-semibold text-slate-900 capitalize">{selectedCandidate?.preferredLocation || 'ANYWHERE'}</p>
                                        </div>
                                        <div className="group">
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 group-hover:text-emerald-500 transition-colors">Notice Period</p>
                                            <p className="text-base font-semibold text-slate-900 capitalize">{selectedCandidate?.noticePeriod || 'IMMEDIATE'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Column 3: Attachments */}
                            <div className="space-y-10">
                                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                                    System Assets
                                </h4>
                                <div className="space-y-8">
                                    {selectedCandidate?.resume ? (
                                        <a
                                            href={selectedCandidate.resume}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-slate-900 hover:bg-emerald-500 text-white p-8 rounded-[2rem] flex items-center justify-between group transition-all shadow-2xl relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                            <div className="flex items-center gap-4 relative z-10">
                                                <FileText className="w-8 h-8 text-emerald-400 group-hover:text-white transition-colors" />
                                                <div className="text-left">
                                                    <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">Digital Resume</p>
                                                    <p className="text-sm font-black uppercase tracking-tight">Access Document</p>
                                                </div>
                                            </div>
                                            <ArrowLeft className="w-6 h-6 rotate-180 group-hover:translate-x-2 transition-transform relative z-10" />
                                        </a>
                                    ) : (
                                        <div className="bg-slate-100 p-8 rounded-[2rem] text-slate-400 flex items-center gap-4">
                                            <XCircle className="w-8 h-8 opacity-20" />
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest">No Resume</p>
                                                <p className="text-sm font-black tracking-tight">NOT ATTACHED</p>
                                            </div>
                                        </div>
                                    )}

                                    {selectedCandidate?.idProof ? (
                                        <a
                                            href={selectedCandidate.idProof}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-slate-900 hover:bg-emerald-500 text-white p-8 rounded-[2rem] flex items-center justify-between group transition-all shadow-2xl relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                            <div className="flex items-center gap-4 relative z-10">
                                                <ShieldCheck className="w-8 h-8 text-emerald-400 group-hover:text-white transition-colors" />
                                                <div className="text-left">
                                                    <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">Govt ID Proof</p>
                                                    <p className="text-sm font-black uppercase tracking-tight">Verify Identity</p>
                                                </div>
                                            </div>
                                            <ArrowLeft className="w-6 h-6 rotate-180 group-hover:translate-x-2 transition-transform relative z-10" />
                                        </a>
                                    ) : (
                                        <div className="bg-slate-100 p-8 rounded-[2rem] text-slate-400 flex items-center gap-4">
                                            <XCircle className="w-8 h-8 opacity-20" />
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest">No ID Proof</p>
                                                <p className="text-sm font-black tracking-tight">NOT ISSUED</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2rem]">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Status</p>
                                        </div>
                                        <p className="text-sm font-black text-emerald-900 leading-relaxed uppercase">Candidate active in recruitment queue. verification complete.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {selectedCandidate?.bio && (
                            <div className="mt-20 border-t border-slate-100 pt-16 px-2 md:px-6">
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-8 flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                                    Professional Narrative
                                </h4>
                                <div className="text-base md:text-xl font-semibold text-slate-600 leading-[1.8] whitespace-pre-wrap italic">
                                    "{selectedCandidate.bio}"
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : view === 'blueprint' ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
                    <button
                        onClick={() => setView('jobs')}
                        className="bg-black text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-[10px] md:text-[11px] uppercase tracking-wider hover:bg-emerald-500 transition-all shadow-xl flex items-center gap-3 transform hover:-translate-x-2 italic"
                    >
                        <ArrowLeft className="w-5 h-5" /> Back to Console
                    </button>

                    <div className="space-y-8">
                        {/* Header Section */}
                        <div className="bg-slate-900 p-8 md:p-10 text-white rounded-[2rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden mb-8">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 relative z-10">
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-xl rounded-2xl md:rounded-[2rem] flex items-center justify-center text-emerald-400 border border-white/10 shadow-2xl lg:rotate-3">
                                    <Eye className="w-8 h-8 md:w-10 md:h-10" />
                                </div>
                                <div className="text-center md:text-left">
                                    <h2 className="text-2xl md:text-4xl font-extrabold uppercase tracking-tighter leading-none mb-3">Job Blueprint</h2>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                        <span className="bg-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">{selectedJob?.category} Listing</span>
                                        <span className="bg-white/5 text-slate-400 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/5">Serial ID #{selectedJob?.id}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Details Grid - Flat Design */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-10 md:gap-y-16 gap-x-12 px-2 md:px-6">
                            <BlueprintField label="Position Title" value={selectedJob?.title} icon={Briefcase} />
                            <BlueprintField label="Listing Category" value={selectedJob?.category} icon={LayoutDashboard} />
                            <BlueprintField label="Job Designation" value={selectedJob?.job_role_category} icon={Award} />
                            <BlueprintField label="Operating District" value={selectedJob?.district} icon={MapPin} />

                            {selectedJob?.category === 'Government' ? (
                                <>
                                    <BlueprintField label="Agency Type" value={selectedJob?.govt_type} icon={Landmark} />
                                    <BlueprintField label="Govt Department" value={selectedJob?.department} icon={Building2} />
                                    <BlueprintField label="Open Vacancies" value={selectedJob?.vacancy} icon={Users} />
                                    <BlueprintField label="Application Channel" value={selectedJob?.application_mode} icon={Globe} />
                                    <BlueprintField label="Last Date to Apply" value={selectedJob?.last_date} icon={Calendar} />
                                    <BlueprintField label="Selection Methodology" value={selectedJob?.selection_process} icon={FileText} />
                                    <BlueprintField label="Min Age limit" value={selectedJob?.min_age} icon={Clock} />
                                    <BlueprintField label="Max Age limit" value={selectedJob?.max_age} icon={Clock} />
                                    <BlueprintField label="Application Fee" value={selectedJob?.exam_fee} icon={IndianRupee} />
                                </>
                            ) : (
                                <>
                                    <BlueprintField label="Parent Organization" value={selectedJob?.company_name} icon={Building2} />
                                    <BlueprintField label="Base Location" value={selectedJob?.location} icon={MapPin} />
                                    <BlueprintField label="Compensation Package" value={selectedJob?.salary_range} icon={IndianRupee} />
                                    <BlueprintField label="Employment Nature" value={selectedJob?.job_type} icon={Clock} />
                                    <BlueprintField label="Work Environment" value={selectedJob?.work_mode} icon={LayoutDashboard} />
                                    <BlueprintField label="Required Experience" value={selectedJob?.experience} icon={Award} />
                                    <BlueprintField label="Minimum Qualification" value={selectedJob?.qualification} icon={GraduationCap} />
                                    <BlueprintField label="Industry Sector" value={selectedJob?.company_industry} icon={Building2} />
                                    <BlueprintField label="Final Deadline" value={selectedJob?.application_deadline} icon={Calendar} />
                                    <div className="md:col-span-2 lg:col-span-3">
                                        <BlueprintField label="Primary Skillset" value={selectedJob?.skills} icon={Award} />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Description Section - Flat Container */}
                        <div className="mt-20 border-t border-slate-100 pt-16 px-2 md:px-6">
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-8 flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                                Mission Parameters & Full Description
                            </h4>
                            <div className="text-base md:text-xl font-semibold text-slate-600 leading-[1.8] whitespace-pre-wrap italic">
                                "{selectedJob?.description || 'No detailed blueprint provided.'}"
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-16 bg-slate-50 md:bg-transparent p-8 md:p-0 rounded-[2rem] md:rounded-none flex flex-col md:flex-row justify-between items-center gap-10 px-2 md:px-6">
                            <div className="text-center md:text-left">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">System Integrity Phase</p>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${selectedJob?.status === 'approved' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                                    <span className="text-sm font-black text-slate-900 uppercase">Verification Status: {selectedJob?.status}</span>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                <button onClick={() => setView('jobs')} className="w-full sm:w-auto bg-slate-900 text-white px-12 py-5 rounded-2xl md:rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl active:scale-95">Dismiss Blueprint</button>
                                {selectedJob?.status === 'pending' && (
                                    <button onClick={() => handleUpdateJob(selectedJob.id, { status: 'approved' })} className="w-full sm:w-auto bg-emerald-500 text-white px-12 py-5 rounded-2xl md:rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl active:scale-95">Verify & Approve</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            <JobModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                mode={modalMode}
                job={selectedJob}
                onSave={async (formData) => {
                    if (modalMode === 'reject') {
                        await handleUpdateJob(selectedJob.id, {
                            status: 'rejected',
                            rejection_reason: formData.rejection_reason
                        });
                    } else {
                        await handleUpdateJob(selectedJob.id, formData);
                    }
                }}
            />
        </div>
    );
};

const BlueprintField = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-5 group">
        <div className="p-4 bg-slate-50 rounded-2xl text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-sm shrink-0 border border-slate-100 group-hover:border-emerald-500">
            <Icon className="w-6 h-6" />
        </div>
        <div className="flex flex-col min-w-0 pt-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
            <span className="text-sm md:text-base font-semibold text-slate-900 uppercase tracking-tight truncate">{value || 'N/A'}</span>
        </div>
    </div>
);

export default ManageJobs;
