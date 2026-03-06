
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
import { useNavigate } from 'react-router-dom';
import { allService } from '../../services/api';
import { toast } from 'react-hot-toast';

const ManageReviews = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [view, setView] = useState('list'); // 'list' or 'reviews'

    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            setLoading(true);

            // 1. Get employer jobs
            const jobData = await allService.getData('jobs', { employer_id: user.id });
            const jobList = Array.isArray(jobData) ? jobData : [];

            // 2. Fetch reviews for each job individually (Safest & most resilient way)
            // We use { status: 'visible' } because it's known to work on the homepage
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
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
                <div className="flex items-center gap-3 md:gap-6 leading-tight">
                    <button
                        onClick={() => setView('list')}
                        className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary transition-all border border-slate-100 shadow-sm shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <div className="flex flex-col justify-center min-w-0">
                        <h2 className="text-lg md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                            Reviews for <span className="text-primary truncate block lg:inline">{selectedJob.title}</span>
                        </h2>
                        <p className="text-[10px] md:text-sm font-extrabold text-slate-400 mt-0.5 md:mt-1">Reviewing candidate feedback for this vacancy</p>
                    </div>
                </div>

                {loadingReviews ? (
                    <div className="flex flex-col items-center justify-center h-64 md:h-96 bg-white rounded-2xl md:rounded-[3rem] border border-slate-100">
                        <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-primary mb-4 md:mb-6" />
                        <p className="text-[10px] md:text-sm font-extrabold text-slate-400 uppercase tracking-widest">Fetching feedback data...</p>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="bg-white rounded-2xl md:rounded-[3rem] p-12 md:p-24 text-center border border-slate-100 mx-4 md:mx-0">
                        <MessageCircle className="w-16 h-16 md:w-20 md:h-20 text-slate-100 mx-auto mb-6 md:mb-8" />
                        <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight mb-2">No Reviews Yet</h3>
                        <p className="text-slate-400 font-extrabold text-[10px] md:text-sm">Candidates will be able to review after the hiring process is complete.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-20 mx-4 lg:mx-0">
                        {reviews.map((rev) => (
                            <div key={rev.id} className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[3rem] border-2 md:border-[3px] border-primary/20 flex flex-col items-center text-center gap-4 md:gap-6 hover:-translate-y-2 transition-all group min-h-[350px] md:min-h-[400px] justify-center relative overflow-hidden shadow-sm hover:shadow-xl">
                                {/* Decorative Quote Icon */}
                                <MessageCircle className="absolute -top-4 -right-4 w-16 h-16 md:w-24 md:h-24 text-slate-50 opacity-50 group-hover:scale-110 transition-transform" />
                                <div className="relative z-10 w-full flex flex-col items-center">
                                    <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-50 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center text-slate-400 font-black text-xl md:text-2xl uppercase border-4 border-white shadow-xl overflow-hidden mb-3 md:mb-4 shrink-0">
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

                                    <div className="space-y-0.5 md:space-y-1 w-full text-center">
                                        <h4 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight truncate px-2">{rev.user_name}</h4>
                                        <div className="flex items-center justify-center gap-1.5 mb-3 md:mb-4">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-3 md:w-3.5 h-3 md:h-3.5 ${i < rev.rating ? 'text-amber-500 fill-current' : 'text-slate-200'}`} />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="w-full bg-slate-50/50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 relative group-hover:bg-white transition-colors min-h-[80px] md:min-h-[100px] flex items-center justify-center mx-2">
                                        <p className="text-slate-600 font-extrabold text-xs md:text-sm leading-relaxed line-clamp-4">
                                            "{rev.comment}"
                                        </p>
                                    </div>

                                    <div className="mt-5 md:mt-6 flex flex-col items-center gap-3 md:gap-4 w-full px-2">
                                        <button
                                            onClick={() => handleUpdateReviewStatus(rev.id, rev.status || 'visible')}
                                            className={`w-full py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-2 md:gap-3 transition-all ${(rev.status || 'visible') === 'visible'
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-600 hover:text-white'
                                                : 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white'
                                                }`}
                                        >
                                            {(rev.status || 'visible') === 'visible' ? (
                                                <><Eye className="w-3.5 h-3.5 md:w-4 md:h-4" /> Live on Site</>
                                            ) : (
                                                <><EyeOff className="w-3.5 h-3.5 md:w-4 md:h-4" /> Hidden</>
                                            )}
                                        </button>
                                        <p className="text-[9px] md:text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
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
        <div className="space-y-10 animate-in fade-in duration-500">
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
                            Manage Reviews
                        </h1>
                        <p className="text-[10px] md:text-sm text-slate-500 font-extrabold mt-0.5 md:mt-1 flex items-center gap-1.5 md:gap-2">
                            <span className="leading-tight">Moderate candidate feedback for your job postings</span>
                        </p>
                    </div>
                </div>

                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Filter by job title..."
                        className="w-full pl-12 md:pl-14 pr-6 md:pr-8 py-4 md:py-5 rounded-xl md:rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-900/5 outline-none focus:border-primary/30 transition-all font-extrabold text-xs md:text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-96 bg-white rounded-[3rem] border border-slate-100">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mb-6" />
                    <p className="text-sm font-semibold text-slate-400">Syncing with server...</p>
                </div>
            ) : jobs.length === 0 ? (
                <div className="bg-white rounded-2xl md:rounded-[4rem] border border-slate-100 p-12 md:p-24 text-center mx-4 md:mx-0">
                    <Briefcase className="w-16 h-16 md:w-24 md:h-24 text-slate-50 mx-auto mb-6 md:mb-8 shadow-inner rounded-2xl md:rounded-3xl p-4 md:p-6 bg-slate-50/50" />
                    <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight mb-2 md:mb-3">No Postings Yet</h3>
                    <p className="text-slate-400 font-extrabold text-[10px] md:text-sm">Start posting jobs to receive candidate feedback.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredJobs.map((job) => (
                        <div key={job.id} onClick={() => fetchReviews(job)} className="group bg-white p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-sm hover:shadow-2xl border border-slate-100 hover:border-primary/20 transition-all duration-500 cursor-pointer mx-4 md:mx-0">
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4 md:mb-6">
                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-50 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                                        <Briefcase className="w-6 h-6 md:w-8 md:h-8" />
                                    </div>
                                    <div className="flex items-center gap-1.5 md:gap-2">
                                        <div className="bg-emerald-50 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                            {job.vacancy} Active
                                        </div>
                                        {job.reviewCount > 0 && (
                                            <div className="bg-amber-500 text-white px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-extrabold uppercase tracking-widest shadow-lg shadow-amber-500/20 animate-pulse">
                                                {job.reviewCount} Reviews
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight line-clamp-2 mb-1 md:mb-2 group-hover:text-primary transition-colors">{job.title}</h3>
                                    <p className="text-[10px] md:text-xs font-extrabold text-slate-400 mb-4 md:mb-6 uppercase tracking-wider">{job.category} Sector</p>
                                </div>
                                {job.reviewCount > 0 ? (
                                    <div className="pt-4 md:pt-6 border-t border-slate-50 flex items-center justify-between group-hover:pt-6 md:group-hover:pt-8 transition-all">
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-amber-500 rounded-full animate-ping" />
                                            <span className="text-[10px] md:text-xs font-extrabold text-slate-900 flex items-center gap-1.5 md:gap-2">
                                                <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" /> {job.reviewCount} New Feedback
                                            </span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 md:w-5 h-5 text-slate-300 group-hover:translate-x-2 transition-transform" />
                                    </div>
                                ) : (
                                    <div className="pt-4 md:pt-6 border-t border-slate-50 flex items-center justify-between group-hover:pt-6 md:group-hover:pt-8 transition-all">
                                        <span className="text-[10px] md:text-xs font-extrabold text-slate-400 flex items-center gap-1.5 md:gap-2">
                                            <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-200" /> No Reviews Yet
                                        </span>
                                        <ChevronRight className="w-4 h-4 md:w-5 h-5 text-slate-200 group-hover:translate-x-2 transition-transform" />
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
