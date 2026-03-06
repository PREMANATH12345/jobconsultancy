import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, IndianRupee, Filter, Search, User, Edit3, Building2, Calendar, Plus, Trash2, ArrowLeft, Send, Loader2, Landmark, Award, FileText, Globe, Clock, CheckCircle, Eye, Users, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { allService } from '../../services/api';
import { TN_DISTRICTS } from '../../constants/districts';

const ManageGovtJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [view, setView] = useState('list'); // 'list', 'create', 'edit', 'details', 'applicants'
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGovtType, setFilterGovtType] = useState('all');
    const [applicants, setApplicants] = useState([]);
    const [loadingApplicants, setLoadingApplicants] = useState(false);

    const adminUser = JSON.parse(sessionStorage.getItem('user')) || {};

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Government',
        job_role_category: 'Administrative',
        govt_type: 'Central Government',
        department: '',
        sector: 'Banking',
        vacancy: '',
        application_mode: 'Online',
        exam_fee: '',
        last_date: '',
        post_name: '',
        application_start_date: '',
        min_age: '',
        max_age: '',
        age_relaxation: '',
        selection_process: '',
        expiry_date: '',
        expiry_time: '23:59',
        district: '',
        status: 'approved',
        redirect_link: ''
    });

    const [selectedJob, setSelectedJob] = useState(null);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const data = await allService.getData('jobs', { category: 'Government' });
            setJobs(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error("Failed to load jobs");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClick = () => {
        setFormData({
            title: '',
            description: '',
            category: 'Government',
            job_role_category: 'Administrative',
            govt_type: 'Central Government',
            department: '',
            sector: 'Banking',
            vacancy: '',
            application_mode: 'Online',
            exam_fee: '',
            last_date: '',
            post_name: '',
            application_start_date: '',
            min_age: '',
            max_age: '',
            age_relaxation: '',
            selection_process: '',
            expiry_date: '',
            expiry_time: '23:59',
            district: '',
            status: 'approved',
            redirect_link: ''
        });
        setView('create');
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

        setFormData({
            ...job,
            expiry_date: exDate,
            expiry_time: exTime
        });
        setView('edit');
    };

    const handleViewClick = (job) => {
        setSelectedJob(job);
        setView('details');
    };

    const handleViewApplicants = async (job) => {
        setSelectedJob(job);
        setView('applicants');
        try {
            setLoadingApplicants(true);
            const data = await allService.getData('job_applications', { job_id: job.id });
            const apps = Array.isArray(data) ? data : [];

            // Enrich with user names
            const enriched = await Promise.all(apps.map(async (app) => {
                const userData = await allService.getData('users', { id: app.user_id });
                return {
                    ...app,
                    user_name: userData && userData[0] ? userData[0].name : 'Unknown Candidate',
                    user_email: userData && userData[0] ? userData[0].email : 'N/A'
                };
            }));
            setApplicants(enriched);
        } catch (error) {
            toast.error("Failed to load applicants");
        } finally {
            setLoadingApplicants(false);
        }
    };

    const handleUpdateStatus = async (appId, newStatus) => {
        try {
            await allService.updateData('job_applications', { id: appId }, { status: newStatus });
            setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
            toast.success(`Application marked as ${newStatus}`);
        } catch (error) {
            toast.error("Status update failed");
        }
    };

    const handleDeleteClick = async (id) => {
        if (!window.confirm("Are you sure you want to delete this job posting? This action cannot be undone.")) return;
        try {
            await allService.deleteData('jobs', { id }, true);
            toast.success("Job deleted successfully");
            fetchJobs();
        } catch (error) {
            toast.error("Deletion failed");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let job_expiry = null;
            if (formData.expiry_date && formData.expiry_time) {
                job_expiry = `${formData.expiry_date} ${formData.expiry_time}:00`;
            }

            const payload = { ...formData, job_expiry, employer_id: adminUser.id || 18 };
            delete payload.expiry_date;
            delete payload.expiry_time;

            // Remove internal DB fields if editing
            if (view === 'edit') {
                const { id, created_at, updated_at, ...updateData } = payload;
                await allService.updateData('jobs', { id: selectedJob.id }, updateData);
                toast.success("Job updated successfully");
            } else {
                await allService.insertData('jobs', payload);
                toast.success("Government job posted successfully");
            }
            setView('list');
            fetchJobs();
        } catch (error) {
            toast.error("Operation failed: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.department?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterGovtType === 'all' || job.govt_type === filterGovtType;
        return matchesSearch && matchesType;
    });

    const inputClass = "w-full pl-12 pr-6 py-4 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 outline-none text-slate-900 transition-all font-bold text-sm mb-4";
    const labelClass = "text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block";
    const iconClass = "absolute left-4 top-[2.4rem] w-5 h-5 text-slate-300";

    if (loading && view === 'list') {
        return <div className="p-10 text-center uppercase font-black text-slate-400 tracking-widest">Loading Government Jobs...</div>;
    }

    return (
        <div className="p-4 md:p-8">
            {view === 'list' ? (
                <div className="animate-in fade-in duration-500">
                    <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Government Postings</h1>
                            <p className="text-sm font-medium text-slate-500 mt-1">Manage and publish official government opportunities.</p>
                        </div>
                        <button
                            onClick={handleCreateClick}
                            className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center gap-3 shadow-xl active:scale-95 w-full md:w-auto justify-center"
                        >
                            <Plus className="w-5 h-5" /> Post New Job
                        </button>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xl mb-8">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                placeholder="Search by title or department..."
                                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-100 text-sm font-bold outline-none focus:border-indigo-500 transition-all bg-slate-50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="px-4 py-3 rounded-xl border border-slate-100 text-xs font-bold uppercase tracking-wider outline-none focus:border-indigo-500 cursor-pointer shadow-sm bg-slate-50"
                            value={filterGovtType}
                            onChange={(e) => setFilterGovtType(e.target.value)}
                        >
                            <option value="all">All Govt Types</option>
                            <option value="Central Government">Central Govt</option>
                            <option value="State Government">State Govt</option>
                            <option value="Public Sector Unit (PSU)">PSU</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredJobs.map(job => (
                            <div key={job.id} className="bg-white rounded-[2rem] border border-slate-100 hover:border-indigo-500 transition-all group overflow-hidden shadow-xl flex flex-col">
                                <div className="h-2 w-full bg-indigo-600" />
                                <div className="p-6 md:p-8 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 italic">
                                            {job.govt_type}
                                        </span>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleViewClick(job)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="View Details">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleEditClick(job)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit">
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteClick(job.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors" title="Delete">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2 line-clamp-2 leading-snug">
                                            {job.title}
                                        </h3>
                                        <p className="text-xs font-semibold text-slate-500 mb-4 flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-indigo-500" /> {job.department}
                                        </p>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase">
                                                <Calendar className="w-4 h-4 text-indigo-500" />
                                                Last Date: {job.last_date ? new Date(job.last_date).toLocaleDateString() : 'N/A'}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase">
                                                <User className="w-4 h-4 text-indigo-500" />
                                                Vacancies: {job.vacancy || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {filteredJobs.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 mt-8">
                            <Landmark className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No government jobs found.</p>
                        </div>
                    )}
                </div>
            ) : view === 'details' ? (
                <div className="animate-in zoom-in duration-500 max-w-5xl mx-auto">
                    <button
                        onClick={() => setView('list')}
                        className="mb-8 text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-indigo-600 transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Return to List
                    </button>

                    <div className="space-y-12">
                        <div className="px-2 md:px-8">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                                <div>
                                    <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-indigo-100 mb-4 inline-block">
                                        {selectedJob?.govt_type} Official Posting
                                    </span>
                                    <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 uppercase tracking-tighter leading-[1.1]">
                                        {selectedJob?.title}
                                    </h2>
                                    <p className="text-lg font-semibold text-slate-500 mt-3 flex items-center gap-3">
                                        <Building2 className="w-6 h-6 text-indigo-500" /> {selectedJob?.department}
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => handleEditClick(selectedJob)} className="p-4 bg-slate-50 text-slate-700 rounded-2xl hover:bg-slate-100 transition-all border border-slate-200">
                                        <Edit3 className="w-6 h-6" />
                                    </button>
                                    <button onClick={() => handleDeleteClick(selectedJob.id)} className="p-4 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-all border border-rose-200">
                                        <Trash2 className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 mb-12">
                                <DetailBox icon={Landmark} label="Sector" value={selectedJob?.sector} />
                                <DetailBox icon={User} label="Vacancies" value={selectedJob?.vacancy} />
                                <DetailBox icon={MapPin} label="Location" value={selectedJob?.location || 'Across India'} />
                                <DetailBox icon={Calendar} label="Application Starts" value={selectedJob?.application_start_date ? new Date(selectedJob.application_start_date).toLocaleDateString() : 'Immediate'} />
                                <DetailBox icon={Calendar} label="Closing Date" value={selectedJob?.last_date ? new Date(selectedJob.last_date).toLocaleDateString() : 'N/A'} color="text-rose-500" />
                                <div className="col-span-2 md:col-span-1">
                                    <DetailBox icon={IndianRupee} label="Exam Fee" value={selectedJob?.exam_fee} />
                                </div>
                                <DetailBox icon={Briefcase} label="Application Mode" value={selectedJob?.application_mode} />
                                <DetailBox icon={Globe} label="Min Age" value={selectedJob?.min_age ? `${selectedJob.min_age} Years` : 'N/A'} />
                                <DetailBox icon={Globe} label="Max Age" value={selectedJob?.max_age ? `${selectedJob.max_age} Years` : 'N/A'} />
                                <div className="col-span-2 md:col-span-1">
                                    <DetailBox icon={Globe} label="Redirect Link" value={selectedJob?.redirect_link} isLink={true} />
                                </div>
                            </div>

                            <div className="space-y-10">
                                <section>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-indigo-600" /> Selection Process
                                    </h3>
                                    <p className="bg-slate-50 p-6 rounded-2xl text-slate-700 font-semibold leading-relaxed border border-slate-100 italic">
                                        {selectedJob?.selection_process || 'No specific selection process mentioned.'}
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-3">
                                        <Briefcase className="w-5 h-5 text-indigo-600" /> Job Description & Perks
                                    </h3>
                                    <div className="bg-white p-8 rounded-[2rem] text-slate-700 font-semibold leading-[1.8] border border-slate-100 shadow-sm whitespace-pre-wrap italic">
                                        {selectedJob?.description}
                                    </div>
                                </section>

                                {selectedJob?.age_relaxation && (
                                    <section>
                                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-3">
                                            <Award className="w-5 h-5 text-indigo-600" /> Age Relaxation Details
                                        </h3>
                                        <p className="text-slate-600 font-semibold bg-amber-50 p-6 rounded-2xl border border-amber-100 italic">
                                            {selectedJob.age_relaxation}
                                        </p>
                                    </section>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : view === 'applicants' ? (
                <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
                    <button
                        onClick={() => setView('list')}
                        className="mb-8 text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-indigo-600 transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Jobs
                    </button>

                    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                        <div className="p-8 md:p-12">
                            <div className="mb-10 text-left">
                                <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter italic">
                                    Candidates for <span className="text-indigo-600">{selectedJob?.title}</span>
                                </h2>
                                <p className="text-sm font-bold text-slate-400 mt-2 lowercase">Review and manage student applications for this posting.</p>
                            </div>

                            {loadingApplicants ? (
                                <div className="py-20 text-center">
                                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Fetching application records...</p>
                                </div>
                            ) : applicants.length === 0 ? (
                                <div className="py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-left">
                                    <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest text-center">No applications received yet.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto text-left">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-slate-100">
                                                <th className="py-6 px-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Candidate</th>
                                                <th className="py-6 px-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Applied Info</th>
                                                <th className="py-6 px-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Status</th>
                                                <th className="py-6 px-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Update Status</th>
                                                <th className="py-6 px-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Resume</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {applicants.map(app => (
                                                <tr key={app.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-6 px-4 font-bold">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xs uppercase shadow-lg shadow-indigo-600/20 shrink-0">
                                                                {app.user_name?.substring(0, 2)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">{app.user_name}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 lowercase italic truncate">{app.user_email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-4">
                                                        <div className="text-[10px] font-bold text-slate-500 flex flex-col gap-1">
                                                            <span className="flex items-center gap-2 font-bold"><Calendar className="w-3 h-3 text-indigo-400" /> {new Date(app.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-4">
                                                        <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${app.status === 'select' || app.status === 'selected' ? 'bg-emerald-100 text-emerald-700' :
                                                            app.status === 'reject' || app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                                app.status === 'shortlist' ? 'bg-blue-100 text-blue-700' :
                                                                    app.status === 'hold' ? 'bg-amber-100 text-amber-700' :
                                                                        'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            {app.status || 'applied'}
                                                        </span>
                                                    </td>
                                                    <td className="py-6 px-4 font-bold">
                                                        <select
                                                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-wider outline-none focus:border-indigo-500 cursor-pointer"
                                                            value={app.status || 'applied'}
                                                            onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                                                        >
                                                            <option value="applied">Pending</option>
                                                            <option value="hold">Hold</option>
                                                            <option value="shortlist">Shortlist</option>
                                                            <option value="select">Select</option>
                                                            <option value="reject">Reject</option>
                                                        </select>
                                                    </td>
                                                    <td className="py-6 px-4 font-bold">
                                                        {app.resume ? (
                                                            <a
                                                                href={app.resume.startsWith('http') ? app.resume : `https://apiphp.dsofthub.com/jobconsultancy/${app.resume}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-indigo-600 hover:text-indigo-800 font-bold text-xs uppercase tracking-widest flex items-center gap-2"
                                                            >
                                                                <FileText className="w-4 h-4" /> View PDF
                                                            </a>
                                                        ) : <span className="text-slate-300 font-bold text-[10px]">No Attachment</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="animate-in slide-in-from-bottom-6 duration-500 max-w-4xl mx-auto">
                    <button
                        onClick={() => setView('list')}
                        className="mb-8 text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-indigo-600 transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Return to List
                    </button>
                    <div className="px-2 md:px-8 py-4">
                        <div className="mb-10 text-left">
                            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 uppercase tracking-tighter leading-[1.1]">
                                {view === 'create' ? 'Post New Opportunity' : 'Update Listing'}
                            </h2>
                            <p className="text-sm font-bold text-slate-400 mt-3 uppercase tracking-wider">Official Government Job Publishing Portal</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8 text-left">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                                <div className="space-y-6">
                                    <h3 className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
                                        <Landmark className="w-4 h-4" /> Basic Information
                                    </h3>
                                    <div className="relative">
                                        <label className={labelClass}>Job Type</label>
                                        <Landmark className={iconClass} />
                                        <select required className={inputClass} value={formData.govt_type} onChange={(e) => setFormData({ ...formData, govt_type: e.target.value })}>
                                            <option>Central Government</option>
                                            <option>State Government</option>
                                            <option>Public Sector Unit (PSU)</option>
                                        </select>
                                    </div>
                                    <div className="relative">
                                        <label className={labelClass}>Designation / Title</label>
                                        <Award className={iconClass} />
                                        <input required className={inputClass} placeholder="e.g. Probationary Officer" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                                    </div>
                                    <div className="relative">
                                        <label className={labelClass}>Organization / Department</label>
                                        <Building2 className={iconClass} />
                                        <input required className={inputClass} placeholder="e.g. Ministry of Finance" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
                                    </div>
                                    <div className="relative">
                                        <label className={labelClass}>Govt Sector</label>
                                        <Plus className={iconClass} />
                                        <select className={inputClass} value={formData.sector} onChange={(e) => setFormData({ ...formData, sector: e.target.value })}>
                                            <option>Banking</option>
                                            <option>Defence</option>
                                            <option>Railways</option>
                                            <option>Police</option>
                                            <option>Healthcare</option>
                                            <option>Education</option>
                                            <option>Administrative</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div className="relative">
                                        <label className={labelClass}>Official Apply Link (Redirect)</label>
                                        <Globe className={iconClass} />
                                        <input className={inputClass} placeholder="https://example.gov.in/apply" value={formData.redirect_link} onChange={(e) => setFormData({ ...formData, redirect_link: e.target.value })} />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
                                        <User className="w-4 h-4" /> Eligibility & Vacancy
                                    </h3>
                                    <div className="relative">
                                        <label className={labelClass}>Total Vacancies</label>
                                        <User className={iconClass} />
                                        <input required type="number" className={inputClass} placeholder="e.g. 500" value={formData.vacancy} onChange={(e) => setFormData({ ...formData, vacancy: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative">
                                            <label className={labelClass}>Min Age</label>
                                            <Clock className={iconClass} />
                                            <input type="number" className={inputClass} placeholder="18" value={formData.min_age} onChange={(e) => setFormData({ ...formData, min_age: e.target.value })} />
                                        </div>
                                        <div className="relative">
                                            <label className={labelClass}>Max Age</label>
                                            <Clock className={iconClass} />
                                            <input type="number" className={inputClass} placeholder="35" value={formData.max_age} onChange={(e) => setFormData({ ...formData, max_age: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <label className={labelClass}>Age Relaxation</label>
                                        <Plus className={iconClass} />
                                        <input className={inputClass} placeholder="As per govt norms" value={formData.age_relaxation} onChange={(e) => setFormData({ ...formData, age_relaxation: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 border-t border-slate-50 pt-8">
                                <h3 className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Application Timeline
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="relative">
                                        <label className={labelClass}>Start Date</label>
                                        <Calendar className={iconClass} />
                                        <input type="date" className={inputClass} value={formData.application_start_date} onChange={(e) => setFormData({ ...formData, application_start_date: e.target.value })} />
                                    </div>
                                    <div className="relative">
                                        <label className={labelClass}>Last Date to Apply</label>
                                        <Calendar className={iconClass} />
                                        <input required type="date" className={inputClass} value={formData.last_date} onChange={(e) => setFormData({ ...formData, last_date: e.target.value })} />
                                    </div>
                                    <div className="relative">
                                        <label className={labelClass}>Exam Fee</label>
                                        <IndianRupee className={iconClass} />
                                        <input className={inputClass} placeholder="₹ 100 for Gen" value={formData.exam_fee} onChange={(e) => setFormData({ ...formData, exam_fee: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 border-t border-slate-50 pt-8">
                                <h3 className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Process & Description
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">TN District *</label>
                                        <select
                                            required
                                            className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-700 bg-slate-50"
                                            value={formData.district}
                                            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                        >
                                            <option value="">Select District</option>
                                            {TN_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Job Title (Designation) *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Probationary Officer"
                                            className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-700 bg-slate-50"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="relative">
                                    <label className={labelClass}>Selection Process</label>
                                    <FileText className={iconClass} />
                                    <input className={inputClass} placeholder="e.g. Written Exam + Interview" value={formData.selection_process} onChange={(e) => setFormData({ ...formData, selection_process: e.target.value })} />
                                </div>
                                <div className="relative">
                                    <label className={labelClass}>Detailed Job Description</label>
                                    <textarea required className="w-full px-6 py-4 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 outline-none text-slate-900 transition-all font-bold text-sm min-h-[200px]"
                                        placeholder="Outline eligibility, perks, and application steps..."
                                        value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-6 border-t border-slate-50 pt-8">
                                <h3 className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Visibility Control
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="relative">
                                        <label className={labelClass}>Auto-Archive Date</label>
                                        <Calendar className={iconClass} />
                                        <input type="date" className={inputClass} value={formData.expiry_date} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} />
                                    </div>
                                    <div className="relative">
                                        <label className={labelClass}>Archive Time</label>
                                        <Clock className={iconClass} />
                                        <input type="time" className={inputClass} value={formData.expiry_time} onChange={(e) => setFormData({ ...formData, expiry_time: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <button
                                disabled={isSubmitting}
                                className="w-full bg-slate-900 text-white hover:bg-indigo-600 py-6 rounded-[2rem] font-bold text-sm uppercase tracking-wider transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 italic"
                            >
                                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                                {view === 'create' ? 'Publish Official Posting' : 'Synchronize Listing Updates'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const DetailBox = ({ icon: Icon, label, value, color = "text-slate-500", isLink = false }) => {
    const isActuallyLink = isLink && value && value !== 'N/A';
    const Container = isActuallyLink ? 'a' : 'div';

    return (
        <Container
            {...(isActuallyLink ? {
                href: value.startsWith('http') ? value : `https://${value}`,
                target: "_blank",
                rel: "noopener noreferrer"
            } : {})}
            className={`bg-slate-50/50 p-6 rounded-3xl border border-slate-100/50 transition-all group h-full flex flex-col ${isActuallyLink
                ? 'hover:bg-white hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer'
                : 'hover:bg-white hover:shadow-lg'
                }`}
        >
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{label}</p>
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 group-hover:bg-indigo-50 transition-all shrink-0">
                    <Icon className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="min-w-0 flex-1">
                    <span className={`text-sm font-bold uppercase tracking-tight break-all block ${isActuallyLink ? 'text-indigo-600 group-hover:text-indigo-800' : color
                        }`}>
                        {value || 'N/A'}
                    </span>
                </div>
            </div>
            {isActuallyLink && (
                <div className="mt-3 flex items-center gap-1.5 text-[9px] font-bold text-indigo-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-3 h-3" /> Visit Official Site
                </div>
            )}
        </Container>
    );
};

export default ManageGovtJobs;
