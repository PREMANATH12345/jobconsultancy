import React, { useEffect, useState } from 'react';
import { Users, Briefcase, Calendar, Mail, CheckCircle, XCircle, Eye, Loader2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { allService } from '../../services/api';
import { toast } from 'react-hot-toast';

const AppliedCandidates = () => {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

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
            toast.error("Failed to update status");
        }
    };

    const filteredCandidates = candidates.filter(c =>
        c.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.job_title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Applications</h1>
                    <p className="text-slate-500 font-medium mt-2 text-sm">Manage candidates who applied for your jobs.</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search candidates..."
                        className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 focus:border-primary outline-none font-medium text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            ) : filteredCandidates.length === 0 ? (
                <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 p-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Users className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No applications found matching your criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredCandidates.map((item) => (
                        <div key={item.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-primary/20 transition-all group">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl font-black text-primary border border-slate-100 overflow-hidden group-hover:bg-primary group-hover:text-white transition-all">
                                    {item.passportPhoto ? (
                                        <img src={item.passportPhoto} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        item.candidate_name?.charAt(0)
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-4 mb-2">
                                        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{item.candidate_name}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${item.status === 'shortlisted' ? 'bg-blue-100 text-blue-600' :
                                                item.status === 'hold' ? 'bg-amber-100 text-amber-600' :
                                                    item.status === 'selected' ? 'bg-emerald-100 text-emerald-600' :
                                                        item.status === 'rejected' ? 'bg-red-100 text-red-600' :
                                                            'bg-slate-100 text-slate-600'
                                                }`}>
                                                {item.status || 'Applied'}
                                            </span>
                                            {(item.status === 'applied' || !item.status) && (
                                                <span className="bg-primary text-white text-[10px] md:text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-wider animate-pulse shadow-md shadow-primary/20 flex items-center gap-1.5 border border-white/20">
                                                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                                                    New
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-slate-400 tracking-wide">
                                        <span className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" /> {item.job_title}</span>
                                        <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> {item.candidate_email}</span>
                                        <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> {new Date(item.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={async () => {
                                        if (item.status === 'applied' || !item.status) {
                                            await allService.updateData('job_applications', { id: item.id }, { status: 'viewed' });
                                            // Local state update
                                            setCandidates(prev => prev.map(c => c.id === item.id ? { ...c, status: 'viewed' } : c));
                                        }
                                        navigate(`/employer/candidate-details/${item.user_id}?appId=${item.id}`);
                                    }}
                                    className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary transition-all shadow-lg flex items-center gap-2"
                                >
                                    <Eye className="w-4 h-4" /> Profile
                                </button>
                                {item.status !== 'shortlisted' && (
                                    <button
                                        onClick={() => updateStatus(item.id, 'shortlisted')}
                                        className="p-4 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all"
                                        title="Shortlist"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                    </button>
                                )}
                                {item.status !== 'rejected' && (
                                    <button
                                        onClick={() => updateStatus(item.id, 'rejected')}
                                        className="p-4 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                        title="Reject"
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AppliedCandidates;
