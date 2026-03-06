import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, User, Mail, Phone, Calendar, Briefcase,
    MapPin, GraduationCap, Award, FileText, X, Download, Eye, ShieldCheck, Globe
} from 'lucide-react';
import { allService } from '../../services/api';
import { toast } from 'react-hot-toast';

const CandidateDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [candidate, setCandidate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const user = JSON.parse(sessionStorage.getItem('user'));

    useEffect(() => {
        fetchCandidateDetails();
    }, [id]);

    const fetchCandidateDetails = async () => {
        try {
            setLoading(true);

            // Fetch application
            const appData = await allService.getData('job_applications', { id: parseInt(id) });
            const application = Array.isArray(appData) && appData.length > 0 ? appData[0] : null;

            if (!application) {
                toast.error('Application not found');
                navigate('/employer/candidates');
                return;
            }

            // Fetch job details
            const jobData = await allService.getData('jobs', { id: application.job_id });
            const job = Array.isArray(jobData) && jobData.length > 0 ? jobData[0] : null;

            // Fetch candidate details
            const userData = await allService.getData('users', { id: application.user_id });
            const candidateUser = Array.isArray(userData) && userData.length > 0 ? userData[0] : null;

            // Parse user_details JSON
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

            // Extract document URLs from user_details
            const documents = userDetails.documents || {};

            const getFullUrl = (url) => {
                if (!url) return null;
                if (url.startsWith('http')) return url;
                const baseUrl = 'https://apiphp.dsofthub.com/jobconsultancy/';
                const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
                return `${baseUrl}${cleanUrl}`;
            };

            setCandidate({
                ...application,
                job_title: job?.title || 'Unknown Job',
                candidate_name: candidateUser?.name || 'Unknown User',
                candidate_email: candidateUser?.email || 'N/A',
                candidate_phone: candidateUser?.phone || 'N/A',
                candidate_whatsapp: candidateUser?.whatsapp_no || 'N/A',
                candidate_user_id: candidateUser?.user_id || 'N/A',
                user_details: userDetails,
                passportPhoto: getFullUrl(documents.passportPhoto),
                idProof: getFullUrl(documents.idProof),
                resume: getFullUrl(documents.resume)
            });

        } catch (error) {
            console.error('Error fetching candidate:', error);
            toast.error('Failed to load candidate details');
            navigate('/employer/candidates');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (newStatus) => {
        try {
            await allService.updateData('job_applications', { id: candidate.id }, { status: newStatus });
            toast.success(`Candidate marked as ${newStatus}`);
            fetchCandidateDetails();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update status');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-10">
                <div className="animate-spin w-16 h-16 border-4 border-slate-900 border-t-emerald-500 rounded-full mb-4"></div>
                <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Fetching Professional Profile...</p>
            </div>
        );
    }

    const details = candidate.user_details || {};

    const handleDownload = async (url, filename) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename || url.split('/').pop() || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            window.open(url, '_blank');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-10 max-w-[1400px] mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
            {/* Navigation Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-100 text-left">
                <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8 max-w-full">
                    <button
                        onClick={() => navigate('/employer/candidates')}
                        className="group w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all border border-slate-100 shrink-0"
                    >
                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="flex items-center gap-6 min-w-0">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-900 rounded-2xl md:rounded-3xl flex items-center justify-center text-white font-black text-xl md:text-2xl uppercase border-4 border-white shadow-xl shrink-0 overflow-hidden">
                            {candidate.passportPhoto ? (
                                <img src={candidate.passportPhoto} alt={candidate.candidate_name} className="w-full h-full object-cover" />
                            ) : (
                                candidate.candidate_name?.substring(0, 2) || 'NA'
                            )}
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl md:text-3xl font-black text-slate-900 uppercase tracking-tight italic truncate">
                                {candidate.candidate_name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-2 mt-1 md:mt-2">
                                <span className={`px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-sm ${candidate.status === 'shortlisted' ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                                    candidate.status === 'rejected' ? 'bg-rose-500 text-white shadow-rose-500/20' :
                                        'bg-amber-500 text-white shadow-amber-500/20'
                                    }`}>
                                    {candidate.status || 'Applied'}
                                </span>
                                <span className="text-[10px] md:text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                    <Briefcase className="w-3.5 h-3.5 text-emerald-500" /> {candidate.job_title}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    {candidate.status !== 'shortlisted' && (
                        <button
                            onClick={() => updateStatus('shortlisted')}
                            className="flex-1 md:flex-none bg-emerald-500 text-white px-6 md:px-10 py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                        >
                            Shortlist
                        </button>
                    )}
                    {candidate.status !== 'rejected' && (
                        <button
                            onClick={() => updateStatus('rejected')}
                            className="flex-1 md:flex-none border-2 border-slate-100 text-slate-400 px-6 md:px-10 py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:border-rose-200 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-95"
                        >
                            Reject
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Left Column - Core Information */}
                <div className="space-y-6 md:space-y-8">
                    {/* Contact Card */}
                    <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-100 p-6 md:p-10 text-left">
                        <h2 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-widest mb-6 md:mb-8 flex items-center gap-3">
                            <Mail className="w-5 h-5 text-emerald-500" /> Professional contact
                        </h2>
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Email address</p>
                                <p className="text-sm font-black text-slate-900 break-all">{candidate.candidate_email}</p>
                            </div>
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Direct phone</p>
                                <p className="text-sm font-black text-slate-900">{candidate.candidate_phone}</p>
                            </div>
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">WhatsApp number</p>
                                <p className="text-sm font-black text-slate-900">{candidate.candidate_whatsapp || 'Not provided'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats/Registration */}
                    <div className="bg-slate-900 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl text-white text-left relative overflow-hidden">
                        <h2 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                            <ShieldCheck className="w-5 h-5 text-emerald-400" /> Platform data
                        </h2>
                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-center py-2 border-b border-white/10">
                                <span className="text-[10px] font-bold text-white/40 uppercase">Reg ID</span>
                                <span className="text-[10px] font-mono font-black text-emerald-400">UID-{candidate.candidate_user_id}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/10">
                                <span className="text-[10px] font-bold text-white/40 uppercase">Applied On</span>
                                <span className="text-[10px] font-black">{new Date(candidate.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-[10px] font-bold text-white/40 uppercase">Profile Status</span>
                                <span className="text-[10px] font-black uppercase text-emerald-400 animate-pulse">Verified</span>
                            </div>
                        </div>
                        <Globe className="absolute -bottom-10 -right-10 w-40 h-40 text-white/5 rotate-12" />
                    </div>

                    {/* Document Previews */}
                    <div className="space-y-4">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest px-4 text-left">Attached assets</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {candidate.passportPhoto && (
                                <button
                                    onClick={() => setSelectedDoc({ type: 'Passport Photo', url: candidate.passportPhoto })}
                                    className="aspect-square rounded-3xl bg-white border border-slate-100 p-2 shadow-lg group hover:border-emerald-500 transition-all overflow-hidden"
                                >
                                    <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-50 relative">
                                        <img src={candidate.passportPhoto} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                            <Eye className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                </button>
                            )}
                            {candidate.idProof && (
                                <button
                                    onClick={() => setSelectedDoc({ type: 'ID Proof', url: candidate.idProof })}
                                    className="aspect-square rounded-3xl bg-white border border-slate-100 p-2 shadow-lg group hover:border-emerald-500 transition-all overflow-hidden"
                                >
                                    <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-50 relative flex items-center justify-center">
                                        {candidate.idProof.toLowerCase().endsWith('.pdf') ? (
                                            <FileText className="w-10 h-10 text-slate-300" />
                                        ) : (
                                            <img src={candidate.idProof} className="w-full h-full object-cover" />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                            <Eye className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                </button>
                            )}
                        </div>
                        {candidate.resume && (
                            <button
                                onClick={() => setSelectedDoc({ type: 'Resume', url: candidate.resume })}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 p-6 rounded-[2rem] text-white shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-between group active:scale-95"
                            >
                                <div className="flex items-center gap-4 text-left">
                                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase opacity-60">Candidate Resume</p>
                                        <p className="text-sm font-black uppercase tracking-tight italic">Open Curriculum Vitae</p>
                                    </div>
                                </div>
                                <ArrowLeft className="w-6 h-6 rotate-180 group-hover:translate-x-1 transition-transform" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Right Column - Academic & Experience */}
                <div className="lg:col-span-2 space-y-6 md:space-y-8">
                    {/* Multi-Section Content */}
                    <div className="bg-white rounded-[2rem] md:rounded-[4rem] shadow-xl border border-slate-100 p-6 md:p-12 text-left">
                        <div className="space-y-12">
                            {/* Personal Background */}
                            <section>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <User className="w-5 h-5 text-emerald-500" /> Personal profile
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Date of birth</p>
                                        <p className="text-sm font-black text-slate-900">{details.dob || 'Not specified'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Official gender</p>
                                        <p className="text-sm font-black text-slate-900 capitalize">{details.gender || 'Not specified'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Education</p>
                                        <p className="text-sm font-black text-slate-900">{details.education || 'N/A'}</p>
                                    </div>
                                </div>
                            </section>

                            {/* Residential Data */}
                            <section>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <MapPin className="w-5 h-5 text-emerald-500" /> Residential details
                                </h3>
                                {details.address ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-100">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Door/Street</p>
                                            <p className="text-sm font-black text-slate-900 truncate">{details.address.dNo || ''} {details.address.streetName || ''}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Area/Anjal</p>
                                            <p className="text-sm font-black text-slate-900">{details.address.anjal || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">City/District</p>
                                            <p className="text-sm font-black text-slate-900">{details.address.city || ''}{details.address.city && details.address.district ? ', ' : ''}{details.address.district || ''}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No address information provided</p>
                                    </div>
                                )}
                            </section>

                            {/* Professional Tenure */}
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                                        <Award className="w-5 h-5 text-emerald-500" /> Career experience
                                    </h3>
                                    <span className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                                        {details.experience?.type || 'Entry Level'}
                                    </span>
                                </div>
                                {details.experience ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                                            <Briefcase className="absolute -bottom-2 -right-2 w-12 h-12 text-slate-50" />
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1 relative z-10">Last Designation</p>
                                            <p className="text-sm font-black text-slate-900 relative z-10">{details.experience.designation || 'N/A'}</p>
                                        </div>
                                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total tenure</p>
                                            <p className="text-sm font-black text-slate-900">{details.experience.years ? `${details.experience.years} Years` : 'Fresher'}</p>
                                        </div>
                                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Previous workplace</p>
                                            <p className="text-sm font-black text-slate-900">{details.experience.workPlace || 'N/A'}</p>
                                        </div>
                                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Current status</p>
                                            <p className="text-sm font-black text-emerald-500">{details.experience.currently || 'Actively seeking'}</p>
                                        </div>
                                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Withdrawal salary</p>
                                            <p className="text-sm font-black text-slate-900">{details.experience.lastSalary || 'N/A'}</p>
                                        </div>
                                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Technical field</p>
                                            <p className="text-sm font-black text-slate-900">{details.experience.field || 'General'}</p>
                                        </div>
                                        {details.experience.extraQual && (
                                            <div className="sm:col-span-2 bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 italic">
                                                <p className="text-[9px] font-black text-emerald-600 uppercase mb-2">Additional qualifications</p>
                                                <p className="text-sm font-bold text-slate-700">"{details.experience.extraQual}"</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No professional history documented</p>
                                    </div>
                                )}
                            </section>

                            <hr className="border-slate-100" />

                            {/* Job Expectations */}
                            <section>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <Award className="w-5 h-5 text-emerald-500" /> Placement expectations
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="bg-slate-900 p-6 rounded-2xl md:rounded-3xl border border-slate-800 shadow-2xl">
                                        <p className="text-[8px] md:text-[9px] font-black text-white/40 uppercase mb-1">Target role</p>
                                        <p className="text-xs md:text-sm font-black text-emerald-400">{details.expectations?.job || 'Any suitable'}</p>
                                    </div>
                                    <div className="bg-slate-950 p-6 rounded-2xl md:rounded-3xl border border-slate-800 shadow-2xl">
                                        <p className="text-[8px] md:text-[9px] font-black text-white/40 uppercase mb-1">Destination</p>
                                        <p className="text-xs md:text-sm font-black text-white">{details.expectations?.destination || 'Anywhere'}</p>
                                    </div>
                                    <div className="bg-slate-900 p-6 rounded-2xl md:rounded-3xl border border-slate-800 shadow-2xl">
                                        <p className="text-[8px] md:text-[9px] font-black text-white/40 uppercase mb-1">Work environment</p>
                                        <p className="text-xs md:text-sm font-black text-white">{details.expectations?.workPlace || 'Standard'}</p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Document Modal */}
            {selectedDoc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedDoc(null)}></div>
                    <div className="relative bg-white w-full max-w-6xl h-full max-h-[90vh] rounded-[2.5rem] md:rounded-[4rem] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-300">
                        <div className="flex items-center justify-between p-6 md:p-10 border-b border-slate-100 bg-white z-20">
                            <div className="text-left">
                                <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter italic">{selectedDoc.type} Preview</h3>
                                <p className="text-[10px] md:text-xs text-slate-400 font-bold mt-1 truncate max-w-[200px] sm:max-w-md">Source: {selectedDoc.url.split('/').pop()}</p>
                            </div>
                            <button onClick={() => setSelectedDoc(null)} className="p-4 md:p-5 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl md:rounded-3xl transition-all border border-slate-100 shadow-sm active:scale-90">
                                <X className="w-6 h-6 md:w-8 md:h-8" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden bg-slate-100 flex items-center justify-center">
                            {selectedDoc.url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? (
                                <img src={selectedDoc.url} alt={selectedDoc.type} className="max-w-full max-h-full object-contain" />
                            ) : (
                                <iframe src={`${selectedDoc.url}#toolbar=0`} className="w-full h-full border-none bg-white font-bold" title="Document Viewer" />
                            )}
                        </div>
                        <div className="p-6 md:p-10 border-t border-slate-100 bg-white flex flex-col sm:flex-row justify-end items-center gap-4">
                            <button
                                onClick={() => handleDownload(selectedDoc.url, `${selectedDoc.type}_${candidate.candidate_name}`)}
                                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-2xl md:rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-2xl active:scale-95"
                            >
                                <Download className="w-5 h-5" /> Download copy
                            </button>
                            <button onClick={() => setSelectedDoc(null)} className="w-full sm:w-auto px-10 py-5 bg-slate-100 text-slate-600 rounded-2xl md:rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CandidateDetails;