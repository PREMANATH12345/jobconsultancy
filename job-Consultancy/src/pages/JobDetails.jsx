
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, IndianRupee, Landmark, Calendar, User, ArrowLeft, Building2, Layout, Award, Settings, CheckCircle, Globe, Users, Clock, Loader2, Upload, ExternalLink, BookOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { allService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { formatIndianNumber } from '../utils/helpers';

const JobDetails = () => {
    const { t, language: currentLang } = useLanguage();
    const { slug } = useParams();
    // Support both direct ID and slugified name-name-ID formats
    const id = isNaN(slug) ? slug.split('-').pop() : slug;

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    const [userApplication, setUserApplication] = useState(null);
    const [checkingApp, setCheckingApp] = useState(false);

    useEffect(() => {
        fetchJobDetails();
        checkApplicationStatus();
    }, [id, user?.id]);

    const checkApplicationStatus = async () => {
        if (!user || user.role !== 'employee') return;
        setCheckingApp(true);
        try {
            const apps = await allService.getData('job_applications', {
                job_id: parseInt(id),
                user_id: parseInt(user.id)
            });
            if (apps && apps.length > 0) {
                setUserApplication(apps[0]); // store the application including its status
            }
        } catch (error) {
            console.error("Error checking app status:", error);
        } finally {
            setCheckingApp(false);
        }
    };

    const fetchJobDetails = async () => {
        try {
            const data = await allService.getData('jobs', { id });
            setJob(Array.isArray(data) ? data[0] : data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const [showProfilePrompt, setShowProfilePrompt] = useState(false);
    const [profileMode, setProfileMode] = useState('new'); // 'new', 'edit', 'confirm'
    const [resumeFile, setResumeFile] = useState(null);

    const [formDetails, setFormDetails] = useState({
        dob: '', gender: 'Male', education: '',
        address: { dNo: '', streetName: '', anjal: '', city: '', district: '' },
        experience: { type: 'Fresher', designation: '', years: 'Nil', lastSalary: '' },
        expectations: { job: '', expectedSalary: '', workPlace: 'Tamil Nadu', workTime: '8 Hours' }
    });

    const handleApply = async () => {
        if (!user) {
            toast.error("Please login to apply for this job");
            navigate('/login');
            return;
        }

        if (user.role !== 'employee') {
            toast.error("Only employees can apply for jobs");
            return;
        }

        // Handle External Redirect for Govt Jobs
        if (job.category === 'Government' && job.redirect_link) {
            window.open(job.redirect_link, '_blank', 'noopener,noreferrer');
            return;
        }

        // Fetch latest user data to check profile
        try {
            const userData = await allService.getData('users', { id: user.id });
            const currentUser = Array.isArray(userData) ? userData[0] : userData;

            if (!currentUser) {
                toast.error("User profile not found. Please try logging in again.");
                return;
            }

            let details = {};
            try {
                if (currentUser.user_details) {
                    details = typeof currentUser.user_details === 'string'
                        ? JSON.parse(currentUser.user_details)
                        : currentUser.user_details;
                }
            } catch (e) { console.error(e); }

            if (!currentUser.user_details || Object.keys(details).length === 0) {
                setProfileMode('new');
                setShowProfilePrompt(true);
            } else {
                setFormDetails(details);
                setProfileMode('confirm');
                setShowProfilePrompt(true);
            }
        } catch (error) {
            toast.error("Failed to verify profile status");
        }
    };

    const submitFullApplication = async (e) => {
        if (e) e.preventDefault();

        setApplying(true);
        try {
            let resumeUrl = null;
            if (resumeFile) {
                const uploadRes = await allService.uploadFile(resumeFile, {
                    subdirectory: `applications/${user.userId || user.user_id}`,
                    custom_name: `resume_${Date.now()}`
                });
                
                const fullUrl = uploadRes.public_url || uploadRes.url;
                if (fullUrl && fullUrl.indexOf('/uploads/') !== -1) {
                    resumeUrl = fullUrl.substring(fullUrl.indexOf('/uploads/'));
                } else {
                    resumeUrl = fullUrl;
                }
            }

            // 1. Update Profile in users table if needed
            if (profileMode === 'new' || profileMode === 'edit') {
                await allService.updateData('users', { id: user.id }, {
                    user_details: JSON.stringify(formDetails)
                });
            }

            // 2. Check if already applied
            const existingApps = await allService.getData('job_applications', {
                job_id: parseInt(id),
                user_id: parseInt(user.id)
            });

            if (existingApps && existingApps.length > 0) {
                toast.error("You have already applied for this job!");
                setApplying(false);
                return;
            }

            // 3. Submit Application
            await allService.insertData('job_applications', {
                job_id: parseInt(id),
                user_id: parseInt(user.id),
                resume: resumeUrl || (formDetails.documents?.resume), // Use uploaded or existing
                status: 'applied'
            });

            toast.success("Application submitted successfully!", { icon: '🎉' });
            setShowProfilePrompt(false);

        } catch (error) {
            console.error("Apply Error:", error);
            toast.error("Application failed. Please try again.");
        } finally {
            setApplying(false);
        }
    };

    const handleFormChange = (e, section = null) => {
        const { name, value } = e.target;
        if (section) {
            setFormDetails(prev => ({
                ...prev,
                [section]: { ...prev[section], [name]: value }
            }));
        } else {
            setFormDetails(prev => ({ ...prev, [name]: value }));
        }
    };

    const getFullUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const baseUrl = 'https://apiphp.dsofthub.com/jobconsultancy/';
        const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
        return `${baseUrl}${cleanUrl}`;
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
    if (!job) return <div className="h-screen flex items-center justify-center"><h1 className="text-3xl font-black text-secondary uppercase">Job Not Found</h1></div>;

    const isGovernment = job.category === 'Government' || job.category === 'Govt';

    const inputClass = "w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary outline-none text-slate-900 text-xs font-bold transition-all";
    const labelClass = "text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1.5 block";

    return (
        <div className="pt-40 pb-20 px-4 min-h-screen bg-white">
            {/* Profile Completion Modal */}
            {showProfilePrompt && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-2xl md:max-w-3xl rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl animate-in zoom-in duration-300 my-4 md:my-8">
                        <div className="flex justify-between items-start mb-6 md:mb-8">
                            <div>
                                <h2 className="text-lg md:text-2xl font-extrabold text-slate-900 tracking-tight">
                                    {profileMode === 'confirm' ? t('confirmDetails') : t('completeProfile')}
                                </h2>
                                <p className="text-[9px] md:text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                                    {profileMode === 'confirm' ? t('reviewInfo') : t('tellUsMore')}
                                </p>
                            </div>
                            <button onClick={() => setShowProfilePrompt(false)} className="p-4 hover:bg-slate-50 rounded-2xl transition-all">
                                <ArrowLeft className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        {profileMode === 'confirm' ? (
                            <div className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                                    <div className="p-4 md:p-6 bg-slate-50 rounded-2xl md:rounded-[1.5rem] border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('education')}</p>
                                        <p className="font-bold text-slate-900 text-sm">{formDetails.education}</p>
                                    </div>
                                    <div className="p-4 md:p-6 bg-slate-50 rounded-2xl md:rounded-[1.5rem] border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('experience')}</p>
                                        <p className="font-bold text-slate-900 text-sm">{formDetails.experience?.type === 'Fresher' ? t('fresher') : t('experienced')} - {formDetails.experience?.designation}</p>
                                    </div>
                                    <div className="p-4 md:p-6 bg-slate-50 rounded-2xl md:rounded-[1.5rem] border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('location')}</p>
                                        <p className="font-bold text-slate-900 text-sm">{formDetails.address?.city}, {t(`districtsList.${formDetails.address?.district}`) !== `districtsList.${formDetails.address?.district}` ? t(`districtsList.${formDetails.address?.district}`) : formDetails.address?.district}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className={labelClass}>{t('uploadResume') || 'Resume'}</label>
                                    
                                    {formDetails.documents?.resume && !resumeFile ? (
                                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col md:flex-row items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100">
                                                    <BookOpen className="w-5 h-5" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Existing Resume Found</p>
                                                    <p className="text-xs font-bold text-slate-700">Will be sent with application</p>
                                                </div>
                                            </div>
                                            <a href={getFullUrl(formDetails.documents.resume)} target="_blank" rel="noreferrer" className="text-[10px] md:text-xs font-black bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2">
                                                Preview <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        </div>
                                    ) : !formDetails.documents?.resume && !resumeFile ? (
                                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm border border-amber-100">
                                                <BookOpen className="w-5 h-5 opacity-50" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none mb-1">No Resume Provided</p>
                                                <p className="text-xs font-bold text-slate-700">You can apply without one, or upload below.</p>
                                            </div>
                                        </div>
                                    ) : null}

                                    <div className="border-2 border-dashed border-primary/10 rounded-2xl md:rounded-[2rem] p-6 text-center bg-primary/5 hover:border-primary/30 transition-all group">
                                        <input
                                            type="file"
                                            id="appResume"
                                            className="hidden"
                                            onChange={(e) => setResumeFile(e.target.files[0])}
                                            accept=".pdf,.doc,.docx"
                                        />
                                        <label htmlFor="appResume" className="cursor-pointer">
                                            <Upload className="w-8 h-8 text-primary/40 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                                {resumeFile 
                                                    ? `Selected: ${resumeFile.name}` 
                                                    : formDetails.documents?.resume 
                                                        ? 'Upload a different resume (optional)' 
                                                        : t('chooseResume')}
                                            </p>
                                        </label>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-3 pt-4 md:pt-6">
                                    <button
                                        onClick={submitFullApplication}
                                        disabled={applying}
                                        className="flex-1 bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-xs disabled:opacity-50"
                                    >
                                        {applying ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t('confirmApply')}
                                    </button>
                                    <button
                                        onClick={() => setProfileMode('edit')}
                                        className="px-8 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all text-xs"
                                    >
                                        {t('editProfile')}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={submitFullApplication} className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    <div className="space-y-1.5">
                                        <label className={labelClass}>{t('birthDate')}</label>
                                        <input required type="date" name="dob" value={formDetails.dob} onChange={handleFormChange} className={inputClass} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className={labelClass}>{t('qualification')}</label>
                                        <input required name="education" value={formDetails.education} onChange={handleFormChange} placeholder="e.g. B.E Computer Science" className={inputClass} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-primary uppercase tracking-widest">{t('currentAddress')}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <input placeholder={t('city')} name="city" value={formDetails.address.city} onChange={(e) => handleFormChange(e, 'address')} className={inputClass} />
                                        <input placeholder={t('district')} name="district" value={formDetails.address.district} onChange={(e) => handleFormChange(e, 'address')} className={inputClass} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-primary uppercase tracking-widest">{t('workExperience')}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <select name="type" value={formDetails.experience.type} onChange={(e) => handleFormChange(e, 'experience')} className={inputClass}>
                                            <option value="Fresher">{t('fresher')}</option>
                                            <option value="Experienced">{t('experienced')}</option>
                                        </select>
                                        <input placeholder={t('designation')} name="designation" value={formDetails.experience.designation} onChange={(e) => handleFormChange(e, 'experience')} className={inputClass} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className={labelClass}>
                                        {t('uploadResume') || 'Resume'} <span className="text-slate-300 lowercase font-bold">(Optional)</span>
                                    </label>
                                    <input
                                        type="file"
                                        onChange={(e) => setResumeFile(e.target.files[0])}
                                        accept=".pdf,.doc,.docx"
                                        className="w-full text-xs font-bold text-slate-400 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all"
                                    />
                                </div>

                                <div className="pt-4 md:pt-6">
                                    <button
                                        type="submit"
                                        disabled={applying}
                                        className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 text-xs"
                                    >
                                        {applying ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : t('saveProfileApply')}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            <div className="max-w-5xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors mb-10 cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" /> {t('backToListings')}
                </button>

                <div className="overflow-hidden">
                    <div className="pb-12 relative">
                        <div className={`absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50`} />
                        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start relative z-10">
                            <div className="w-20 h-20 md:w-24 md:h-24 bg-black rounded-2xl md:rounded-3xl flex items-center justify-center p-4 shadow-lg shrink-0">
                                {job.company_logo ? (
                                    <img src={job.company_logo} alt="logo" className="w-full h-full object-contain" />
                                ) : (
                                    <span className="text-white font-black text-xl md:text-2xl tracking-tighter uppercase">{job.company_name?.substring(0, 3) || 'JOB'}</span>
                                )}
                            </div>

                            <div className="flex-1 w-full">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                                    <div>
                                        <h1 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight mb-1">{job.title}</h1>
                                        <p className={`${isGovernment ? 'text-amber-600' : 'text-pink-600'} font-bold uppercase tracking-widest text-[10px] md:text-sm mb-6`}>
                                            {job.company_name || job.department || job.sector}
                                        </p>

                                        <div className="flex flex-wrap gap-4 md:gap-7 items-center">
                                            <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-wide">
                                                <MapPin className={`w-4 h-4 ${isGovernment ? 'text-amber-600' : 'text-pink-600'}`} /> {job.location ? (t(`districtsList.${job.location}`) !== `districtsList.${job.location}` ? t(`districtsList.${job.location}`) : job.location) : (isGovernment ? t('allIndia') : job.sector)}{job.district && job.district.toLowerCase() !== (job.location || '').toLowerCase() ? `, ${t(`districtsList.${job.district}`) !== `districtsList.${job.district}` ? t(`districtsList.${job.district}`) : job.district}` : ''}
                                            </div>
                                            {!isGovernment && (
                                                <>
                                                    <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-wide">
                                                        <Clock className="w-4 h-4 text-pink-600" /> {job.shift || 'General Shift'}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-wide">
                                                        <IndianRupee className="w-4 h-4 text-pink-600" /> {formatIndianNumber(job.salary_range)}
                                                    </div>
                                                </>
                                            )}
                                            <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-wide">
                                                <User className={`w-4 h-4 ${isGovernment ? 'text-amber-600' : 'text-pink-600'}`} /> {job.experience || t('fresher')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center md:flex-col md:items-end gap-3 w-full md:w-auto mt-4 md:mt-0">
                                        <span className="bg-green-100 text-green-700 px-4 md:px-6 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest shadow-sm border border-green-200 shrink-0">
                                            {job.vacancy} {t('opportunities')}
                                        </span>
                                        {userApplication ? (
                                            <div className="flex flex-col gap-3 bg-white border border-slate-100 p-4 md:p-5 rounded-[1.5rem] shadow-xl shadow-slate-200/50 shrink-0 w-full md:w-auto md:min-w-[190px] mt-4 md:mt-0 relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-full -mr-8 -mt-8 blur-2xl opacity-50 group-hover:bg-primary/5 transition-colors" />
                                                <div className="flex items-center gap-2.5 relative z-10">
                                                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ring-4 ${userApplication.status === 'shortlisted' ? 'bg-emerald-500 ring-emerald-50' : userApplication.status === 'rejected' ? 'bg-rose-500 ring-rose-50' : 'bg-amber-500 ring-amber-50'}`} />
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Application Status</span>
                                                        <span className="text-base md:text-lg font-black text-slate-900 capitalize tracking-tight">
                                                            {t(userApplication.status) || userApplication.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 pt-3.5 border-t border-slate-100 relative z-10">
                                                    <div>
                                                        <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Applied On</p>
                                                        <p className="text-[11px] md:text-xs font-bold text-slate-800 tracking-tight">
                                                            {userApplication.created_at ? new Date(userApplication.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                                        </p>
                                                    </div>
                                                    {userApplication.status !== 'applied' && userApplication.status !== 'pending' && (
                                                        <div>
                                                            <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Decision On</p>
                                                            <p className="text-[11px] md:text-xs font-bold text-slate-800 tracking-tight">
                                                                {userApplication.updated_at ? new Date(userApplication.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date(userApplication.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleApply}
                                                disabled={applying || checkingApp}
                                                className={`${isGovernment ? 'bg-amber-600 hover:bg-amber-700' : 'bg-pink-600 hover:bg-pink-700'} text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all w-full md:w-auto disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                                            >
                                                {applying || checkingApp ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : isGovernment ? (
                                                    <>
                                                        <ExternalLink className="w-4 h-4" />
                                                        {t('viewLink') || 'VIEW LINK'}
                                                    </>
                                                ) : (
                                                    t('applyNow')
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-0 border-t border-slate-100">
                        <div className="md:col-span-2 py-10 pr-0 md:pr-10 space-y-8">
                            {isGovernment ? (
                                <div className="max-w-3xl space-y-12">
                                    {/* Blog Header Context */}
                                    <div className="prose prose-slate lg:prose-lg max-w-none">
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="w-1.5 h-8 bg-amber-500 rounded-full"></div>
                                            <h2 className="text-2xl md:text-3xl font-black text-slate-900 m-0 uppercase tracking-tight">Recruitment Overview</h2>
                                        </div>

                                        {/* Description as the main blog body */}
                                        <div className="text-slate-600 leading-relaxed space-y-8">
                                            {job.description ? (
                                                <div className="bg-white py-2 italic text-lg md:text-xl font-medium text-slate-700 leading-relaxed">
                                                    <p className="whitespace-pre-line m-0">"{job.description}"</p>
                                                </div>
                                            ) : (
                                                <p className="font-medium text-lg italic text-slate-500 border-l-4 border-amber-50 pl-6">
                                                    Official recruitment notification for the position of {job.title} at {job.company_name || job.department || 'the requested department'}.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Detailed Sections (Blog Style) */}
                                    <div className="space-y-12 pt-4">
                                        {/* Application Mode Section */}
                                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2 opacity-60">
                                                {t('modeOfApp')}
                                            </h3>
                                            <p className="text-slate-800 font-bold text-lg md:text-xl">{job.application_mode || 'Online Application'}</p>
                                        </section>

                                        {/* Exam Mode Section */}
                                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
                                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2 opacity-60">
                                                {t('modeOfExam')}
                                            </h3>
                                            <p className="text-slate-800 font-bold text-lg md:text-xl leading-relaxed">{job.selection_process || 'Selection through merit and examination'}</p>
                                        </section>

                                        {job.qualification && (
                                            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2 opacity-60">
                                                    {t('qualification')}
                                                </h3>
                                                <p className="text-slate-800 font-bold text-lg md:text-xl leading-relaxed">{job.qualification}</p>
                                            </section>
                                        )}

                                        {job.age_relaxation && (
                                            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2 opacity-60">
                                                    {t('ageRelaxation')}
                                                </h3>
                                                <p className="text-slate-800 font-bold text-lg md:text-xl leading-relaxed">{job.age_relaxation}</p>
                                            </section>
                                        )}

                                        {/* Call to Action at the end of "blog" */}
                                        <div className="p-10 bg-slate-50 border border-slate-100 rounded-[2.5rem] mt-12 text-center">
                                            <p className="text-slate-600 font-bold mb-8 text-sm md:text-base">For complete details and to start your application, please visit the official notification website.</p>
                                            <button
                                                onClick={handleApply}
                                                className="bg-amber-600 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-amber-200 hover:bg-amber-700 transition-all flex items-center justify-center gap-3 mx-auto active:scale-95"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                View Official Website
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-pink-100 shrink-0">
                                                <Layout className="w-4 h-4 text-pink-600" />
                                            </span>
                                            {t('jobDescription')}
                                        </h3>
                                        <div className="prose prose-sm max-w-none text-slate-600 font-medium leading-relaxed">
                                            <p className="whitespace-pre-line text-sm md:text-base">{job.description}</p>
                                        </div>
                                    </div>

                                    {job.responsibilities && (
                                        <div className="pt-6 border-t border-pink-200/50">
                                            <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-pink-600" /> {t('rolesResp')}:
                                            </h4>
                                            <p className="whitespace-pre-line text-slate-600 font-medium leading-relaxed text-sm md:text-base">{job.responsibilities}</p>
                                        </div>
                                    )}

                                    {job.skills && (
                                        <div className="pt-6 border-t border-pink-200/50">
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-3">
                                                <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-pink-100 shrink-0">
                                                    <Award className="w-4 h-4 text-pink-600" />
                                                </span>
                                                {t('requiredSkills')}
                                            </h3>
                                            <div className="flex flex-wrap gap-2 md:gap-3">
                                                {job.skills.split(',').map((skill, i) => (
                                                    <span key={i} className="bg-white text-pink-600 border border-pink-100 px-3 md:px-5 py-1.5 md:py-2.5 rounded-xl text-xs md:text-sm font-bold capitalize shadow-sm">
                                                        {skill.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-6 border-t border-pink-200/50">
                                        <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-pink-100 shrink-0">
                                                <Settings className="w-4 h-4 text-pink-600" />
                                            </span>
                                            {t('jobRequirements')}
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                            <div className="bg-white/50 p-4 rounded-2xl border border-pink-100">
                                                <p className="text-[10px] md:text-xs font-bold text-pink-600 mb-1 capitalize">{t('experience')}</p>
                                                <p className="font-bold text-slate-900 text-sm md:text-base">{job.experience}</p>
                                            </div>
                                            <div className="bg-white/50 p-4 rounded-2xl border border-pink-100">
                                                <p className="text-[10px] md:text-xs font-bold text-pink-600 mb-1 capitalize">{t('jobTypeTag')}</p>
                                                <p className="font-bold text-slate-900 text-sm md:text-base">{job.job_type}</p>
                                            </div>
                                            {job.language && (
                                                <div className="bg-white/50 p-4 rounded-2xl border border-pink-100 sm:col-span-2">
                                                    <p className="text-[10px] md:text-xs font-bold text-pink-600 mb-1 capitalize">{t('languages')}</p>
                                                    <p className="font-bold text-slate-900 text-sm md:text-base">{job.language}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="py-10 md:pl-10 md:border-l border-slate-100 border-t md:border-t-0 space-y-6">
                            <div className="space-y-6">
                                {!isGovernment && (
                                    <div>
                                        <h3 className="text-sm md:text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <Building2 className="w-5 h-5 text-amber-600" /> {t('aboutCompany')}
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-xs md:text-sm">
                                                <span className="text-slate-500 font-bold">Industry:</span>
                                                <span className="font-bold text-slate-900">{job.company_industry || '-'}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs md:text-sm">
                                                <span className="text-slate-500 font-bold">Company Type:</span>
                                                <span className="font-bold text-slate-900">{job.company_type || 'Private Ltd'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className={`pt-6 ${!isGovernment ? 'border-t border-pink-100' : ''}`}>
                                    <h3 className="text-sm md:text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <Calendar className={`w-5 h-5 ${isGovernment ? 'text-amber-600' : 'text-amber-600'}`} /> {isGovernment ? t('importantDates') : t('jobStatus')}
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-xs md:text-sm">
                                            <span className="text-slate-500 font-bold">{t('posted')}:</span>
                                            <span className="font-bold text-slate-900">{new Date(job.created_at).toLocaleDateString('en-GB')}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs md:text-sm">
                                            <span className="text-slate-500 font-bold">{isGovernment ? t('lastDate') + ':' : t('expires') + ':'}</span>
                                            <span className="font-bold text-slate-900">
                                                {isGovernment 
                                                    ? (job.last_date ? new Date(job.last_date).toLocaleDateString('en-GB') : 'N/A')
                                                    : (job.application_deadline || (job.job_expiry && job.job_expiry !== '0000-00-00 00:00:00' ? new Date(job.job_expiry).toLocaleDateString('en-GB') : 'N/A'))}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs md:text-sm">
                                            <span className="font-bold text-slate-500">{t('status')}:</span>
                                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-[10px] font-bold">{t('active')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobDetails;
