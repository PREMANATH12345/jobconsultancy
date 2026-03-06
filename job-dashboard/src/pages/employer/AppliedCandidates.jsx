import React, { useEffect, useState } from 'react';
import { Users, Briefcase, Calendar, Mail, CheckCircle, XCircle, Eye, Search, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { allService } from '../../services/api';
import { toast } from 'react-hot-toast';

const AppliedCandidates = () => {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem('user'));

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        try {
            setLoading(true);

            const jobsData = await allService.getData('jobs', { employer_id: user.id });
            const myJobs = Array.isArray(jobsData) ? jobsData : [];

            if (myJobs.length === 0) {
                setCandidates([]);
                return;
            }

            const myJobIds = myJobs.map(j => parseInt(j.id));

            const applicationsData = await allService.getData('job_applications');
            const allApplications = Array.isArray(applicationsData) ? applicationsData : [];

            const myApplications = allApplications.filter(app =>
                myJobIds.includes(parseInt(app.job_id))
            );

            if (myApplications.length === 0) {
                setCandidates([]);
                return;
            }

            const getFullUrl = (url) => {
                if (!url) return null;
                if (url.startsWith('http')) return url;
                const baseUrl = 'https://apiphp.dsofthub.com/jobconsultancy/';
                const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
                return `${baseUrl}${cleanUrl}`;
            };

            const enrichedCandidates = await Promise.all(
                myApplications.map(async (app) => {
                    try {
                        const job = myJobs.find(j => parseInt(j.id) === parseInt(app.job_id));
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
                            job_title: job?.title || 'Unknown Job',
                            job_id: job?.id,
                            candidate_name: candidateUser?.name || 'Unknown User',
                            candidate_email: candidateUser?.email || 'N/A',
                            passportPhoto: getFullUrl(documents.passportPhoto)
                        };
                    } catch (userErr) {
                        console.error(`Failed to fetch user for application ${app.id}:`, userErr);
                        return {
                            ...app,
                            job_title: 'Unknown Job',
                            candidate_name: 'Error Loading User',
                            candidate_email: 'N/A'
                        };
                    }
                })
            );

            setCandidates(enrichedCandidates);

        } catch (error) {
            console.error("Error fetching candidates:", error);
            toast.error("Failed to load candidates");
            setCandidates([]);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (appId, newStatus) => {
        try {
            await allService.updateData('job_applications', { id: appId }, { status: newStatus });
            toast.success(`Candidate marked as ${newStatus}`);
            fetchCandidates();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update status");
        }
    };

    const filteredCandidates = candidates.filter(c =>
        c.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.job_title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-6 md:space-y-10">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 text-left border-b border-slate-100 pb-8 md:pb-12">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter leading-tight">Applied Candidates</h1>
                    <p className="text-sm font-bold text-slate-400 mt-2 lowercase">Review and manage applications for your posted jobs.</p>
                </div>
                <div className="relative w-full lg:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search candidates or jobs..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-100 shadow-lg focus:border-emerald-500 outline-none text-sm font-bold transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 md:py-32">
                    <div className="animate-spin w-12 h-12 border-4 border-slate-900 border-t-emerald-500 rounded-full mx-auto"></div>
                    <p className="mt-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Synchronizing applications...</p>
                </div>
            ) : filteredCandidates.length === 0 ? (
                <div className="text-center py-20 md:py-32 bg-white rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-slate-100 shadow-sm animate-in fade-in zoom-in duration-500">
                    <Users className="w-16 h-16 md:w-24 md:h-24 text-slate-100 mx-auto mb-6 md:mb-8" />
                    <p className="text-slate-900 font-black uppercase tracking-widest text-lg">No matches found</p>
                    <p className="text-slate-400 font-bold mt-2 lowercase">We couldn't find any applications matching your current criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:gap-8">
                    {filteredCandidates.map((item) => (
                        <div key={item.id} className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl border border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-8 group hover:border-emerald-500/30 transition-all text-left relative overflow-hidden">
                            <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-10 relative z-10 w-full lg:w-auto text-center sm:text-left">
                                <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-2xl font-black text-slate-300 uppercase overflow-hidden border-4 border-white shadow-xl shrink-0">
                                    {item.passportPhoto ? (
                                        <img src={item.passportPhoto} alt={item.candidate_name} className="w-full h-full object-cover" />
                                    ) : (
                                        item.candidate_name?.substring(0, 2) || 'NA'
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-col sm:flex-row items-center gap-3 mb-2 md:mb-3">
                                        <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight italic truncate max-w-[200px] sm:max-w-none">{item.candidate_name || 'Anonymous'}</h3>
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-sm ${item.status === 'shortlisted' ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                                            item.status === 'rejected' ? 'bg-rose-500 text-white shadow-rose-500/20' :
                                                'bg-amber-500 text-white shadow-amber-500/20'
                                            }`}>
                                            {item.status || 'Applied'}
                                        </span>
                                    </div>
                                    <p className="text-xs md:text-sm font-bold text-slate-500 flex items-center justify-center sm:justify-start gap-2 mb-4">
                                        <Briefcase className="w-4 h-4 text-emerald-500" /> for <span className="text-slate-900 border-b-2 border-emerald-500/20 italic">{item.job_title}</span>
                                    </p>
                                    <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4 md:gap-6 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wide">
                                        <span className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-emerald-500" /> {item.candidate_email}</span>
                                        <span className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-emerald-500" /> {new Date(item.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 md:gap-4 relative z-10 w-full lg:w-auto justify-center">
                                <button
                                    onClick={() => navigate(`/employer/candidate-details/${item.id}`)}
                                    className="flex-1 lg:flex-none bg-slate-900 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 md:gap-3 shadow-2xl active:scale-95"
                                >
                                    <Eye className="w-4 h-4 md:w-5 md:h-5" /> Full profile
                                </button>
                                <div className="flex gap-2 min-w-0">
                                    {item.status !== 'shortlisted' && (
                                        <button
                                            onClick={() => updateStatus(item.id, 'shortlisted')}
                                            className="bg-emerald-50 text-emerald-600 p-3 md:p-4 rounded-xl md:rounded-2xl font-black hover:bg-emerald-500 hover:text-white transition-all shadow-sm border border-emerald-100 flex items-center justify-center active:scale-90"
                                            title="Shortlist"
                                        >
                                            <CheckCircle className="w-5 h-5 md:w-6 md:h-6" />
                                        </button>
                                    )}
                                    {item.status !== 'rejected' && (
                                        <button
                                            onClick={() => updateStatus(item.id, 'rejected')}
                                            className="bg-rose-50 text-rose-600 p-3 md:p-4 rounded-xl md:rounded-2xl font-black hover:bg-rose-500 hover:text-white transition-all shadow-sm border border-rose-100 flex items-center justify-center active:scale-90"
                                            title="Reject"
                                        >
                                            <XCircle className="w-5 h-5 md:w-6 md:h-6" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity hidden lg:block">
                                <Users className="w-40 h-40 text-slate-900 -rotate-12" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AppliedCandidates;