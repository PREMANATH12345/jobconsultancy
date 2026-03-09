import React, { useEffect, useState } from 'react';
import {
    Briefcase,
    MapPin,
    Calendar,
    Clock,
    Edit2,
    Trash2,
    Eye,
    PlusCircle,
    Loader2,
    Users,
    ChevronLeft,
    Mail,
    CheckCircle,
    XCircle,
    Download,
    Landmark,
    Target,
    IndianRupee,
    Layout,
    Award,
    Settings,
    Globe,
    Building2,
    User,
    Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { allService } from '../../services/api';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatIndianNumber } from '../../utils/helpers';

const MyJobs = () => {
    const { t } = useLanguage();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list', 'applicants', or 'details'
    const [selectedJob, setSelectedJob] = useState(null);
    const [applicants, setApplicants] = useState([]);
    const [loadingApplicants, setLoadingApplicants] = useState(false);
    const [exportingId, setExportingId] = useState(null);
    const [applicantLimit, setApplicantLimit] = useState(10);
    const [currentPlanRank, setCurrentPlanRank] = useState(0);
    const [currentPlanName, setCurrentPlanName] = useState('Basic');

    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem('user'));

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const [data, subsData, limitsData] = await Promise.all([
                allService.getData('jobs', { employer_id: user.id }),
                allService.getData('subscriptions', { employer_id: user.id }),
                allService.getData('plan_limits').catch(() => null) // Fallback if table doesn't exist yet
            ]);
            
            const rawJobs = Array.isArray(data) ? data : (data?.data || []);
            // Filter out soft-deleted jobs for the display list
            const myJobs = rawJobs.filter(j => String(j.deleted_at) !== '1'); 
            const mySubs = Array.isArray(subsData) ? subsData : [];
            const dbLimits = Array.isArray(limitsData) ? limitsData : [];

            const activeSubs = mySubs.filter(s => String(s.status).toLowerCase() === 'active');
            let currentLimit = 0; 
            let planName = 'No Active Plan';

            // Find latest active subscription
            const latestSub = activeSubs.sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0];

            if (latestSub) {
                planName = latestSub.plan_name;
                // Find matching plan limit in database, ignoring case safely
                const foundLimit = dbLimits.find(l => l.plan_name?.toLowerCase() === planName?.toLowerCase());
                
                // Set the limit, or default to 0 if something is bizarrely missing
                currentLimit = foundLimit ? parseInt(foundLimit.applicant_limit) : 0;
            }

            setApplicantLimit(currentLimit);
            setCurrentPlanName(planName);

            // Fetch application counts for each job
            const jobsWithStats = await Promise.all(myJobs.map(async (job) => {
                try {
                    const apps = await allService.getData('job_applications', { job_id: job.id });
                    const allApps = Array.isArray(apps) ? apps : [];
                    return {
                        ...job,
                        totalApps: allApps.length,
                        newApps: allApps.filter(app => app.status === 'applied').length
                    };
                } catch {
                    return { ...job, totalApps: 0, newApps: 0 };
                }
            }));

            setJobs(jobsWithStats);
        } catch (error) {
            toast.error("Failed to load jobs");
        } finally {
            setLoading(false);
        }
    };

    const fetchApplicants = async (job) => {
        try {
            setLoadingApplicants(true);
            setSelectedJob(job);
            setView('applicants');

            const applicationsData = await allService.getData('job_applications', { job_id: job.id });
            const jobApps = Array.isArray(applicationsData) ? applicationsData : [];

            const getFullUrl = (url) => {
                if (!url) return null;
                if (url.startsWith('http')) return url;
                const baseUrl = 'https://apiphp.dsofthub.com/jobconsultancy/';
                const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
                return `${baseUrl}${cleanUrl}`;
            };

            const enrichedApps = await Promise.all(
                jobApps.map(async (app) => {
                    try {
                        const userData = await allService.getData('users', { id: app.user_id });
                        const candidateUser = Array.isArray(userData) && userData.length > 0 ? userData[0] : null;

                        let userDetails = {};
                        try {
                            if (candidateUser?.user_details) {
                                userDetails = typeof candidateUser.user_details === 'string'
                                    ? JSON.parse(candidateUser.user_details)
                                    : candidateUser.user_details;
                            }
                        } catch (e) {
                            console.error('Failed to parse user_details:', e);
                        }

                        const documents = userDetails.documents || {};

                        return {
                            ...app,
                            candidate_name: candidateUser?.name || 'Unknown User',
                            candidate_email: candidateUser?.email || 'N/A',
                            expectedSalary: userDetails?.expectations?.expectedSalary ? `₹ ${formatIndianNumber(userDetails.expectations.expectedSalary)}` : 'Negotiable',
                            passportPhoto: getFullUrl(documents.passportPhoto),
                            resume: getFullUrl(documents.resume)
                        };
                    } catch (err) {
                        return { ...app, candidate_name: 'Error Loading' };
                    }
                })
            );

            setApplicants(enrichedApps);

            // 1. Mark 'applied' as 'under_review' when list is opened (clears job-level badge)
            const unreadApps = jobApps.filter(app => app.status === 'applied' || !app.status);
            if (unreadApps.length > 0) {
                await Promise.all(unreadApps.map(app =>
                    allService.updateData('job_applications', { id: app.id }, { status: 'under_review' })
                ));
                // Local state update to avoid extra fetch
                setApplicants(prev => prev.map(a => (a.status === 'applied' || !a.status) ? { ...a, status: 'under_review' } : a));
            }
        } catch (error) {
            toast.error("Failed to load applicants");
        } finally {
            setLoadingApplicants(false);
        }
    };

    const downloadApplicantsExcel = async (job) => {
        try {
            setExportingId(job.id);
            toast.loading("Preparing report...", { id: 'export-toast' });

            const applicationsData = await allService.getData('job_applications', { job_id: job.id });
            const allJobApps = Array.isArray(applicationsData) ? applicationsData : [];

            if (allJobApps.length === 0) {
                toast.error("No applicants found for this job", { id: 'export-toast' });
                setExportingId(null);
                return;
            }

            // Apply the subscription limit before downloading
            const jobApps = applicantLimit === -1 ? allJobApps : allJobApps.slice(0, applicantLimit);

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

    const updateApplicantStatus = async (appId, newStatus) => {
        try {
            await allService.updateData('job_applications', { id: appId }, { status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
            // Refresh applicants list
            const updatedApplicants = applicants.map(app =>
                app.id === appId ? { ...app, status: newStatus } : app
            );
            setApplicants(updatedApplicants);
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this job listing? Once deleted, it will still count towards your plan usage.")) return;
        try {
            // Soft delete: set deleted_at to 1 instead of hard delete
            await allService.updateData('jobs', { id }, { deleted_at: 1 });
            toast.success("Job deleted successfully");
            fetchJobs();
        } catch (error) {
            toast.error("Failed to delete job");
        }
    };

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved': return 'bg-green-100 text-green-600';
            case 'pending': return 'bg-amber-100 text-amber-600';
            case 'under_review': return 'bg-indigo-100 text-indigo-600';
            case 'viewed': return 'bg-slate-100 text-slate-500';
            case 'rejected': return 'bg-red-100 text-red-600';
            case 'shortlisted': return 'bg-blue-100 text-blue-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    if (view === 'details' && selectedJob) {
        const job = selectedJob;
        const isGovt = job.category === 'Government';

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setView('list')}
                        className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary hover:shadow-lg transition-all border border-slate-100"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('job Details')}</h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">{t('review Job Info')}</p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header Card */}
                    <div className={`${isGovt ? 'bg-transparent md:bg-amber-100 border-0 md:border-2 border-amber-400/20' : 'bg-transparent md:bg-pink-100 border-0 md:border-2 border-pink-400/20'} p-4 md:p-12 rounded-none md:rounded-[3.5rem] shadow-none md:shadow-xl relative overflow-hidden`}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                            {/* Logo */}
                            <div className="w-24 h-24 bg-black rounded-3xl flex items-center justify-center p-4 shadow-lg shrink-0">
                                {job.company_logo ? (
                                    <img src={job.company_logo} alt="logo" className="w-full h-full object-contain" />
                                ) : (
                                    <span className="text-white font-extrabold text-lg md:text-2xl tracking-tight">{job.company_name?.substring(0, 3) || 'JOB'}</span>
                                )}
                            </div>

                            <div className="flex-1 w-full">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                                    <div>
                                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight mb-2">{job.title}</h1>
                                        <p className={`${isGovt ? 'text-amber-600' : 'text-pink-600'} font-extrabold uppercase tracking-widest text-[10px] md:text-sm`}>
                                            {job.company_name || job.department || job.sector}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                                        <span className="bg-green-100 text-green-700 px-4 md:px-6 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-extrabold uppercase tracking-widest shadow-sm border border-green-200">
                                            {job.vacancy} Openings
                                        </span>
                                        <button
                                            onClick={() => navigate(`/employer/post-job?edit=${job.id}`)}
                                            className="bg-slate-900 text-white px-6 md:px-8 py-3 md:py-3 rounded-xl font-extrabold text-[10px] md:text-xs uppercase tracking-widest shadow-lg hover:bg-primary transition-all w-full md:w-auto flex items-center justify-center gap-2"
                                        >
                                            <Edit2 className="w-3.5 h-3.5 md:w-4 md:h-4" /> Edit Job
                                        </button>
                                    </div>
                                </div>

                                {!isGovt && (
                                    <div className="flex flex-wrap gap-4 md:gap-6 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-100/50">
                                        <div className="flex items-center gap-2 text-slate-500 font-extrabold text-[10px] md:text-xs uppercase tracking-wide">
                                            <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" /> {t(`districtsList.${job.location}`) !== `districtsList.${job.location}` ? t(`districtsList.${job.location}`) : (job.location || job.sector)}
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500 font-extrabold text-[10px] md:text-xs uppercase tracking-wide">
                                            <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" /> {job.shift || 'General Shift'}
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500 font-extrabold text-[10px] md:text-xs uppercase tracking-wide">
                                            <IndianRupee className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" /> {formatIndianNumber(job.salary_range)}
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500 font-extrabold text-[10px] md:text-xs uppercase tracking-wide">
                                            <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" /> {job.experience || 'Fresher'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {isGovt ? (
                        <div className="bg-transparent md:bg-amber-50 p-4 md:p-14 rounded-none md:rounded-[3.5rem] shadow-none md:shadow-xl border-0 md:border-2 border-amber-200 relative overflow-hidden">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 md:gap-y-10 gap-x-16">
                                <div className="space-y-1">
                                    <p className="text-[10px] md:text-sm font-extrabold text-slate-400 uppercase tracking-wide">Mode of Application</p>
                                    <p className="text-sm md:text-lg font-extrabold text-slate-900">{job.application_mode || 'Online'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] md:text-sm font-extrabold text-slate-400 uppercase tracking-wide">Selection Process</p>
                                    <p className="text-sm md:text-lg font-extrabold text-slate-900">{job.selection_process || 'Not Specified'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] md:text-sm font-extrabold text-slate-400 uppercase tracking-wide">Last Date to Apply</p>
                                    <p className="text-sm md:text-lg font-extrabold text-primary">{job.last_date ? new Date(job.last_date).toLocaleDateString('en-GB') : 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] md:text-xs font-extrabold text-slate-400 uppercase tracking-widest">Status</p>
                                    <span className={`inline-block px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-extrabold uppercase tracking-widest mt-1 ${getStatusStyle(job.status)}`}>
                                        {job.status || 'Active'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-8">
                                <div className="bg-transparent md:bg-white p-4 md:p-10 rounded-none md:rounded-[2.5rem] shadow-none md:shadow-sm border-0 md:border border-slate-100">
                                    <h3 className="text-lg md:text-xl font-extrabold text-slate-800 mb-4 md:mb-6 flex items-center gap-3">
                                        <Layout className="w-5 h-5 text-primary" /> Job Description
                                    </h3>
                                    <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-line text-sm md:text-base">{job.description}</p>
                                </div>

                                {job.skills && (
                                    <div className="bg-transparent md:bg-white p-4 md:p-10 rounded-none md:rounded-[2.5rem] shadow-none md:shadow-sm border-0 md:border border-slate-100">
                                        <h3 className="text-lg md:text-xl font-extrabold text-slate-800 mb-4 md:mb-6 flex items-center gap-3">
                                            <Award className="w-5 h-5 text-primary" /> Required Skills
                                        </h3>
                                        <div className="flex flex-wrap gap-2 md:gap-3">
                                            {job.skills.split(',').map((skill, i) => (
                                                <span key={i} className="bg-slate-50 text-slate-700 px-4 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-sm font-extrabold border border-slate-100">
                                                    {skill.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-8">
                                <div className="bg-transparent md:bg-white p-4 md:p-8 rounded-none md:rounded-[2.5rem] border-0 md:border border-slate-100 shadow-none md:shadow-sm">
                                    <h3 className="text-base font-extrabold text-slate-800 mb-4 md:mb-6 flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-primary" /> About Company
                                    </h3>
                                    <div className="space-y-3 md:space-y-4">
                                        <div className="flex justify-between items-start gap-4 text-[10px] md:text-sm">
                                            <span className="text-slate-500 font-extrabold shrink-0">Industry:</span>
                                            <span className="font-extrabold text-slate-900 text-right">{job.company_industry || '-'}</span>
                                        </div>
                                        <div className="flex justify-between items-start gap-4 text-[10px] md:text-sm">
                                            <span className="text-slate-500 font-extrabold shrink-0">Company Type:</span>
                                            <span className="font-extrabold text-slate-900 text-right">{job.company_type || 'Private Ltd'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl text-white">
                                    <h3 className="text-base font-extrabold mb-4 md:mb-6 flex items-center gap-2 text-primary">
                                        <Calendar className="w-5 h-5" /> Timeline
                                    </h3>
                                    <div className="space-y-3 md:space-y-4">
                                        <div className="flex justify-between items-center text-[10px] md:text-sm">
                                            <span className="text-slate-400 font-extrabold">Posted:</span>
                                            <span className="font-extrabold">{new Date(job.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] md:text-sm">
                                            <span className="text-slate-400 font-extrabold">Expires:</span>
                                            <span className="font-extrabold">{job.expiry_date || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (view === 'applicants') {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setView('list')}
                            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary hover:shadow-lg transition-all border border-slate-100"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex flex-wrap items-center gap-2 md:gap-3">
                                <Users className="w-5 h-5 md:w-8 md:h-8 text-primary shrink-0" />
                                <span>Applicants for</span>
                                <span className="text-primary break-all">{selectedJob?.title}</span>
                            </h1>
                            <p className="text-[10px] md:text-sm text-slate-500 font-semibold mt-1">Review and manage candidates for this position</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={() => downloadApplicantsExcel(selectedJob)}
                        disabled={exportingId === selectedJob.id || applicants.length === 0}
                        className="w-full md:w-auto bg-slate-900 text-white px-8 md:px-10 py-4 md:py-4 rounded-xl md:rounded-[1.5rem] font-extrabold text-[10px] md:text-xs uppercase tracking-widest hover:bg-primary transition-all shadow-xl flex items-center justify-center gap-3 md:gap-4 disabled:opacity-50 group/btn"
                    >
                        {exportingId === selectedJob.id ? (
                            <Loader2 className="w-4 h-4 md:w-5 h-5 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4 md:w-5 h-5 group-hover/btn:-translate-y-1 transition-transform" />
                        )}
                        {exportingId === selectedJob.id ? 'Exporting...' : 'Download Details In Excel'}
                    </button>
                </div>

                {loadingApplicants ? (
                    <div className="flex flex-col items-center justify-center h-96 bg-white rounded-[3rem] border border-slate-100">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Candidates...</p>
                    </div>
                ) : applicants.length === 0 ? (
                    <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 p-24 text-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                            <Users className="w-12 h-12 text-slate-200" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-3">No Applicants Yet</h3>
                        <p className="text-slate-400 font-medium max-w-sm mx-auto text-sm">Once candidates apply for this job, they will appear here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {applicantLimit !== -1 && (
                            <div className="bg-slate-50 p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                                <div className="flex items-center gap-5 text-left">
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-900 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg">
                                        <Award className="w-6 h-6 md:w-8 md:h-8" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-lg md:text-xl font-bold text-slate-900 uppercase tracking-tight">Recruitment Quota</h3>
                                        <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Viewing limit based on your active plan</p>
                                    </div>
                                </div>
                                <div className="bg-white px-6 md:px-8 py-3 md:py-4 rounded-xl border border-slate-200 shadow-sm text-center md:text-right shrink-0">
                                    <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Visible Candidates</span>
                                    <span className="text-2xl md:text-3xl font-black text-slate-900">{Math.min(applicants.length, applicantLimit)} <span className="text-sm font-bold text-slate-300">/ {applicantLimit}</span></span>
                                </div>
                            </div>
                        )}
                        {(applicantLimit === -1 ? applicants : applicants.slice(0, applicantLimit)).map((app) => (
                            <div key={app.id} className="bg-white p-4 md:p-8 rounded-2xl md:rounded-[3rem] shadow-sm border border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4 md:gap-8 hover:shadow-xl transition-all group">
                                <div className="flex items-center gap-4 md:gap-8">
                                    <div className="w-16 h-16 md:w-24 md:h-24 bg-slate-50 rounded-xl md:rounded-3xl flex items-center justify-center text-xl md:text-3xl font-extrabold text-primary border border-slate-100 overflow-hidden ring-4 ring-slate-50 group-hover:ring-primary/10 transition-all shrink-0">
                                        {app.passportPhoto ? (
                                            <img src={app.passportPhoto} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            app.candidate_name?.charAt(0)
                                        )}
                                    </div>
                                    <div className="space-y-1.5 md:space-y-3 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 md:gap-4">
                                            <h3 className="text-lg md:text-2xl font-extrabold text-slate-900 tracking-tight truncate">{app.candidate_name}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 md:px-5 py-1 md:py-2 rounded-full text-[8px] md:text-[10px] font-extrabold uppercase tracking-widest ${getStatusStyle(app.status)}`}>
                                                    {app.status || 'Applied'}
                                                </span>
                                                {(app.status === 'under_review' || app.status === 'applied') && (
                                                    <span className="bg-primary text-white text-[10px] md:text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-wider animate-pulse shadow-md shadow-primary/20 flex items-center gap-1.5 border border-white/20">
                                                        <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                                                        New Applicant
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 md:gap-x-8 gap-y-1 text-[9px] md:text-xs font-semibold text-slate-400 tracking-wide">
                                            <span className="flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5 text-primary" /> {app.expectedSalary}</span>
                                            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-primary" /> {app.candidate_email}</span>
                                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-primary" /> {new Date(app.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 md:gap-4 flex-wrap w-full md:w-auto">
                                    <button
                                        onClick={async () => {
                                            // 2. Mark as 'viewed' when clicking Resume (clears Individual badge)
                                            if (app.status === 'under_review' || !app.status || app.status === 'applied') {
                                                await allService.updateData('job_applications', { id: app.id }, { status: 'viewed' });
                                                setApplicants(prev => prev.map(a => a.id === app.id ? { ...a, status: 'viewed' } : a));
                                            }
                                            navigate(`/employer/candidate-details/${app.user_id}?appId=${app.id}`);
                                        }}
                                        className="flex-1 md:flex-none bg-slate-900 text-white px-5 md:px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-extrabold text-[10px] md:text-xs uppercase tracking-widest hover:bg-primary transition-all shadow-lg flex items-center justify-center gap-2 md:gap-3 group/btn"
                                    >
                                        <Eye className="w-4 h-4 md:w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                        View Resume
                                    </button>

                                    <div className="flex items-center gap-2 md:gap-3 w-auto md:w-auto">
                                        {app.status !== 'shortlisted' && (
                                            <button
                                                onClick={() => updateApplicantStatus(app.id, 'shortlisted')}
                                                className="p-3.5 md:p-4 bg-green-50 text-green-600 rounded-xl md:rounded-2xl hover:bg-green-600 hover:text-white transition-all shadow-sm border border-green-100"
                                                title="Shortlist Candidate"
                                            >
                                                <CheckCircle className="w-5 h-5 md:w-6 md:h-6" />
                                            </button>
                                        )}
                                        {app.status !== 'rejected' && (
                                            <button
                                                onClick={() => updateApplicantStatus(app.id, 'rejected')}
                                                className="p-3.5 md:p-4 bg-red-50 text-red-500 rounded-xl md:rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100"
                                                title="Reject Candidate"
                                            >
                                                <XCircle className="w-5 h-5 md:w-6 md:h-6" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {applicantLimit !== -1 && applicants.length > applicantLimit && (
                            <div className="bg-slate-900 text-white p-6 md:p-10 rounded-2xl md:rounded-[3rem] flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group border border-slate-800">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl flex items-center justify-center text-primary mb-6 shadow-xl border border-white/10 group-hover:scale-110 transition-transform">
                                    <Lock className="w-8 h-8 md:w-10 md:h-10" />
                                </div>
                                <h3 className="text-xl md:text-3xl font-extrabold tracking-tight mb-3">+{applicants.length - applicantLimit} Applicants Hidden</h3>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-xs max-w-lg mb-8">
                                    Your {applicantLimit} visible capacity is linked to your {currentPlanName} plan. Upgrade to {currentPlanRank === 2 ? 'Unlimited' : currentPlanRank === 1 ? 'Growth or Unlimited' : 'Starter, Growth, or Unlimited'} to review the entire talent pool!
                                </p>
                                <button
                                    onClick={() => navigate('/employer/profile')}
                                    className="bg-primary text-white  px-8 md:px-12 py-4 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-xl"
                                >
                                    Upgrade Subscription
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6 md:space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
                <div>
                    <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 uppercase tracking-tight">My Job Postings</h1>
                    <p className="text-xs md:text-sm text-slate-500 font-semibold mt-1">Manage and track all your active vacancies.</p>
                </div>
                <button
                    onClick={() => navigate('/employer/post-job')}
                    className="w-full md:w-auto bg-primary text-white px-6 md:px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-extrabold text-[10px] md:text-[11px] uppercase tracking-widest hover:bg-pink-600 transition-all flex items-center justify-center gap-2 md:gap-3 shadow-xl"
                >
                    <PlusCircle className="w-4 h-4 md:w-5 h-5" />
                    Post New Job
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            ) : jobs.length === 0 ? (
                <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 p-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Briefcase className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2">No Jobs Posted Yet</h3>
                    <p className="text-slate-400 font-medium max-w-sm mx-auto mb-10 text-sm">Start hiring today by posting your first job vacancy on our platform.</p>
                    <button
                        onClick={() => navigate('/employer/post-job')}
                        className="bg-slate-900 text-white px-10 py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary transition-all"
                    >
                        Create Your First Job
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 md:gap-8">
                    {jobs.map((job) => (
                        <div key={job.id} className="bg-white p-4 md:p-8 rounded-2xl md:rounded-[3rem] shadow-sm border border-slate-100 group hover:border-primary/20 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-8">
                            <div className="flex items-start gap-3 md:gap-6">
                                <div className="w-10 h-10 md:w-16 md:h-16 bg-pink-50 rounded-xl md:rounded-2xl flex items-center justify-center text-primary border border-pink-100 group-hover:border-primary transition-all shrink-0">
                                    <Briefcase className="w-5 h-5 md:w-8 md:h-8" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-1 md:mb-2">
                                        <h3 className="text-base md:text-2xl font-extrabold text-slate-900 tracking-tight truncate">{job.title}</h3>
                                        <span className={`px-2.5 md:px-4 py-0.5 md:py-1.5 rounded-full text-[7px] md:text-xs font-extrabold uppercase tracking-widest ${getStatusStyle(job.status)}`}>
                                            {job.status || 'Pending'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] md:text-xs font-semibold text-slate-400 tracking-wide">
                                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-primary" /> {t(`districtsList.${job.location}`) !== `districtsList.${job.location}` ? t(`districtsList.${job.location}`) : (job.location || 'Remote')}</span>
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-primary" /> {job.job_type || 'Full Time'}</span>
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-primary" /> {new Date(job.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col lg:flex-row gap-4 items-center w-full lg:w-auto">
                                <div className="flex items-center gap-2 md:gap-3 order-1 lg:order-2 w-full lg:w-auto justify-end">
                                    <button
                                        onClick={() => { setSelectedJob(job); setView('details'); }}
                                        className="bg-white border border-slate-100 text-slate-600 p-3 md:p-4 rounded-xl md:rounded-2xl font-extrabold text-[9px] md:text-xs hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-center gap-2 group/public shadow-sm"
                                        title="View Job"
                                    >
                                        <Eye className="w-4 h-4 md:w-5 h-5 group-hover/public:scale-110 transition-transform text-primary" />
                                    </button>
                                    <button
                                        onClick={() => navigate(`/employer/post-job?edit=${job.id}`)}
                                        className="bg-amber-50 border border-amber-100 text-amber-600 p-3 md:p-4 rounded-xl md:rounded-2xl font-extrabold text-[9px] md:text-xs hover:bg-amber-600 hover:text-white transition-all flex items-center justify-center gap-2 group/edit shadow-sm"
                                        title="Edit Job"
                                    >
                                        <Edit2 className="w-4 h-4 md:w-5 h-5 group-hover/edit:scale-110 transition-transform" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(job.id)}
                                        className="p-3 md:p-4 bg-red-50 border border-red-100 text-red-500 rounded-xl md:rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center justify-center"
                                        title="Delete Job"
                                    >
                                        <Trash2 className="w-4 h-4 md:w-5 h-5" />
                                    </button>
                                </div>

                                <button
                                    onClick={() => fetchApplicants(job)}
                                    className="w-full lg:w-auto bg-slate-900 text-white px-5 md:px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-extrabold text-[10px] md:text-xs hover:bg-primary transition-all shadow-lg flex items-center justify-center gap-2 md:gap-3 group/view order-2 lg:order-1 relative"
                                >
                                    <Users className="w-4 h-4 md:w-5 h-5 group-hover/view:scale-110 transition-transform" />
                                    View Applicants
                                    {job.newApps > 0 && (
                                        <span className="absolute -top-2 -right-2 h-5 min-w-[20px] px-1 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-lg">
                                            {job.newApps}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyJobs;
