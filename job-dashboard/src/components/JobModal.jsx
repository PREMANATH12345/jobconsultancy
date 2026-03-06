
import React, { useState, useEffect } from 'react';
import { X, Save, Briefcase, MapPin, IndianRupee, FileText, AlertTriangle, Landmark, Calendar, User, Building2, Layout, Award, Clock, Map, Eye, GraduationCap, Globe } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { TN_DISTRICTS } from '../constants/districts';

const JobModal = ({ isOpen, onClose, job, mode = 'edit', onSave }) => {
    if (!isOpen) return null;

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Private',
        job_role_category: 'Administrative',
        district: '',

        // Govt
        govt_type: 'State',
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

        // Private
        company_name: '',
        company_logo: '',
        location: '',
        salary_range: '',
        job_type: 'Full Time',
        skills: '',
        experience: '',
        qualification: '',
        shift: '',
        work_mode: '',
        company_type: '',
        company_employees: '',
        company_turnover: '',
        application_deadline: '',

        // Expiry (Website Cleanup)
        expiry_date: '',
        expiry_time: '23:59',

        rejection_reason: '',
        language: '',
        company_industry: '',
        shortlisted_count: '',
        posted_date: ''
    });

    useEffect(() => {
        if (job) {
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
                title: job.title || '',
                description: job.description || '',
                category: job.category || 'Private',
                job_role_category: job.job_role_category || 'Administrative',
                district: job.district || '',
                govt_type: job.govt_type || 'State',
                department: job.department || '',
                sector: job.sector || 'Banking',
                vacancy: job.vacancy || '',
                application_mode: job.application_mode || 'Online',
                exam_fee: job.exam_fee || '',
                last_date: job.last_date || '',
                post_name: job.post_name || '',
                application_start_date: job.application_start_date || '',
                min_age: job.min_age || '',
                max_age: job.max_age || '',
                age_relaxation: job.age_relaxation || '',
                selection_process: job.selection_process || '',

                company_name: job.company_name || '',
                company_logo: job.company_logo || '',
                location: job.location || '',
                salary_range: job.salary_range || '',
                job_type: job.job_type || 'Full Time',
                skills: job.skills || '',
                experience: job.experience || '',
                qualification: job.qualification || '',
                shift: job.shift || '',
                work_mode: job.work_mode || '',
                company_type: job.company_type || '',
                company_employees: job.company_employees || '',
                company_turnover: job.company_turnover || '',
                application_deadline: job.application_deadline || '',

                language: job.language || '',
                company_industry: job.company_industry || '',
                shortlisted_count: job.shortlisted_count || '',
                posted_date: job.posted_date || '',

                expiry_date: exDate,
                expiry_time: exTime,

                rejection_reason: job.rejection_reason || ''
            });
        }
    }, [job]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        let job_expiry = null;
        if (formData.expiry_date && formData.expiry_time) {
            job_expiry = `${formData.expiry_date} ${formData.expiry_time}:00`;
        }

        const payload = { ...formData, job_expiry };
        delete payload.expiry_date;
        delete payload.expiry_time;
        delete payload.end_time;

        await onSave(payload);
        setLoading(false);
        onClose();
    };

    const inputClass = "w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none font-bold text-sm text-slate-700 transition-all";
    const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1 block text-left";
    const iconClass = "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none";

    // Rejection Mode
    if (mode === 'reject') {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
                <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 md:p-10 shadow-2xl relative z-[101] animate-in zoom-in duration-300">
                    <div className="flex justify-between items-center mb-8">
                        <div className="text-left">
                            <h3 className="text-xl md:text-2xl font-black text-rose-500 uppercase tracking-tighter flex items-center gap-3">
                                <AlertTriangle className="w-6 h-6" /> Decline Listing
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Provide critical feedback</p>
                        </div>
                        <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl transition-all border border-slate-100"><X className="w-6 h-6 text-slate-300" /></button>
                    </div>

                    <p className="text-xs md:text-sm font-bold text-slate-500 mb-6 text-left leading-relaxed">Please articulate the reason for rejection. This feedback helps the employer align with platform standards.</p>

                    <textarea
                        className="w-full h-40 p-6 rounded-3xl border border-rose-100 focus:border-rose-500 focus:ring-4 focus:ring-rose-50 outline-none text-slate-900 font-bold text-sm resize-none bg-rose-50/30 transition-all"
                        placeholder="Detail the specific policy violation or missing info..."
                        value={formData.rejection_reason}
                        onChange={(e) => setFormData({ ...formData, rejection_reason: e.target.value })}
                        autoFocus
                    />

                    <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
                        <button onClick={onClose} className="w-full sm:w-auto px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Abort</button>
                        <button
                            onClick={async () => {
                                setLoading(true);
                                await onSave({ status: 'rejected', rejection_reason: formData.rejection_reason });
                                setLoading(false);
                                onClose();
                            }}
                            disabled={!formData.rejection_reason || loading}
                            className="w-full sm:w-auto bg-rose-500 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 shadow-xl shadow-rose-500/20 disabled:opacity-50 flex items-center justify-center gap-3 transition-all active:scale-95"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Commit Rejection
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // View mode
    if (mode === 'view') {
        return (
            <div className="fixed inset-0 z-[100] overflow-y-auto overflow-x-hidden">
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
                <div className="flex min-h-full items-center justify-center p-4 md:p-10 relative pointer-events-none">
                    <div className="bg-white rounded-[2rem] md:rounded-[4rem] w-full max-w-4xl p-6 md:p-12 shadow-2xl relative z-[101] animate-in zoom-in duration-300 pointer-events-auto overflow-hidden">
                        <div className="h-2 md:h-4 w-full bg-emerald-500 absolute top-0 left-0" />
                        <div className="flex justify-between items-start md:items-center mb-8 md:mb-12 mt-4 gap-4">
                            <div className="text-left flex items-start md:items-center gap-3 md:gap-5">
                                <div className="w-10 h-10 md:w-16 md:h-16 bg-slate-900 rounded-xl md:rounded-3xl flex items-center justify-center text-emerald-400 shadow-xl shrink-0">
                                    <Eye className="w-5 h-5 md:w-8 md:h-8" />
                                </div>
                                <div className="pt-1 md:pt-0">
                                    <h2 className="text-xl md:text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">Job Blueprint</h2>
                                    <p className="text-[9px] md:text-xs font-black text-slate-400 mt-1.5 md:mt-2 uppercase tracking-[0.2em]">Inspection Console</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-3 md:p-5 hover:bg-slate-50 rounded-xl md:rounded-[2rem] transition-all border border-slate-100 shadow-sm active:scale-90 flex items-center justify-center shrink-0">
                                <X className="w-5 h-5 md:w-8 md:h-8 text-slate-300" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 text-left">
                            <ReadOnlyField label="Position" value={formData.title} icon={Briefcase} />
                            <ReadOnlyField label="Category" value={formData.category} icon={Layout} />
                            <ReadOnlyField label="Role Type" value={formData.job_role_category} icon={Award} />
                            <ReadOnlyField label="District" value={formData.district} icon={Map} />

                            {formData.category === 'Government' ? (
                                <>
                                    <ReadOnlyField label="Agency Type" value={formData.govt_type} icon={Landmark} />
                                    <ReadOnlyField label="Department" value={formData.department} icon={Building2} />
                                    <ReadOnlyField label="Total Vacancy" value={formData.vacancy} icon={User} />
                                    <ReadOnlyField label="Channel" value={formData.application_mode} icon={Globe} />
                                    <ReadOnlyField label="Deadline" value={formData.last_date} icon={Calendar} />
                                    <ReadOnlyField label="Selection" value={formData.selection_process} icon={FileText} />
                                    <ReadOnlyField label="Min Age" value={formData.min_age} icon={Clock} />
                                    <ReadOnlyField label="Max Age" value={formData.max_age} icon={Clock} />
                                    <ReadOnlyField label="Fee Structure" value={formData.exam_fee} icon={IndianRupee} />
                                </>
                            ) : (
                                <>
                                    <ReadOnlyField label="Organization" value={formData.company_name} icon={Building2} />
                                    <ReadOnlyField label="Base Location" value={formData.location} icon={MapPin} />
                                    <ReadOnlyField label="Compensation" value={formData.salary_range} icon={IndianRupee} />
                                    <ReadOnlyField label="Duration" value={formData.job_type} icon={Clock} />
                                    <ReadOnlyField label="Environment" value={formData.work_mode} icon={Layout} />
                                    <ReadOnlyField label="Experience" value={formData.experience} icon={Award} />
                                    <ReadOnlyField label="Education" value={formData.qualification} icon={GraduationCap} />
                                    <ReadOnlyField label="Industry" value={formData.company_industry} icon={Building2} />
                                    <ReadOnlyField label="Application Deadline" value={formData.application_deadline} icon={Calendar} />
                                    <div className="sm:col-span-2 lg:col-span-3">
                                        <ReadOnlyField label="Required Skillset" value={formData.skills} icon={Award} />
                                    </div>
                                </>
                            )}

                            <div className="sm:col-span-2 lg:col-span-3 mt-4">
                                <label className={labelClass}>Mission parameters & Description</label>
                                <div className="bg-slate-50 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 text-sm font-bold text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    {formData.description || 'No detailed blueprint provided.'}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 md:mt-10 pt-8 md:pt-10 border-t border-slate-50 flex justify-end">
                            <button onClick={onClose} className="w-full md:w-auto bg-slate-900 text-white px-10 md:px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl active:scale-95">Dismiss Blueprint</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Edit/Post Mode
    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto overflow-x-hidden">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
            <div className="flex min-h-full items-center justify-center p-4 md:p-10 relative pointer-events-none">
                <div className="bg-white rounded-[2rem] md:rounded-[4rem] w-full max-w-4xl p-6 md:p-12 shadow-2xl relative z-[101] animate-in zoom-in duration-300 pointer-events-auto">
                    <div className="flex justify-between items-start md:items-center mb-8 md:mb-12 gap-4">
                        <div className="text-left flex items-start md:items-center gap-3 md:gap-5">
                            <div className="w-10 h-10 md:w-16 md:h-16 bg-slate-900 rounded-xl md:rounded-3xl flex items-center justify-center text-emerald-400 shadow-xl shrink-0">
                                <Briefcase className="w-5 h-5 md:w-8 md:h-8" />
                            </div>
                            <div className="pt-1 md:pt-0">
                                <h2 className="text-xl md:text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">Update Listing</h2>
                                <p className="text-[9px] md:text-xs font-black text-slate-400 mt-1.5 md:mt-2 uppercase tracking-[0.2em]">Adjustment Console</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 md:p-5 hover:bg-slate-50 rounded-xl md:rounded-[2rem] transition-all border border-slate-100 shadow-sm active:scale-90 flex items-center justify-center shrink-0">
                            <X className="w-5 h-5 md:w-8 md:h-8 text-slate-300" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8 md:space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                            {formData.category === 'Government' ? (
                                <>
                                    <div className="text-left">
                                        <label className={labelClass}>TN District</label>
                                        <div className="relative">
                                            <Map className={iconClass} />
                                            <select required className={inputClass} value={formData.district} onChange={e => setFormData({ ...formData, district: e.target.value })}>
                                                <option value="">Select District</option>
                                                {TN_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <label className={labelClass}>Jurisdiction Type</label>
                                        <div className="relative">
                                            <Landmark className={iconClass} />
                                            <select className={inputClass} value={formData.govt_type} onChange={e => setFormData({ ...formData, govt_type: e.target.value })}>
                                                <option>State Government</option>
                                                <option>Central Government</option>
                                                <option>Public Sector Unit (PSU)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <label className={labelClass}>Job Designation</label>
                                        <div className="relative">
                                            <Award className={iconClass} />
                                            <input required className={inputClass} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Senior Officer" />
                                        </div>
                                    </div>
                                    <div className="md:col-span-1 text-left">
                                        <label className={labelClass}>Governing Organization</label>
                                        <div className="relative">
                                            <Building2 className={iconClass} />
                                            <input required className={inputClass} value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} placeholder="e.g. Dept of Finance" />
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <label className={labelClass}>Total Vacancies</label>
                                        <div className="relative">
                                            <User className={iconClass} />
                                            <input type="number" className={inputClass} value={formData.vacancy} onChange={e => setFormData({ ...formData, vacancy: e.target.value })} placeholder="0" />
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <label className={labelClass}>Channel of Application</label>
                                        <div className="relative">
                                            <Layout className={iconClass} />
                                            <select className={inputClass} value={formData.application_mode} onChange={e => setFormData({ ...formData, application_mode: e.target.value })}>
                                                <option>Online</option>
                                                <option>Offline</option>
                                                <option>Both</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <label className={labelClass}>Selection Methodology</label>
                                        <div className="relative">
                                            <FileText className={iconClass} />
                                            <input className={inputClass} value={formData.selection_process} onChange={e => setFormData({ ...formData, selection_process: e.target.value })} placeholder="e.g. CBT + Interview" />
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <label className={labelClass}>Application Deadline</label>
                                        <div className="relative">
                                            <Calendar className={iconClass} />
                                            <input type="date" className={inputClass} value={formData.last_date} onChange={e => setFormData({ ...formData, last_date: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <label className={labelClass}>Retract Listing On (Date)</label>
                                        <div className="relative">
                                            <Calendar className={iconClass} />
                                            <input type="date" className={inputClass} value={formData.expiry_date || ''} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <label className={labelClass}>Retract At (Time)</label>
                                        <div className="relative">
                                            <Clock className={iconClass} />
                                            <input type="time" className={inputClass} value={formData.expiry_time || ''} onChange={e => setFormData({ ...formData, expiry_time: e.target.value })} />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="md:col-span-2 text-left">
                                        <label className={labelClass}>Professional Job Title</label>
                                        <div className="relative">
                                            <FileText className={iconClass} />
                                            <input required className={inputClass} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Senior Architect" />
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <label className={labelClass}>Company Legal Name</label>
                                        <div className="relative">
                                            <Building2 className={iconClass} />
                                            <input className={inputClass} value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} placeholder="e.g. Acme Tech" />
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <label className={labelClass}>TN District</label>
                                        <div className="relative">
                                            <Map className={iconClass} />
                                            <select required className={inputClass} value={formData.district} onChange={e => setFormData({ ...formData, district: e.target.value })}>
                                                <option value="">Select District</option>
                                                {TN_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <label className={labelClass}>Location (Local Area)</label>
                                        <div className="relative">
                                            <MapPin className={iconClass} />
                                            <input className={inputClass} value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. T. Nagar" />
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <label className={labelClass}>Salary Bracket</label>
                                        <div className="relative">
                                            <IndianRupee className={iconClass} />
                                            <input className={inputClass} value={formData.salary_range} onChange={e => setFormData({ ...formData, salary_range: e.target.value })} placeholder="e.g. 15L - 25L PA" />
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <label className={labelClass}>Employment Duration</label>
                                        <div className="relative">
                                            <Briefcase className={iconClass} />
                                            <select className={inputClass} value={formData.job_type} onChange={e => setFormData({ ...formData, job_type: e.target.value })}>
                                                <option>Full Time</option>
                                                <option>Part Time</option>
                                                <option>Internship</option>
                                                <option>Remote</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <label className={labelClass}>Operating Environment</label>
                                        <div className="relative">
                                            <Briefcase className={iconClass} />
                                            <select className={inputClass} value={formData.work_mode} onChange={e => setFormData({ ...formData, work_mode: e.target.value })}>
                                                <option>Work from Office</option>
                                                <option>Remote</option>
                                                <option>Hybrid</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <label className={labelClass}>Experience Requirements</label>
                                        <div className="relative">
                                            <Award className={iconClass} />
                                            <input className={inputClass} value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })} placeholder="e.g. 5+ Years" />
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <label className={labelClass}>Academic Qualification</label>
                                        <div className="relative">
                                            <Award className={iconClass} />
                                            <input className={inputClass} value={formData.qualification} onChange={e => setFormData({ ...formData, qualification: e.target.value })} placeholder="e.g. Graduation" />
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <label className={labelClass}>Retract Listing On (Date)</label>
                                        <div className="relative">
                                            <Calendar className={iconClass} />
                                            <input type="date" className={inputClass} value={formData.expiry_date || ''} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <label className={labelClass}>Retract At (Time)</label>
                                        <div className="relative">
                                            <Clock className={iconClass} />
                                            <input type="time" className={inputClass} value={formData.expiry_time || ''} onChange={e => setFormData({ ...formData, expiry_time: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 text-left">
                                        <label className={labelClass}>In-Depth Description</label>
                                        <textarea required className="w-full p-6 rounded-3xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none font-bold text-sm text-slate-700 h-48 md:h-64 resize-none transition-all"
                                            value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Outline the primary responsibilities..." />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="pt-8 md:pt-12 border-t border-slate-50 flex flex-col sm:flex-row items-center gap-6">
                            <button className="w-full sm:w-auto bg-slate-900 text-white px-12 md:px-16 py-5 rounded-2xl md:rounded-[2rem] font-black text-xs md:text-sm uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-2xl flex justify-center items-center gap-4 group active:scale-95 transform">
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6 group-hover:rotate-12 transition-transform" />}
                                Commit Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const ReadOnlyField = ({ label, value, icon: Icon }) => (
    <div className="bg-slate-50/50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100/50">
        <label className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-1.5 block ml-1">{label}</label>
        <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-white rounded-lg md:rounded-xl shadow-sm">
                <Icon className="w-3 md:w-3.5 h-3 md:h-3.5 text-emerald-500" />
            </div>
            <span className="text-[10px] md:text-xs font-black text-slate-700 uppercase tracking-tight truncate">{value || 'N/A'}</span>
        </div>
    </div>
);

export default JobModal;
