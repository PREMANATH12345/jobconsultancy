
import React, { useState, useEffect } from 'react';
import {
    Download,
    FileText,
    Search,
    Loader2,
    Briefcase,
    Users,
    Calendar,
    CheckCircle,
    MapPin,
    Building2,
    ChevronRight,
    ArrowRight,
    ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { allService } from '../../services/api';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';

const ApplicantReports = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exportingId, setExportingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const user = JSON.parse(sessionStorage.getItem('user'));

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const data = await allService.getData('jobs', { employer_id: user.id });
            setJobs(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error("Failed to load jobs");
        } finally {
            setLoading(false);
        }
    };

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

    const filteredJobs = jobs.filter(j =>
        j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-3 md:gap-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary transition-all border border-slate-100 shadow-sm shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <div className="flex flex-col justify-center">
                        <h1 className="text-xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                            Applicant Reports
                        </h1>
                        <p className="text-[10px] md:text-sm text-slate-500 font-extrabold flex items-center gap-1.5 md:gap-2 mt-0.5 md:mt-1">
                            <span className="leading-tight">Export candidate details for your job postings</span>
                        </p>
                    </div>
                </div>

                <div className="relative group w-full md:w-80">
                    <Search className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search jobs..."
                        className="w-full pl-12 md:pl-14 pr-6 md:pr-8 py-4 md:py-5 rounded-xl md:rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-900/5 outline-none focus:border-primary/30 transition-all font-extrabold text-xs md:text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Main Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 md:h-96 bg-white rounded-2xl md:rounded-[3rem] border border-slate-100">
                    <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-primary mb-4 md:mb-6" />
                    <p className="text-[10px] md:text-sm font-extrabold text-slate-400 uppercase tracking-widest">Accessing Database...</p>
                </div>
            ) : jobs.length === 0 ? (
                <div className="bg-white rounded-2xl md:rounded-[4rem] border-2 border-dashed border-slate-100 p-12 md:p-24 text-center mx-4 md:mx-0">
                    <div className="w-16 h-16 md:w-24 md:h-24 bg-slate-50 rounded-xl md:rounded-[2rem] flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner">
                        <Briefcase className="w-8 h-8 md:w-12 md:h-12 text-slate-200" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight mb-2 md:mb-3">No Jobs to Report</h2>
                    <p className="text-slate-400 font-extrabold max-w-sm mx-auto text-[10px] md:text-sm leading-relaxed px-4 md:px-0">
                        You haven't posted any jobs yet. Post a vacancy to start collecting applicant data.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    <div className="grid grid-cols-12 px-10 mb-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest hidden lg:grid">
                        <div className="col-span-6">Job Specification</div>
                        <div className="col-span-3 text-center">Engagement</div>
                        <div className="col-span-3 text-right">Actions</div>
                    </div>

                    {filteredJobs.length === 0 ? (
                        <div className="text-center py-12 md:py-20 bg-white rounded-2xl md:rounded-[3rem] border border-slate-100 mx-4 md:mx-0">
                            <p className="text-slate-400 font-extrabold uppercase tracking-widest text-[10px]">No matching jobs found</p>
                        </div>
                    ) : (
                        filteredJobs.map((job) => (
                            <div key={job.id} className="group bg-white p-5 md:p-8 lg:p-10 rounded-2xl md:rounded-[3rem] shadow-sm hover:shadow-2xl border border-slate-50 hover:border-primary/20 transition-all duration-500 mx-4 md:mx-0">
                                <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-6 md:gap-8">
                                    {/* Job Info */}
                                    <div className="col-span-1 lg:col-span-6 flex items-center gap-4 md:gap-8">
                                        <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-xl md:rounded-[1.5rem] flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner shrink-0">
                                            <Briefcase className="w-8 h-8 md:w-10 md:h-10" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-1.5 md:mb-3">
                                                <h3 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight group-hover:text-primary transition-colors truncate">
                                                    {job.title}
                                                </h3>
                                                <span className={`px-3 md:px-4 py-0.5 md:py-1 rounded-full text-[8px] md:text-[10px] font-extrabold uppercase tracking-widest ${job.category === 'Government' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-pink-50 text-pink-600 border border-pink-100'
                                                    }`}>
                                                    {job.category}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 md:gap-6 text-[10px] md:text-xs font-extrabold text-slate-400 tracking-wide">
                                                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" /> {t(`districtsList.${job.location}`) !== `districtsList.${job.location}` ? t(`districtsList.${job.location}`) : (job.location || 'Remote')}</span>
                                                <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-primary" /> {job.company_name || 'Organization'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Stats */}
                                    <div className="col-span-1 lg:col-span-3 flex justify-center lg:border-l lg:border-slate-50">
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center gap-2.5 bg-slate-50 px-5 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl mb-1.5 md:mb-2 group-hover:bg-primary/5 transition-colors">
                                                <Users className="w-4 h-4 md:w-5 h-5 text-primary" />
                                                <span className="text-base md:text-lg font-extrabold text-slate-900 group-hover:text-primary transition-colors">Data Ready</span>
                                            </div>
                                            <span className="text-[9px] md:text-[10px] font-extrabold text-slate-400 tracking-wide uppercase">Full History Available</span>
                                        </div>
                                    </div>
                                    {/* Action */}
                                    <div className="col-span-1 lg:col-span-3 flex justify-end">
                                        <button
                                            onClick={() => downloadApplicantsExcel(job)}
                                            disabled={exportingId === job.id}
                                            className="w-full lg:w-auto bg-slate-900 text-white px-8 md:px-10 py-4 md:py-5 rounded-xl md:rounded-[1.5rem] font-extrabold text-[10px] md:text-xs uppercase tracking-widest hover:bg-primary transition-all shadow-xl flex items-center justify-center gap-3 md:gap-4 disabled:opacity-50 group/btn"
                                        >
                                            {exportingId === job.id ? (
                                                <Loader2 className="w-4 h-4 md:w-5 h-5 animate-spin" />
                                            ) : (
                                                <Download className="w-4 h-4 md:w-5 h-5 group-hover/btn:-translate-y-1 transition-transform" />
                                            )}
                                            {exportingId === job.id ? 'Exporting...' : 'Download Details'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Quick Tip */}
            {!loading && jobs.length > 0 && (
                <div className="bg-primary/5 border border-primary/10 p-6 md:p-8 rounded-2xl md:rounded-[3rem] flex flex-col md:flex-row items-center gap-6 shadow-sm mx-4 md:mx-0">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-primary shadow-sm shrink-0">
                        <FileText className="w-6 h-6 md:w-7 h-7" />
                    </div>
                    <div>
                        <h4 className="text-sm md:text-base font-extrabold text-slate-900 tracking-tight mb-1">Clean & Professional Export</h4>
                        <p className="text-slate-500 font-extrabold text-[10px] md:text-sm tracking-wide max-w-2xl leading-relaxed">
                            The downloaded CSV file is optimized for Microsoft Excel, Google Sheets, and Apple Numbers.
                            It includes candidate contact info, experience levels, and specific application timestamps for
                            better hiring decisions.
                        </p>
                    </div>
                    <div className="ml-auto flex items-center gap-4">
                        <div className="h-10 w-px bg-slate-200 hidden md:block" />
                        <span className="text-[9px] md:text-[10px] font-extrabold text-slate-400 uppercase tracking-widest shrink-0">UTF-8 Encoded</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicantReports;
