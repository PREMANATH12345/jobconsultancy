
import React, { useState, useEffect, useRef } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight, MessageSquare, Sparkles, User } from 'lucide-react';
import { allService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const ReviewsSection = () => {
    const { t } = useLanguage();
    const [reviews, setReviews] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const carouselRef = useRef(null);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const data = await allService.getData('reviews');
                if (Array.isArray(data)) {
                    const filteredData = data.filter(r => r.status !== 'hidden');

                    const enriched = await Promise.all(
                        filteredData.map(async (rev) => {
                            try {
                                const userData = await allService.getData('users', { id: rev.user_id });
                                const candidateUser = userData && userData[0] ? userData[0] : null;

                                const jobData = await allService.getData('jobs', { id: rev.job_id });
                                const job = jobData && jobData[0] ? jobData[0] : null;

                                let employerName = 'Verified Company';
                                if (job?.employer_id) {
                                    const empData = await allService.getData('users', { id: job.employer_id });
                                    if (empData && empData[0]) {
                                        employerName = empData[0].name;
                                    }
                                }

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
                                    } catch (e) { }
                                }

                                return {
                                    ...rev,
                                    user_name: candidateUser ? candidateUser.name : 'Verified Candidate',
                                    user_photo: photoUrl,
                                    job_title: job ? job.title : 'Professional Role',
                                    company_name: employerName
                                };
                            } catch (e) {
                                return { ...rev, user_name: 'Verified Candidate', user_photo: null };
                            }
                        })
                    );
                    setReviews(enriched);
                }
            } catch (error) {
                console.error("Failed to fetch reviews:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, []);

    const nextSlide = () => {
        if (reviews.length <= 3) return;
        const totalPages = Math.ceil(reviews.length / 3);
        setCurrentIndex((prev) => (prev + 1 >= totalPages ? 0 : prev + 1));
    };

    const prevSlide = () => {
        if (reviews.length <= 3) return;
        const totalPages = Math.ceil(reviews.length / 3);
        setCurrentIndex((prev) => (prev - 1 < 0 ? totalPages - 1 : prev - 1));
    };

    if (loading || reviews.length === 0) return null;

    return (
        <section className="py-12 md:py-24 bg-slate-50 overflow-hidden reveal-section px-4 text-left">
            <div className="max-w-[1536px] mx-auto relative px-4 sm:px-12 lg:px-24">
                {/* Section Header */}
                <div className="text-center mb-10 md:mb-20">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-emerald-600 border border-slate-100 shadow-sm mb-6">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t('candidateSuccess')}</span>
                    </div>
                    <h2 className="text-xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-none uppercase italic">
                        {t('voicesOfSuccess').split('Success')[0]} <span className="text-emerald-600 italic">{t('voicesOfSuccess').includes('Success') ? 'Success' : 'வெற்றி'}</span>
                    </h2>
                    <p className="mt-4 text-slate-500 font-bold text-sm md:text-lg lowercase max-w-2xl mx-auto leading-relaxed">
                        {t('reviewsSubtitle')}
                    </p>
                </div>

                <div className="relative group">
                    {reviews.length > 3 && (
                        <>
                            <div className="absolute top-1/2 -translate-y-1/2 -left-4 sm:-left-12 z-20">
                                <button
                                    onClick={prevSlide}
                                    className="w-14 h-14 rounded-2xl bg-white shadow-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:scale-110 active:scale-95 transition-all outline-none"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="absolute top-1/2 -translate-y-1/2 -right-4 sm:-right-12 z-20">
                                <button
                                    onClick={nextSlide}
                                    className="w-14 h-14 rounded-2xl bg-white shadow-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:scale-110 active:scale-95 transition-all outline-none"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </div>
                        </>
                    )}

                    <div className="overflow-x-auto lg:overflow-hidden py-10 no-scrollbar">
                        <div
                            className="flex lg:transition-transform lg:duration-700 lg:ease-in-out"
                            style={{ transform: window.innerWidth >= 1024 ? `translateX(-${currentIndex * 100}%)` : 'none' }}
                        >
                            {Array.from({ length: Math.ceil(reviews.length / 3) }).map((_, groupIdx) => (
                                <div key={groupIdx} className="flex lg:grid lg:grid-cols-3 gap-8 px-4 w-auto lg:w-full shrink-0">
                                    {reviews.slice(groupIdx * 3, groupIdx * 3 + 3).map((rev, i) => (
                                         <div key={i} className="min-w-[280px] lg:min-w-0 flex-1 bg-white rounded-[2rem] p-5 lg:p-8 relative overflow-hidden group border-[3px] border-emerald-600/40 flex flex-col h-full hover:-translate-y-2 transition-all duration-500">
                                             <div className="flex items-start justify-between mb-6 md:mb-8 relative z-10">
                                                 <div className="flex items-center gap-3 md:gap-4 text-left">
                                                     <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-900 rounded-2xl flex items-center justify-center text-white border-4 border-slate-50 shadow-lg overflow-hidden shrink-0">
                                                         <img
                                                             src={rev.user_photo || '/reviewfallback.png'}
                                                             alt={rev.user_name}
                                                             className="w-full h-full object-cover"
                                                             onError={(e) => { e.target.src = '/reviewfallback.png'; }}
                                                         />
                                                     </div>
                                                     <div>
                                                         <h4 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-tight italic leading-tight">{rev.user_name}</h4>
                                                        <div className="flex gap-0.5 mt-2">
                                                            {[...Array(5)].map((_, starIdx) => (
                                                                <Star
                                                                    key={starIdx}
                                                                    className={`w-3 h-3 ${starIdx < rev.rating ? 'text-amber-500 fill-current' : 'text-slate-100'}`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{t('candidate')}</span>
                                            </div>

                                            <div className="flex-1 text-left relative z-10">
                                                <p className="text-slate-600 font-bold text-sm leading-relaxed mb-8">
                                                    "{rev.comment}"
                                                </p>
                                            </div>

                                            <div className="pt-6 border-t border-slate-50 text-left mt-auto relative z-10">
                                                <p className="text-sm font-semibold text-emerald-600 leading-none">
                                                    {t('reviewed')} <span className="text-slate-900">{rev.job_title}</span>
                                                </p>
                                                <p className="text-xs font-medium text-slate-400 mt-1">
                                                    {t('at')} {rev.company_name}
                                                </p>
                                            </div>

                                            <Quote className="absolute -bottom-4 -right-4 w-24 h-24 text-slate-50/50 group-hover:scale-110 group-hover:text-emerald-600/5 transition-all duration-700 pointer-events-none" />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    {reviews.length > 3 && (
                        <div className="flex justify-center gap-3 mt-8">
                            {Array.from({ length: Math.ceil(reviews.length / 3) }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentIndex(i)}
                                    className={`h-2.5 rounded-full transition-all duration-500 ${currentIndex === i ? 'w-10 bg-emerald-600' : 'w-2.5 bg-slate-200'} outline-none`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ReviewsSection;
