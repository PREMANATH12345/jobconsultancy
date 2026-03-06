import React, { useState, useEffect } from 'react';
import {
    User,
    Phone,
    MapPin,
    Briefcase,
    FileText,
    Loader2,
    GraduationCap,
    Calendar,
    IndianRupee,
    ArrowLeft,
    CheckCircle,
    XCircle,
    Download,
    Mail,
    ShieldCheck
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { allService } from '../../services/api';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatIndianNumber } from '../../utils/helpers';

const CandidateDetails = () => {
    const { t } = useLanguage();
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [candidate, setCandidate] = useState(null);
    const [appStatus, setAppStatus] = useState('pending');
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [appId, setAppId] = useState(null);

    useEffect(() => {
        fetchCandidate();
    }, [id]);

    const fetchCandidate = async () => {
        try {
            setLoading(true);
            const searchParams = new URLSearchParams(window.location.search);
            const appId = searchParams.get('appId');

            const data = await allService.getData('users', { id: id });
            if (data && data[0]) {
                const profile = data[0];
                let details = {};
                try {
                    if (profile.user_details) {
                        details = typeof profile.user_details === 'string'
                            ? JSON.parse(profile.user_details)
                            : profile.user_details;
                    }
                } catch (e) {
                    console.error("JSON fetch/parse error", e);
                }

                let applicationResume = null;
                let applicationDates = { created_at: null, updated_at: null };
                if (appId) {
                    setAppId(appId);
                    const appData = await allService.getData('job_applications', { id: appId });
                    if (appData && appData[0]) {
                        applicationResume = appData[0].resume;
                        applicationDates = {
                            created_at: appData[0].created_at,
                            updated_at: appData[0].updated_at
                        };
                        setAppStatus(appData[0].status || 'pending');
                    }
                }

                setCandidate({ ...profile, details, application_resume: applicationResume, applicationDates });
            }
        } catch (error) {
            toast.error("Failed to load candidate details");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        if (!appId) return;
        setUpdatingStatus(true);
        try {
            await allService.updateData('job_applications', { id: appId }, { status: newStatus, is_notified: 0 });
            setAppStatus(newStatus);
            toast.success(`Candidate marked as ${newStatus}`);
        } catch (error) {
            toast.error("Failed to update status");
        } finally {
            setUpdatingStatus(false);
        }
    };

    const getFullUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const baseUrl = 'https://apiphp.dsofthub.com/jobconsultancy/';
        const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
        return `${baseUrl}${cleanUrl}`;
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
    );

    if (!candidate) return <div>Candidate not found.</div>;

    const { details } = candidate;

    return (
        <div className="max-w-5xl mx-auto space-y-10">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-500 font-bold text-xs hover:text-primary transition-all"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Applications
            </button>

            <div className="bg-transparent md:bg-white rounded-none md:rounded-[3.5rem] shadow-none md:shadow-xl border-0 md:border border-slate-100 overflow-hidden">
                {/* Header Profile Section */}
                <div className="bg-slate-900 p-6 md:p-12 text-white flex flex-col lg:flex-row items-center gap-6 md:gap-10 rounded-3xl md:rounded-none mx-4 md:mx-0">
                    <div className="w-40 h-40 bg-white/10 rounded-[2.5rem] flex items-center justify-center overflow-hidden border-4 border-white/10">
                        {details?.documents?.passportPhoto ? (
                            <img src={getFullUrl(details.documents.passportPhoto)} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-20 h-20 text-white/20" />
                        )}
                    </div>
                    <div className="text-center md:text-left flex-1 w-full">
                        <div className="flex flex-col lg:flex-row justify-between items-center lg:items-center gap-6">
                            <div className="flex flex-col items-center lg:items-start w-full">
                                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">{candidate.name}</h1>
                                <div className="flex flex-wrap justify-center lg:justify-start gap-2 md:gap-4">
                                    <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-[10px] md:text-xs font-extrabold">
                                        <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" /> {candidate.email}
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-[10px] md:text-xs font-extrabold">
                                        <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" /> {candidate.phone}
                                    </div>
                                </div>
                            </div>

                            {/* Status Management */}
                            <div className="bg-white/5 p-5 md:p-6 rounded-3xl border border-white/10 backdrop-blur-md w-full md:w-auto">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-5">
                                    <p className="text-[10px] md:text-xs font-black text-white/40 uppercase tracking-widest">Update Candidate Status</p>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Applied Date</p>
                                            <p className="text-[11px] font-black text-white/80 tracking-wide">{candidate.applicationDates?.created_at ? new Date(candidate.applicationDates.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</p>
                                        </div>
                                        {candidate.applicationDates?.updated_at && (
                                            <div className="text-right">
                                                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Last Decision</p>
                                                <p className="text-[11px] font-black text-white/80 tracking-wide">{new Date(candidate.applicationDates.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-wrap justify-center md:justify-start gap-2.5">
                                    {[
                                        { id: 'pending', label: 'Pending', color: 'bg-slate-500' },
                                        { id: 'hold', label: 'Hold', color: 'bg-amber-500' },
                                        { id: 'shortlisted', label: 'Shortlist', color: 'bg-blue-500' },
                                        { id: 'selected', label: 'Select', color: 'bg-emerald-500' },
                                        { id: 'rejected', label: 'Reject', color: 'bg-red-500' }
                                    ].map((s) => (
                                        <button
                                            key={s.id}
                                            onClick={() => handleStatusUpdate(s.id)}
                                            disabled={updatingStatus}
                                            className={`flex-1 md:flex-none px-3 md:px-4 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-extrabold uppercase tracking-widest transition-all ${appStatus === s.id
                                                ? `${s.color} text-white shadow-lg`
                                                : 'bg-white/10 text-white/60 hover:bg-white/20'
                                                }`}
                                        >
                                            {updatingStatus && appStatus === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                    {/* Basic Info */}
                    <div className="space-y-6 md:space-y-8">
                        <h3 className="text-xs md:text-sm font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-3 border-b border-slate-100 pb-3 md:pb-4">
                            <User className="w-4 h-4 md:w-5 h-5 text-primary" /> Personal Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 px-2 md:px-0">
                            <div>
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Date of Birth</p>
                                <p className="text-sm md:text-base font-extrabold text-slate-900">{details?.dob || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Gender</p>
                                <p className="text-sm md:text-base font-extrabold text-slate-900">{details?.gender || 'N/A'}</p>
                            </div>
                            <div className="col-span-full">
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">WhatsApp</p>
                                <p className="text-sm md:text-base font-extrabold text-slate-900">{candidate.whatsapp_no || 'N/A'}</p>
                            </div>
                            <div className="col-span-full">
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Detailed Address</p>
                                <p className="text-sm md:text-base font-extrabold text-slate-900 leading-relaxed">
                                    {details?.address?.dNo && `${details.address.dNo}, `}
                                    {details?.address?.streetName && `${details.address.streetName}, `}
                                    {details?.address?.anjal && `${details.address.anjal}, `}
                                    {details?.address?.city}, {t(`districtsList.${details?.address?.district}`) !== `districtsList.${details?.address?.district}` ? t(`districtsList.${details?.address?.district}`) : details?.address?.district}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Professional Info */}
                    <div className="space-y-6 md:space-y-8">
                        <h3 className="text-xs md:text-sm font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-3 border-b border-slate-100 pb-3 md:pb-4">
                            <Briefcase className="w-4 h-4 md:w-5 h-5 text-amber-500" /> Career Profile
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 px-2 md:px-0">
                            <div>
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Education</p>
                                <p className="text-sm md:text-base font-extrabold text-slate-900">{details?.education || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Experience</p>
                                <p className="text-sm md:text-base font-extrabold text-slate-900">{details?.experience?.type || 'Fresher'}</p>
                            </div>
                            {details?.experience?.type === 'Experienced' && (
                                <>
                                    <div>
                                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Designation</p>
                                        <p className="text-sm md:text-base font-extrabold text-slate-900">{details?.experience?.designation}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Years</p>
                                        <p className="text-sm md:text-base font-extrabold text-slate-900">{details?.experience?.years}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Last Salary</p>
                                        <p className="text-sm md:text-base font-extrabold text-slate-900">{details?.experience?.lastSalary ? `₹ ${formatIndianNumber(details.experience.lastSalary)}` : 'N/A'}</p>
                                    </div>
                                </>
                            )}
                            <div>
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Desired Job</p>
                                <p className="text-sm md:text-base font-extrabold text-slate-900">{details?.expectations?.job || 'Any'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Expected Salary</p>
                                <p className="text-sm md:text-base font-extrabold text-slate-900">{details?.expectations?.expectedSalary ? `₹ ${formatIndianNumber(details.expectations.expectedSalary)}` : 'Negotiable'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Preferred Location</p>
                                <p className="text-sm md:text-base font-extrabold text-slate-900">{details?.expectations?.workPlace || 'Any'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Notice Period/Time</p>
                                <p className="text-sm md:text-base font-extrabold text-slate-900">{details?.expectations?.workTime || 'Immediate'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Documents */}
                    <div className="col-span-full space-y-6 md:space-y-8">
                        <h3 className="text-xs md:text-sm font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-3 border-b border-slate-100 pb-3 md:pb-4">
                            <FileText className="w-4 h-4 md:w-5 h-5 text-indigo-500" /> Documents & Attachments
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 px-2 md:px-0">
                            {(details?.documents?.resume || candidate.application_resume) && (
                                <a
                                    href={getFullUrl(candidate.application_resume || details.documents.resume)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between p-4 md:p-6 bg-slate-50 rounded-2xl md:rounded-3xl group hover:bg-primary transition-all"
                                >
                                    <div className="flex items-center gap-3 md:gap-4">
                                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                                            <FileText className="w-4 h-4 md:w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] md:text-xs font-extrabold text-slate-900 uppercase tracking-widest group-hover:text-white">Curriculum Vitae</p>
                                            <p className="text-[8px] md:text-[10px] font-extrabold text-slate-400 group-hover:text-white/60">
                                                {candidate.application_resume ? 'Application Specific Resume' : 'Profile Resume'}
                                            </p>
                                        </div>
                                    </div>
                                    <Download className="w-4 h-4 md:w-5 h-5 text-slate-300 group-hover:text-white" />
                                </a>
                            )}
                            {details?.documents?.idProof && (
                                <a
                                    href={getFullUrl(details.documents.idProof)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between p-4 md:p-6 bg-slate-50 rounded-2xl md:rounded-3xl group hover:bg-primary transition-all"
                                >
                                    <div className="flex items-center gap-3 md:gap-4">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-lg md:rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] md:text-xs font-extrabold text-slate-900 uppercase tracking-widest group-hover:text-white">ID Proof</p>
                                            <p className="text-[8px] md:text-[10px] font-extrabold text-slate-400 group-hover:text-white/60">Government ID.jpg</p>
                                        </div>
                                    </div>
                                    <Download className="w-4 h-4 md:w-5 h-5 text-slate-300 group-hover:text-white" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidateDetails;
