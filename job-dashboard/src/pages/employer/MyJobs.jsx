import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, IndianRupee, Clock, CheckCircle2, XCircle, Trash2, Loader2, Edit3, AlertTriangle, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { allService } from '../../services/api';
import JobModal from '../../components/JobModal';

const MyJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(sessionStorage.getItem('user')) || {};

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);

    useEffect(() => {
        fetchMyJobs();
    }, []);

    const fetchMyJobs = async () => {
        try {
            const data = await allService.getData('jobs', { employer_id: user.id });
            setJobs(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error("Failed to load your jobs");
        } finally {
            setLoading(false);
        }
    };

    const deleteJob = async (id) => {
        if (!window.confirm("Are you sure you want to delete this job listing?")) return;
        try {
            await allService.deleteData('jobs', { id });
            toast.success("Job deleted");
            fetchMyJobs();
        } catch (error) {
            toast.error("Delete failed");
        }
    };

    const handleEditClick = (job) => {
        setSelectedJob(job);
        setModalOpen(true);
    };

    const handleSaveJob = async (formData) => {
        try {
            const cleanedData = {};
            const commonFields = ['title', 'description', 'category', 'job_role_category', 'job_expiry'];
            const govtFields = ['govt_type', 'department', 'sector', 'vacancy', 'application_mode', 'exam_fee', 'last_date', 'post_name', 'application_start_date', 'min_age', 'max_age', 'age_relaxation', 'selection_process'];
            const privateFields = ['company_name', 'company_logo', 'location', 'salary_range', 'job_type', 'skills', 'experience', 'qualification', 'shift', 'work_mode', 'company_type', 'company_employees', 'company_turnover', 'application_deadline', 'posted_date', 'shortlisted_count', 'language', 'company_industry'];

            const relevantFields = formData.category === 'Government'
                ? [...commonFields, ...govtFields]
                : [...commonFields, ...privateFields];

            relevantFields.forEach(field => {
                if (formData[field] !== undefined) {
                    if (formData[field] === '0000-00-00' || formData[field] === '') {
                        cleanedData[field] = null;
                    } else {
                        cleanedData[field] = formData[field];
                    }
                }
            });

            cleanedData.status = 'pending';

            await allService.updateData('jobs', { id: selectedJob.id }, cleanedData);
            toast.success("Job updated and sent for re-approval");
            fetchMyJobs();
        } catch (error) {
            toast.error("Failed to update job: " + error.message);
        }
    };

    return (
        <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-8 md:space-y-12">
            <div className="text-left border-b border-slate-100 pb-8 md:pb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-tight italic">My Job Listings</h1>
                    <p className="text-sm font-bold text-slate-400 mt-2 lowercase">Monitor the approval status of your requested job posts.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {loading ? (
                    <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center py-20 px-4">
                        <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mb-4" />
                        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Scanning registry...</p>
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="col-span-1 md:col-span-2 text-center py-20 md:py-32 bg-white rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-slate-100 shadow-sm transition-all animate-in fade-in zoom-in duration-500">
                        <Briefcase className="w-16 h-16 md:w-24 md:h-24 text-slate-100 mx-auto mb-6 md:mb-8" />
                        <p className="text-slate-900 font-black uppercase tracking-widest text-lg md:text-xl">Inventory empty</p>
                        <p className="text-slate-400 font-bold mt-2 lowercase">You haven't initiated any job listings yet. Start by posting a new one.</p>
                    </div>
                ) : (
                    jobs.map((job) => (
                        <div key={job.id} className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl border border-slate-100 relative group overflow-hidden hover:border-emerald-500/30 transition-all flex flex-col text-left h-full">
                            <div className="flex flex-wrap justify-between items-center mb-6 md:mb-8 gap-3">
                                <span className={`px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm ${job.status === 'approved' ? 'bg-emerald-500 text-white' :
                                    job.status === 'rejected' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
                                    }`}>
                                    {job.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
                                    {job.status || 'pending'}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditClick(job)}
                                        className="p-3 bg-slate-50 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all rounded-xl md:rounded-2xl border border-slate-100 shadow-sm active:scale-90"
                                        title="Edit Job"
                                    >
                                        <Edit3 className="w-5 h-5 md:w-6 md:h-6" />
                                    </button>
                                    <button
                                        onClick={() => deleteJob(job.id)}
                                        className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all rounded-xl md:rounded-2xl border border-slate-100 shadow-sm active:scale-90"
                                        title="Delete Job"
                                    >
                                        <Trash2 className="w-5 h-5 md:w-6 md:h-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1">
                                <h3 className="text-xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4 md:mb-6 leading-tight italic line-clamp-2">{job.title}</h3>
                                <div className="flex flex-wrap items-center gap-4 md:gap-8 mb-6 md:mb-8">
                                    <span className="flex items-center gap-2 text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                        <MapPin className="w-3.5 h-3.5 text-emerald-500" /> {job.location || job.sector || 'Remote'}
                                    </span>
                                    <span className="flex items-center gap-2 text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                        <IndianRupee className="w-3.5 h-3.5 text-emerald-500" /> {job.salary_range || 'Not Disclosed'}
                                    </span>
                                </div>

                                {job.status === 'rejected' && job.rejection_reason && (
                                    <div className="mb-6 md:mb-8 bg-rose-50 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-rose-100 group-hover:bg-rose-100/50 transition-colors">
                                        <h4 className="flex items-center gap-2 text-[10px] md:text-[11px] font-black text-rose-500 uppercase tracking-widest mb-2">
                                            <AlertTriangle className="w-4 h-4" /> Reason for Rejection
                                        </h4>
                                        <p className="text-xs md:text-sm font-bold text-slate-600 italic">"{job.rejection_reason}"</p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-slate-50 p-5 rounded-[1.5rem] md:rounded-[2rem] text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border border-slate-100 mt-auto">
                                {job.job_type || 'Contract'} • Initiative date {new Date(job.created_at).toLocaleDateString()}
                            </div>

                            {/* Status indicator bar at the bottom */}
                            <div className={`absolute bottom-0 left-0 w-full h-2 md:h-3 ${job.status === 'approved' ? 'bg-emerald-500 shadow-[0_-2px_15px_rgba(16,185,129,0.3)]' :
                                job.status === 'rejected' ? 'bg-rose-500 shadow-[0_-2px_15px_rgba(244,63,94,0.3)]' : 'bg-amber-500 shadow-[0_-2px_15px_rgba(245,158,11,0.3)]'
                                }`} />
                        </div>
                    ))
                )}
            </div>

            <JobModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                job={selectedJob}
                onSave={handleSaveJob}
            />
        </div>
    );
};

export default MyJobs;
