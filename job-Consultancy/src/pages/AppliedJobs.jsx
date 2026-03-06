
import React, { useEffect, useState } from 'react';
import { Briefcase, Building2, Calendar, Loader2, Bell, Star, MessageSquare, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { allService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'react-hot-toast';

const AppliedJobs = ({ hideHeader = false }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviewModal, setReviewModal] = useState({ open: false, app: null });
    const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
    const [submittingReview, setSubmittingReview] = useState(false);

    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (!user || user.role !== 'employee') {
            navigate('/login');
            return;
        }
        fetchAppliedJobs();
    }, []);

    const fetchAppliedJobs = async () => {
        try {
            setLoading(true);

            // Fetch applications for this user
            const result = await allService.getData('job_applications', { user_id: parseInt(user.id) });
            const userApps = Array.isArray(result) ? result : [];

            if (userApps.length === 0) {
                setApplications([]);
                return;
            }

            // Sort applications by date descending (latest first)
            const sortedApps = [...userApps].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            // Fetch job details for each application
            const enhancedApps = await Promise.all(
                sortedApps.map(async (app) => {
                    try {
                        const jobData = await allService.getData('jobs', { id: app.job_id });
                        const job = Array.isArray(jobData) && jobData.length > 0 ? jobData[0] : null;

                        // Check if review already exists
                        const reviewData = await allService.getData('reviews', { user_id: user.id, job_id: app.job_id });
                        const hasReviewed = Array.isArray(reviewData) && reviewData.length > 0;

                        return { ...app, job, hasReviewed };
                    } catch (err) {
                        console.error(`Failed to fetch job ${app.job_id}:`, err);
                        return { ...app, job: null, hasReviewed: false };
                    }
                })
            );

            setApplications(enhancedApps);

            // Mark all as read
            const unreadApps = userApps.filter(app => app.is_notified === 0 || app.is_notified === '0');
            if (unreadApps.length > 0) {
                await Promise.all(unreadApps.map(app =>
                    allService.updateData('job_applications', { id: app.id }, { is_notified: 1 })
                ));
            }

        } catch (error) {
            console.error("Error fetching applications:", error);
            setApplications([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!reviewData.comment.trim()) {
            toast.error("Please write a comment");
            return;
        }

        if (!reviewModal.app?.job?.employer_id) {
            toast.error("Job details not fully loaded. Please refresh and try again.");
            return;
        }

        try {
            setSubmittingReview(true);
            const payload = {
                user_id: user.id,
                job_id: reviewModal.app.job_id,
                employer_id: reviewModal.app.job.employer_id,
                rating: reviewData.rating,
                comment: reviewData.comment,
                status: 'visible'
            };

            await allService.insertData('reviews', payload);
            toast.success("Review submitted successfully!");
            setReviewModal({ open: false, app: null });
            fetchAppliedJobs(); // Refresh to hide button
        } catch (error) {
            toast.error("Failed to submit review");
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        </div>
    );

    return (
        <div className={`${hideHeader ? 'pt-0' : 'pt-32'} pb-20 px-4 min-h-screen ${hideHeader ? 'bg-transparent' : 'bg-white'}`}>
            <div className={`max-w-5xl mx-auto ${hideHeader ? 'max-w-full' : ''}`}>
                {!hideHeader && (
                    <div className="mb-8 p-6 md:p-8 bg-emerald-50 rounded-2xl md:rounded-3xl border-2 border-emerald-100 shadow-md text-center">
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">My Applications</h1>
                        <p className="text-sm font-bold text-slate-400 mt-2 lowercase">Track the status of your job applications.</p>
                    </div>
                )}

                {applications.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                        <Briefcase className="w-20 h-20 text-slate-200 mx-auto mb-6" />
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">No Applications Yet</h2>
                        <p className="text-slate-400 font-bold max-w-md mx-auto mb-8 lowercase">You haven't applied to any jobs yet. Browse our listings and find your dream career!</p>
                        <Link to="/jobs" className="bg-emerald-500 text-white px-10 py-4 rounded-xl font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-emerald-500/20">
                            Find Jobs
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        {applications.map((app) => (
                            <div key={app.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group transition-all hover:shadow-md hover:border-emerald-200">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100 shadow-sm">
                                            {app.job?.category === 'Government' ? <Building2 className="w-6 h-6" /> : <Briefcase className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h3 className="text-lg md:text-xl font-black text-slate-900 leading-tight mb-1">{app.job?.title || 'Job Title'}</h3>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">
                                                    {app.job?.company_name || app.job?.department || 'Company'}
                                                </p>
                                                {(app.is_notified === 0 || app.is_notified === '0') && (
                                                    <span className="flex items-center gap-1 bg-red-500 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter animate-pulse">
                                                        <Bell className="w-2 h-2" /> New
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`inline-flex px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm self-start sm:self-auto ${app.status === 'shortlisted' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                        app.status === 'hold' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                            (app.status === 'selected' || app.status === 'select') ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                                (app.status === 'rejected' || app.status === 'reject') ? 'bg-red-100 text-red-700 border border-red-200' :
                                                    'bg-slate-100 text-slate-600 border border-slate-200'
                                        }`}>
                                        {app.status || 'Applied'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 py-6 border-y border-slate-50">
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Applied On</p>
                                        <div className="flex items-center gap-2 text-slate-700">
                                            <Calendar className="w-4 h-4 text-emerald-500" />
                                            <p className="text-sm font-bold tracking-wide">
                                                {app.created_at ? new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Updated On</p>
                                        <div className="flex items-center gap-2 text-slate-700">
                                            <Calendar className="w-4 h-4 text-blue-500" />
                                            <p className="text-sm font-bold tracking-wide">
                                                {app.updated_at ? new Date(app.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : (app.created_at ? new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 hidden lg:block">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sector</p>
                                        <div className="flex items-center gap-2 text-slate-700">
                                            <Briefcase className="w-4 h-4 text-pink-500" />
                                            <p className="text-sm font-bold tracking-wide">
                                                {app.job?.category || 'Private'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-3">
                                    <Link to={`/job/${app.job_id}`} className="flex-1 py-4 rounded-xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95">
                                        Full Details
                                    </Link>

                                    {(app.status === 'selected' || app.status === 'select' || app.status === 'rejected' || app.status === 'reject') && !app.hasReviewed && (
                                        <button
                                            onClick={() => {
                                                setReviewModal({ open: true, app: app });
                                                setReviewData({ rating: 5, comment: '' });
                                            }}
                                            className="flex-1 py-4 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-500 hover:text-white transition-all shadow-md active:scale-95"
                                        >
                                            <Star className="w-4 h-4" /> Write Review
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {reviewModal.open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">
                                        Experience <span className="text-amber-500">Feedback</span>
                                    </h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Reviewing: {reviewModal.app.job?.title}</p>
                                </div>
                                <button onClick={() => setReviewModal({ open: false, app: null })} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Overall Rating</label>
                                    <div className="flex gap-3">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                onClick={() => setReviewData({ ...reviewData, rating: star })}
                                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${reviewData.rating >= star ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-50 text-slate-300 hover:bg-slate-100'}`}
                                            >
                                                <Star className={`w-6 h-6 ${reviewData.rating >= star ? 'fill-current' : ''}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Your Detailed Feedback</label>
                                    <div className="relative">
                                        <MessageSquare className="absolute left-6 top-6 w-5 h-5 text-slate-300" />
                                        <textarea
                                            placeholder="Tell us about the interview process, company culture, or overall experience..."
                                            className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-6 pl-14 min-h-[150px] outline-none focus:border-amber-500/30 transition-all font-bold text-sm text-slate-700 leading-relaxed"
                                            value={reviewData.comment}
                                            onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleSubmitReview}
                                    disabled={submittingReview}
                                    className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-amber-500 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3 group"
                                >
                                    {submittingReview ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Star className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    )}
                                    Submit Feedback
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppliedJobs;
