
import React, { useState, useEffect } from 'react';
import {
    MessageSquare,
    Star,
    Eye,
    EyeOff,
    MessageCircle,
    Briefcase,
    Loader2,
    ChevronRight,
    Search,
    User,
    ArrowLeft
} from 'lucide-react';
import { allService } from '../../services/api';
import { toast } from 'react-hot-toast';

const ManageReviews = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [view, setView] = useState('list'); // 'list' or 'reviews'

    const adminUser = JSON.parse(sessionStorage.getItem('user')) || {};

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            setLoading(true);

            // 1. Get Government jobs (posted by admin)
            const jobData = await allService.getData('jobs', { category: 'Government' });
            const jobList = Array.isArray(jobData) ? jobData : [];

            // 2. Fetch reviews for each job individually
            const enrichedJobs = await Promise.all(
                jobList.map(async (job) => {
                    try {
                        const reviewData = await allService.getData('reviews', { job_id: job.id });
                        const jobReviews = Array.isArray(reviewData) ? reviewData : [];
                        return {
                            ...job,
                            reviewCount: jobReviews.length
                        };
                    } catch (e) {
                        return { ...job, reviewCount: 0 };
                    }
                })
            );

            setJobs(enrichedJobs);
        } catch (error) {
            console.error("Fetch jobs error:", error);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async (job) => {
        try {
            setLoadingReviews(true);
            setSelectedJob(job);
            setView('reviews');

            // Fetch all reviews specifically for this job
            const reviewsData = await allService.getData('reviews', { job_id: job.id });
            const jobReviews = Array.isArray(reviewsData) ? reviewsData : [];

            // Enrich reviews with user names and photos
            const enriched = await Promise.all(
                jobReviews.map(async (rev) => {
                    try {
                        const userData = await allService.getData('users', { id: rev.user_id });
                        const candidateUser = userData && userData[0] ? userData[0] : null;

                        let photoUrl = null;
                        if (candidateUser?.user_details) {
                            try {
                                const details = typeof candidateUser.user_details === 'string'
                                    ? JSON.parse(candidateUser.user_details)
                                    : candidateUser.user_details;
                                if (details.documents?.passportPhoto) {
                                    const path = details.documents.passportPhoto;
                                    photoUrl = path.startsWith('http') ? path : `https://apiphp.dsofthub.com/jobconsultancy/${path.startsWith('/') ? path.substring(1) : path}`;
                                }
                            } catch (e) {
                                console.error('JSON parse error for user_details');
                            }
                        }

                        return {
                            ...rev,
                            user_name: candidateUser ? candidateUser.name : 'Verified Candidate',
                            user_photo: photoUrl
                        };
                    } catch (e) {
                        return { ...rev, user_name: 'Verified Candidate', user_photo: null };
                    }
                })
            );

            setReviews(enriched);
        } catch (error) {
            console.error("Fetch reviews error:", error);
            toast.error("Failed to load reviews");
        } finally {
            setLoadingReviews(false);
        }
    };

    const handleUpdateReviewStatus = async (reviewId, currentStatus) => {
        const newStatus = currentStatus === 'visible' ? 'hidden' : 'visible';
        try {
            await allService.updateData('reviews', { id: reviewId }, { status: newStatus });
            setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: newStatus } : r));
            toast.success(`Review is now ${newStatus === 'visible' ? 'visible on website' : 'hidden from website'}`);
        } catch (error) {
            toast.error("Failed to update status");
        }
    };


    const filteredJobs = jobs.filter(j =>
        j.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (view === 'reviews' && selectedJob) {
        return (
            <div className="p-4 md:p-8 space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setView('list')}
                        className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all border border-slate-100 shadow-sm"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                            Reviews for <span className="text-indigo-600">{selectedJob.title}</span>
                        </h2>
                        <p className="text-sm font-medium text-slate-500 mt-1">Reviewing candidate feedback for this government posting</p>
                    </div>
                </div>

                {loadingReviews ? (
                    <div className="flex flex-col items-center justify-center h-96 bg-white rounded-[3rem] border border-slate-100">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-6" />
                        <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Fetching feedback data...</p>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-12 md:p-24 text-center border border-slate-100 shadow-xl mx-4">
                        <MessageCircle className="w-16 h-16 md:w-20 md:h-20 text-indigo-50 mx-auto mb-8" />
                        <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mb-2">No Reviews Yet</h3>
                        <p className="text-slate-500 font-medium text-sm">Candidates will be able to review after the selection process is complete.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                        {reviews.map((rev) => (
                            <div key={rev.id} className="bg-white p-8 rounded-[3rem] border-[3px] border-indigo-600/40 flex flex-col items-center text-center gap-6 hover:-translate-y-2 transition-all group min-h-[420px] justify-center relative overflow-hidden">
                                {/* Decorative Quote Icon */}
                                <MessageCircle className="absolute -top-4 -right-4 w-24 h-24 text-indigo-50/50 opacity-100 group-hover:scale-110 transition-transform" />

                                <div className="relative z-10 w-full flex flex-col items-center">
                                    <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-400 font-black text-2xl uppercase border-4 border-white shadow-xl overflow-hidden mb-4 shrink-0">
                                        <img
                                            src={rev.user_photo || '/reviewfallback.png'}
                                            alt={rev.user_name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = '/reviewfallback.png';
                                            }}
                                        />
                                    </div>

                                    <div className="space-y-1 w-full text-center">
                                        <h4 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">{rev.user_name}</h4>
                                        <div className="flex items-center justify-center gap-1.5 mb-4">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'text-amber-500 fill-current' : 'text-slate-200'}`} />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="w-full bg-slate-50/50 p-6 rounded-3xl border border-slate-100 relative group-hover:bg-white transition-colors min-h-[100px] flex items-center justify-center">
                                        <p className="text-slate-600 font-medium text-sm leading-relaxed line-clamp-4">
                                            "{rev.comment}"
                                        </p>
                                    </div>

                                    <div className="mt-6 flex flex-col items-center gap-4 w-full">
                                        <button
                                            onClick={() => handleUpdateReviewStatus(rev.id, rev.status || 'visible')}
                                            className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${(rev.status || 'visible') === 'visible'
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-600 hover:text-white'
                                                : 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white'
                                                }`}
                                        >
                                            {(rev.status || 'visible') === 'visible' ? (
                                                <><Eye className="w-4 h-4" /> Live on Site</>
                                            ) : (
                                                <><EyeOff className="w-4 h-4" /> Hidden</>
                                            )}
                                        </button>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            Posted: {new Date(rev.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-10 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                        Manage Reviews
                    </h1>
                    <p className="text-slate-500 font-medium text-sm mt-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-indigo-600" />
                        Moderate candidate feedback for official government postings
                    </p>
                </div>

                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Filter by job title..."
                        className="w-full pl-14 pr-8 py-5 rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-900/5 outline-none focus:border-indigo-600/30 transition-all font-medium text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-96 bg-white rounded-[3rem] border border-slate-100">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-6" />
                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Syncing with server...</p>
                </div>
            ) : jobs.length === 0 ? (
                <div className="bg-white rounded-[2rem] md:rounded-[4rem] border border-slate-100 p-12 md:p-24 text-center mx-4">
                    <Briefcase className="w-16 h-16 md:w-24 md:h-24 text-slate-50 mx-auto mb-8 shadow-inner rounded-3xl p-6 bg-slate-50/50" />
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mb-3">No Postings Yet</h3>
                    <p className="text-slate-500 font-medium text-sm">Post government jobs to receive candidate feedback.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredJobs.map((job) => (
                        <div key={job.id} onClick={() => fetchReviews(job)} className="group bg-white p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl border border-slate-100 hover:border-indigo-600/20 transition-all duration-500 cursor-pointer">
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                        <Briefcase className="w-8 h-8" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="bg-indigo-50 px-4 py-2 rounded-xl text-[10px] font-bold text-indigo-600 uppercase tracking-widest border border-indigo-100 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                            {job.vacancy} Positions
                                        </div>
                                        {job.reviewCount > 0 && (
                                            <div className="bg-amber-500 text-white px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-amber-500/20 animate-pulse">
                                                {job.reviewCount} Reviews
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors leading-snug">{job.title}</h3>
                                    <p className="text-xs font-semibold text-slate-500 mb-6 uppercase tracking-wider">{job.govt_type} Official</p>
                                </div>
                                {job.reviewCount > 0 ? (
                                    <div className="pt-6 border-t border-slate-50 flex items-center justify-between group-hover:pt-8 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
                                            <span className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                                                <MessageSquare className="w-4 h-4 text-indigo-600" /> {job.reviewCount} New Feedback
                                            </span>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-2 transition-transform" />
                                    </div>
                                ) : (
                                    <div className="pt-6 border-t border-slate-50 flex items-center justify-between group-hover:pt-8 transition-all">
                                        <span className="text-xs font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                                            <MessageSquare className="w-4 h-4 text-slate-200" /> No Reviews Yet
                                        </span>
                                        <ChevronRight className="w-5 h-5 text-slate-200 group-hover:translate-x-2 transition-transform" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManageReviews;
