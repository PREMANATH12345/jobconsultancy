
import React, { useState, useEffect, useRef } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight, MessageSquare, Sparkles, User } from 'lucide-react';
import { allService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const ReviewsSection = () => {
    const { t } = useLanguage();
    const [reviews, setReviews] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [touchStart, setTouchStart] = useState(0);
    const [itemsPerView, setItemsPerView] = useState(window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1);
    const carouselRef = useRef(null);

    useEffect(() => {
        const handleResize = () => {
            setItemsPerView(window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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

    const maxIndex = Math.max(0, reviews.length - itemsPerView);

    const nextSlide = () => {
        if (reviews.length <= itemsPerView) return;
        setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    };

    const prevSlide = () => {
        if (reviews.length <= itemsPerView) return;
        setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
    };

    useEffect(() => {
        let interval;
        if (reviews.length > itemsPerView && !isPaused) {
            interval = setInterval(() => {
                nextSlide();
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [reviews.length, itemsPerView, isPaused, nextSlide]);

    const handleTouchStart = (e) => {
        setIsPaused(true);
        setTouchStart(e.touches[0].clientX);
    };

    const handleTouchEnd = (e) => {
        setIsPaused(false);
        if (!touchStart) return;

        const touchEnd = e.changedTouches[0].clientX;
        const distance = touchStart - touchEnd;
        const swipeThreshold = 50; // minimum distance to be considered a swipe

        if (distance > swipeThreshold) {
            nextSlide();
        } else if (distance < -swipeThreshold) {
            prevSlide();
        }
        setTouchStart(0);
    };

    if (loading || reviews.length === 0) return null;

    return (
        <section className="py-8 md:py-12 bg-[#fffff4] overflow-hidden px-4 text-left">
            <div className="max-w-[1400px] mx-auto relative px-4 sm:px-12 lg:px-24">
                {/* Section Header */}
                <div className="text-center mb-6 md:mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-emerald-600 border border-slate-100 shadow-sm mb-6">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t('candidateSuccess')}</span>
                    </div>
                    <h2 className="text-lg md:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-none uppercase italic">
                        {t('voicesOfSuccess').split('Success')[0]} <span className="text-emerald-600 italic">{t('voicesOfSuccess').includes('Success') ? 'Success' : 'வெற்றி'}</span>
                    </h2>
                    <p className="mt-4 text-slate-500 font-bold text-sm md:text-lg lowercase max-w-2xl mx-auto leading-relaxed">
                        {t('reviewsSubtitle')}
                    </p>
                </div>

                <div className="relative group">
                    {reviews.length > itemsPerView && itemsPerView > 1 && (
                        <>
                            <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 -left-4 sm:-left-12 z-20">
                                <button
                                    onClick={prevSlide}
                                    className="w-14 h-14 rounded-2xl bg-white shadow-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:scale-110 active:scale-95 transition-all outline-none"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-4 sm:-right-12 z-20">
                                <button
                                    onClick={nextSlide}
                                    className="w-14 h-14 rounded-2xl bg-white shadow-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:scale-110 active:scale-95 transition-all outline-none"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </div>
                        </>
                    )}

                    <div 
                        className="overflow-hidden py-10 relative px-4"
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div
                            className="flex transition-transform duration-700 ease-in-out"
                            style={{ 
                                transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` 
                            }}
                        >
                            {reviews.map((rev, i) => (
                                <div key={i} className="px-3 shrink-0 transition-all duration-500" style={{ width: `${100 / itemsPerView}%` }}>
                                         <div className="bg-white rounded-2xl p-6 md:p-8 lg:p-10 relative overflow-hidden px-4 md:px-6 lg:px-8 group border-2 border-emerald-600/20 flex flex-col h-full hover:border-emerald-600/40 transition-colors shadow-sm max-w-[420px] mx-auto">
                                             <div className="flex items-start justify-between mb-3 md:mb-4 relative z-10">
                                                 <div className="flex items-center gap-2 md:gap-3 text-left">
                                                     <div className="w-10 h-10 md:w-14 md:h-14 bg-slate-100 rounded-xl flex items-center justify-center text-white border-2 border-white shadow-md overflow-hidden shrink-0">
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
                                                <p className="text-slate-600 font-bold text-[13px] md:text-sm leading-relaxed mb-4">
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

                                            <Quote className="absolute -bottom-4 -right-4 w-16 h-16 text-slate-50/50 group-hover:text-emerald-600/5 transition-opacity pointer-events-none" />
                                        </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {reviews.length > itemsPerView && itemsPerView > 1 && (
                        <div className="hidden md:flex justify-center gap-3 mt-8">
                            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
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
