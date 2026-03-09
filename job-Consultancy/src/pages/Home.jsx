
import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Briefcase, Users, CheckCircle, Search, TrendingUp, Sparkles, MapPin, Landmark, Globe, Award, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { allService } from '../services/api';
import { slugify, formatIndianNumber } from '../utils/helpers';

import DistrictsSection from '../components/DistrictsSection';
import ReviewsSection from '../components/ReviewsSection';

gsap.registerPlugin(ScrollTrigger);

const CounterAnimated = ({ end, suffix = "", decimals = 0 }) => {
    const [count, setCount] = useState(0);
    const elementRef = useRef(null);

    useEffect(() => {
        let ctx = gsap.context(() => {
            gsap.to({ val: 0 }, {
                val: end,
                duration: 2.5,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: elementRef.current,
                    start: "top 90%",
                    end: "bottom 10%",
                    toggleActions: "restart none restart none",
                },
                onUpdate: function () {
                    setCount(this.targets()[0].val);
                }
            });
        }, elementRef);
        return () => ctx.revert();
    }, [end]);

    return (
        <span ref={elementRef}>
            {count.toLocaleString(undefined, {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            })}
            {suffix}
        </span>
    );
};

const Home = () => {
    const containerRef = useRef(null);
    const { t, language } = useLanguage();
    const [jobs, setJobs] = useState([]);
    const isTamil = language === 'ta';

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                // Fetch all jobs and filter manually to avoid backend casing issues
                const response = await allService.getData('jobs');
                const rawJobs = Array.isArray(response) ? response : (response?.data || []);
                const validJobs = rawJobs.filter(job => {
                    const statusStr = String(job.status || '').toLowerCase().trim();
                    if (statusStr !== 'approved') return false;

                    // Filter out soft-deleted jobs (only if explicitly 1)
                    if (String(job.deleted_at) === '1') return false;

                    // Filter expiry
                    if (!job.job_expiry || job.job_expiry === '0000-00-00 00:00:00') return true;
                    try {
                        const expiryDate = new Date(job.job_expiry);
                        if (isNaN(expiryDate.getTime())) return true;
                        return expiryDate > new Date();
                    } catch (e) { return true; }
                });
                setJobs(validJobs);
            } catch (error) {
                console.error("Error fetching jobs:", error);
            }
        };
        fetchJobs();
    }, []);

    useEffect(() => {
        let ctx = gsap.context(() => {
            const isDesktop = window.innerWidth >= 1024;

            if (isDesktop) {
                const sections = gsap.utils.toArray('.reveal-section');
                sections.forEach((section, i) => {
                    gsap.fromTo(section,
                        {
                            y: 50,
                            opacity: 0,
                        },
                        {
                            y: 0,
                            opacity: 1,
                            duration: 1,
                            ease: 'power3.out',
                            scrollTrigger: {
                                trigger: section,
                                start: 'top 90%',
                                end: 'top 20%',
                                toggleActions: 'play none none reverse',
                            }
                        }
                    );
                });

                gsap.from('.hero-text-content', {
                    y: 50,
                    opacity: 0,
                    duration: 1.2,
                    stagger: 0.2,
                    ease: 'power3.out'
                });
            }
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="page-container bg-[#fffff4]">
            {/* Hero Section */}
            <section className="relative min-h-[90vh] lg:min-h-screen flex items-center pt-24 lg:pt-32 overflow-hidden px-4 mb-2 md:mb-4">
                {/* Fixed Background Layer with stable blur */}
                <div 
                    className="absolute inset-0 z-0 bg-[url('/herobg-mobile.png')] md:bg-[url('/herobg.png')] bg-cover bg-center bg-no-repeat scale-105"
                    style={{ filter: 'blur(2.5px) brightness(0.9)' }}
                ></div>
                <div className="absolute inset-0 bg-black/20 z-0 pointer-events-none"></div>

                <div className="max-w-[1536px] mx-auto relative z-10 w-full px-4 md:px-8">
                    <div className="max-w-4xl space-y-6 md:space-y-10 hero-text-content [text-shadow:_0_4px_12px_rgba(0,0,0,0.8)]">
                        {/* Tagline / Label */}
                        <div className="inline-flex items-center space-x-2 md:space-x-3 bg-slate-900/60 backdrop-blur-md px-4 md:px-5 py-2 md:py-2.5 rounded-full border border-white/10 shadow-lg">
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-amber-500 rounded-full animate-pulse" />
                            <span className="text-white font-bold text-[10px] md:text-sm tracking-wider uppercase">
                                {t('jobPortalTagline')}
                            </span>
                        </div>

                        {/* Title */}
                        <h1 className={`text-2xl md:text-4xl ${isTamil ? 'lg:text-4xl' : 'lg:text-6xl'} font-black leading-[1.2] md:leading-[1.1] text-white tracking-tight drop-shadow-lg`}>
                            {t('heroTitle').split(',')[0]} <br />
                            <span className="text-amber-500">{t('heroTitle').split(',')[1]}</span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-base md:text-xl lg:text-2xl text-white max-w-2xl leading-relaxed font-bold">
                            {t('heroSubtitle')}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 md:gap-5 pt-4 md:pt-6">
                            <Link
                                to="/employee-register"
                                className={`group bg-white text-slate-900 ${isTamil ? 'px-6 md:px-8 py-3 md:py-3.5 text-[10px] md:text-xs' : 'px-7 md:px-9 py-3 md:py-4 text-[10px] md:text-sm'} rounded-full font-black uppercase tracking-widest flex items-center justify-center gap-2 md:gap-3 shadow-2xl hover:bg-amber-500 hover:text-white transition-all duration-300`}
                            >
                                {t('findJobs')}
                                <div className="w-5 h-5 md:w-7 md:h-7 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:bg-white group-hover:text-amber-500 transition-all">
                                    <ArrowRight className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
                                </div>
                            </Link>
                            <Link
                                to="/employer-register"
                                className={`bg-slate-900/60 text-white border-2 border-white/30 ${isTamil ? 'px-6 md:px-8 py-3 md:py-3.5 text-[10px] md:text-xs' : 'px-7 md:px-9 py-3 md:py-4 text-[10px] md:text-sm'} rounded-full font-black uppercase tracking-widest flex items-center justify-center gap-2 md:gap-3 hover:bg-white hover:text-amber-500 transition-all backdrop-blur-sm`}
                            >
                                {t('hireTalent')}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section: Contents Left, Image Right (Desktop) | Image Top, Row Stats (Mobile) */}
            <div className="max-w-[1536px] mx-auto px-4 mt-4 sm:mt-8 md:mt-12 mb-6 md:mb-8 reveal-section">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-20">

                    {/* Image: Top on Mobile, Right on Desktop */}
                    <div className="w-full lg:w-1/2 flex justify-center order-1 lg:order-2">
                        <img
                            src="/secondsectionimage.png"
                            alt="Professional"
                            className="w-full h-auto max-w-[350px] sm:max-w-[450px] lg:max-w-[650px] mx-auto object-contain transform scale-105 lg:scale-110 hover:scale-[1.15] transition-all duration-700"
                        />
                    </div>

                    {/* Stats Group: Below Image on Mobile, Left on Desktop */}
                    <div className="w-full lg:w-1/2 order-2 lg:order-1 lg:mt-32">
                        {/* Mobile Optimized Stats Row */}
                        <div className="lg:hidden grid grid-cols-4 gap-0.5 w-full max-w-[360px] mx-auto border-t border-slate-100 pt-4 mt-0">
                            <div className="text-center px-0.5 border-r border-slate-100">
                                <h3 className="text-xs sm:text-base font-black text-slate-900 leading-none">
                                    <CounterAnimated end={120} suffix="k+" />
                                </h3>
                                <p className="text-[5px] sm:text-[8px] font-bold text-amber-600 uppercase mt-1 leading-tight tracking-tighter whitespace-nowrap">{t('activeJobs').split(' ')[0]}</p>
                            </div>
                            <div className="text-center px-0.5 border-r border-slate-100">
                                <h3 className="text-xs sm:text-base font-black text-slate-900 leading-none">
                                    <CounterAnimated end={14} suffix="k+" />
                                </h3>
                                <p className="text-[5px] sm:text-[8px] font-bold text-amber-600 uppercase mt-1 leading-tight tracking-tighter whitespace-nowrap">{t('placements')}</p>
                            </div>
                            <div className="text-center px-0.5 border-r border-slate-100">
                                <h3 className="text-xs sm:text-base font-black text-slate-900 leading-none">
                                    <CounterAnimated end={1.2} suffix="k+" decimals={1} />
                                </h3>
                                <p className="text-[5px] sm:text-[8px] font-bold text-amber-600 uppercase mt-1 leading-tight tracking-tighter whitespace-nowrap">{t('companies')}</p>
                            </div>
                            <div className="text-center px-0.5">
                                <h3 className="text-xs sm:text-base font-black text-slate-900 leading-none">
                                    <CounterAnimated end={10} suffix="+" />
                                </h3>
                                <p className="text-[5px] sm:text-[8px] font-bold text-amber-600 uppercase mt-1 leading-tight tracking-tighter whitespace-nowrap">YRS EXP</p>
                            </div>
                        </div>

                        {/* Desktop Stats (2x2 Grid of Cards) */}
                        <div className="hidden lg:grid grid-cols-2 gap-3 xl:gap-4">
                            <div className="bg-white p-5 xl:p-6 rounded-[1.5rem] xl:rounded-[2rem] shadow-lg shadow-slate-200/50 border border-slate-100 hover:scale-105 transition-all duration-300 group text-center">
                                <h3 className="text-2xl xl:text-3xl font-black text-slate-900 mb-1 leading-none">
                                    <CounterAnimated end={120} suffix="k+" />
                                </h3>
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest group-hover:tracking-widest transition-all">{t('activeJobs')}</p>
                            </div>
                            <div className="bg-white p-5 xl:p-6 rounded-[1.5rem] xl:rounded-[2rem] shadow-lg shadow-slate-200/50 border border-slate-100 hover:scale-105 transition-all duration-300 group text-center">
                                <h3 className="text-2xl xl:text-3xl font-black text-slate-900 mb-1 leading-none">
                                    <CounterAnimated end={14} suffix="k+" />
                                </h3>
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest group-hover:tracking-widest transition-all">{t('placements')}</p>
                            </div>
                            <div className="bg-white p-5 xl:p-6 rounded-[1.5rem] xl:rounded-[2rem] shadow-lg shadow-slate-200/50 border border-slate-100 hover:scale-105 transition-all duration-300 group text-center">
                                <h3 className="text-2xl xl:text-3xl font-black text-slate-900 mb-1 leading-none">
                                    <CounterAnimated end={1.2} suffix="k+" decimals={1} />
                                </h3>
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest group-hover:tracking-widest transition-all">{t('companies')}</p>
                            </div>
                            <div className="bg-white p-5 xl:p-6 rounded-[1.5rem] xl:rounded-[2rem] shadow-lg shadow-slate-200/50 border border-slate-100 hover:scale-105 transition-all duration-300 group text-center">
                                <h3 className="text-2xl xl:text-3xl font-black text-slate-900 mb-1 leading-none">
                                    <CounterAnimated end={10} suffix=" Yrs+" />
                                </h3>
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest group-hover:tracking-widest transition-all">{t('experience')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Jobs by Category Section */}
            <section className="py-6 md:py-12 reveal-section px-4">
                <div className="max-w-[1536px] mx-auto">
                    {/* Header: Back to full width position */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-8 md:mb-10 gap-6">
                        <div>
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 flex flex-wrap items-center gap-3 md:gap-4">
                                <Sparkles className="w-5 h-5 md:w-8 md:h-8 text-amber-500 shrink-0" />
                                <span>{t('jobsByCategory').includes('Category') ? (
                                    <>{t('jobsByCategory').split('Category')[0]} <span className="text-amber-500">Category</span></>
                                ) : t('jobsByCategory').includes('வேலைகள்') ? (
                                    <>{t('jobsByCategory').split('வேலைகள்')[0]} <span className="text-amber-500">வேலைகள்</span></>
                                ) : t('jobsByCategory')}</span>
                            </h2>
                            <p className="text-slate-400 font-medium mt-2 text-sm md:text-base">{t('recruitmentMadeEasy')}</p>
                        </div>
                        <Link to="/jobs" className="text-amber-500 font-bold text-[11px] md:text-sm tracking-widest uppercase hover:underline hover:text-amber-500 transition-colors shrink-0">{t('allCategories')} →</Link>
                    </div>

                    <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
                        {/* Left Side: Image (Bigger in Desktop) */}
                        <div className="w-full lg:w-[48%] flex justify-center">
                            <img
                                src="/jobbycategoryimg.png"
                                alt="Jobs by Category"
                                className="w-full h-auto object-contain transition-transform hover:scale-[1.02] duration-500"
                            />
                        </div>

                        {/* Right Side: Horizontal Scroll (Mobile) / Grid (Desktop) */}
                        <div className="w-full lg:w-[52%]">
                            <div className="flex lg:grid lg:grid-cols-3 gap-3 md:gap-5 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 snap-x snap-mandatory -mx-4 lg:mx-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] whitespace-nowrap lg:whitespace-normal">
                                {[
                                    { name: t('categories.administrative'), icon: '/administrativeicon.png', key: 'Administrative' },
                                    { name: t('categories.it'), icon: '/ITicon.png', key: 'IT / Telecom' },
                                    { name: t('categories.labour'), icon: '/labor.png', key: 'Labour & Helper' },
                                    { name: t('categories.marketing'), icon: '/marketing.png', key: 'Marketing' },
                                    { name: t('categories.medical'), icon: '/medicalicon.png', key: 'Medical' },
                                    { name: t('categories.office'), icon: '/officestafficon.png', key: 'Office Staff' },
                                    { name: t('categories.sales'), icon: '/salesicon.png', key: 'Sales' },
                                    { name: t('categories.technician'), icon: '/technician.png', key: 'Technician' },
                                ].map((cat, i) => {
                                    const count = jobs.filter(j => {
                                        const jobCat = j.job_role_category?.toLowerCase().trim();
                                        if (!jobCat) return false;
                                        return jobCat.includes(cat.key.toLowerCase()) || cat.key.toLowerCase().includes(jobCat);
                                    }).length;
                                    return (
                                        <Link to={`/jobs?category=${cat.key}`} key={i} className="first:ml-4 lg:first:ml-0 last:mr-4 lg:last:mr-0 min-w-[130px] sm:min-w-[170px] lg:min-w-0 shrink-0 snap-start lg:snap-align-none bg-amber-50 border border-amber-100 hover:border-amber-500 hover:bg-amber-100/50 transition-all rounded-xl md:rounded-2xl p-3 md:p-4 text-center cursor-pointer group shadow-sm hover:shadow-md">
                                            <div className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 bg-white rounded-lg md:rounded-xl flex items-center justify-center p-1.5 md:p-2 group-hover:bg-white group-hover:scale-110 transition-all shadow-sm border border-amber-50">
                                                <img src={cat.icon} alt={cat.name} className="w-full h-full object-contain" />
                                            </div>
                                            <h3 className="font-bold text-slate-900 text-[8px] sm:text-[10px] md:text-sm mb-0.5 group-hover:text-amber-600 transition-colors uppercase tracking-tight line-clamp-1">{cat.name}</h3>
                                            <p className="text-[6px] md:text-[8px] text-slate-400 font-black md:font-bold uppercase tracking-widest">{count} {t('jobsAvailable')}</p>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </section >

            <DistrictsSection />

            {/* Dynamic Job Listings */}
            <section className="py-8 md:py-12 reveal-section px-4">
                <div className="max-w-[1536px] mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 md:mb-8 gap-6">
                        <div className="space-y-4">
                            <div className="text-amber-500 font-bold text-sm uppercase tracking-widest">{t('opportunities')}</div>
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 flex flex-wrap items-center gap-2 md:gap-4">
                                <TrendingUp className="w-6 h-6 md:w-10 md:h-10 text-amber-500 shrink-0" />
                                <span>{t('jobsForYou').split(' ')[0]} <span className="text-amber-500">{t('jobsForYou').split(' ').slice(1).join(' ')}</span></span>
                            </h2>
                        </div>
                        <div className="flex gap-4">
                            <Link to="/jobs?type=private" className="bg-white border border-slate-200 text-slate-900 px-8 py-3 rounded-full font-bold text-sm tracking-widest uppercase hover:bg-slate-50 transition-all shadow-sm">
                                Private
                            </Link>
                            {/* 
                            <Link to="/jobs?type=govt" className="bg-amber-500 text-white px-8 py-3 rounded-full font-bold text-sm tracking-widest uppercase hover:bg-amber-500/90 transition-all shadow-lg shadow-amber-500/20">
                                Government
                            </Link>
                            */}
                        </div>
                    </div>

                    {/* Government Jobs Section hidden for now */}
                    {/* 
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-2 h-8 bg-amber-500 rounded-full" />
                            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                                <Landmark className="w-7 h-7 text-amber-500" />
                                Latest <span className="text-amber-500">Government Openings</span>
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
                            {jobs.filter(j => {
                                const cat = j.category?.toLowerCase().trim();
                                return cat === 'government' || cat === 'govt';
                            }).slice(0, 8).map((job) => (
                                <Link to={`/job/${slugify(job.title)}-${job.id}`} key={job.id}
                                    className="p-5 rounded-2xl border-2 transition-all group cursor-pointer relative overflow-hidden shadow-md hover:shadow-xl"
                                    style={{ backgroundColor: 'oklch(0.769 0.188 70.08)', borderColor: 'rgba(0,0,0,0.05)' }}>
                                    <div className="absolute top-0 right-0 bg-slate-900 text-white px-4 py-2 rounded-bl-xl font-bold text-[11px] capitalize tracking-tight shadow-md">
                                        {job.govt_type || 'Government Job'}
                                    </div>
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4 shadow-sm border border-white/20 group-hover:bg-white transition-colors overflow-hidden p-1">
                                        <img src="/govjoblogo.png" alt="Gov Job" className="w-full h-full object-contain" />
                                    </div>
                                    <h3 className="text-base font-black text-white mb-1 leading-tight group-hover:underline transition-colors line-clamp-2">{job.title}</h3>
                                    <p className="text-[9px] font-black text-white/80 mb-4 uppercase tracking-widest">{job.department || job.sector}</p>
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wide">
                                            <span className="text-white/70 font-bold">Vacancies</span>
                                            <span className="text-white font-extrabold">{job.vacancy}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wide">
                                            <span className="text-white/70 font-bold">Last Date</span>
                                            <span className="text-white font-extrabold">{job.last_date ? new Date(job.last_date).toLocaleDateString('en-GB') : 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                        <span className="text-[9px] font-black text-white uppercase tracking-widest">Apply Online</span>
                                        <div className="w-8 h-8 rounded-lg bg-white text-slate-900 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm border border-white/10">
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <div className="flex justify-center">
                            <Link to="/jobs?type=govt" className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-amber-500 transition-all active:scale-95 flex items-center gap-4">
                                View All Government Jobs <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                    */}

                    {/* Private Jobs Section - AMBER THEME */}
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-2 h-8 bg-amber-500 rounded-full" />
                            <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                                <Briefcase className="w-6 h-6 md:w-7 md:h-7 text-amber-500" />
                                Featured <span className="text-amber-500">Private Jobs</span>
                            </h3>
                        </div>

                        <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-12">
                            {/* Left Side: Image */}
                            <div className="w-full lg:w-[35%] flex justify-center order-1">
                                <img 
                                    src="/privatyejobimage.png" 
                                    alt="Featured Private Jobs" 
                                    className="w-full h-auto object-contain transform lg:scale-105" 
                                />
                            </div>

                            {/* Right Side: 6 Cards in 3 columns */}
                            <div className="w-full lg:w-[65%] order-2 overflow-hidden px-1">
                                <div className="flex lg:grid lg:grid-cols-3 sm:grid-cols-2 gap-3 md:gap-3.5 overflow-x-auto lg:overflow-visible pb-6 lg:pb-0 no-scrollbar">
                                    {jobs.filter(j => {
                                        const cat = j.category?.toLowerCase().trim();
                                        return cat === 'private' || (!cat && !j.govt_type);
                                    }).slice(0, 6).map((job) => (
                                        <Link
                                            to={`/job/${slugify(job.title)}-${job.id}`}
                                            key={job.id}
                                            className="min-w-[240px] lg:min-w-0 bg-amber-100 p-3 lg:p-3.5 group cursor-pointer border-2 border-amber-400/30 hover:border-amber-600 transition-all rounded-2xl relative shadow-md hover:shadow-xl"
                                        >
                                            <div className="flex justify-between items-start mb-2 md:mb-3">
                                                <div className="w-8 h-8 md:w-9 md:h-9 bg-white rounded-xl flex items-center justify-center transition-colors border border-amber-50 group-hover:bg-white shadow-sm overflow-hidden p-1.5">
                                                    <img src="/privatejoblogo.png" alt="Private Job" className="w-full h-full object-contain" />
                                                </div>
                                                <span className="text-[7px] md:text-[8px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                                                    {job.job_type && job.job_type !== '-' ? job.job_type : 'Not Specified'}
                                                </span>
                                            </div>
                                            <h3 className="text-[13px] md:text-[15px] font-black text-slate-900 mb-0.5 group-hover:text-amber-600 transition-colors uppercase tracking-tight line-clamp-1">{job.title}</h3>
                                            <p className="text-[10px] md:text-[12px] font-bold text-slate-400 mb-2 md:mb-2">{job.company_name}</p>

                                            <div className="grid grid-cols-2 gap-y-2 gap-x-2 mb-3">
                                                <div className="flex items-center gap-1.5 text-slate-500 col-span-2">
                                                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                                                    <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest">{t(`districtsList.${job.location}`) !== `districtsList.${job.location}` ? t(`districtsList.${job.location}`) : job.location}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-500">
                                                    <Briefcase className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-tight truncate">{job.experience && job.experience !== '-' ? job.experience : 'Not Specified'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-500">
                                                    <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-tight truncate">{job.shift && job.shift !== '-' ? job.shift : 'Not Specified'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-500">
                                                    <Globe className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                                                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-tight truncate">{job.work_mode && job.work_mode !== '-' ? job.work_mode : 'Not Specified'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-500">
                                                    <Award className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-tight truncate">{job.qualification && job.qualification !== '-' ? job.qualification : 'Not Specified'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between pt-3 border-t border-amber-100">
                                                <div>
                                                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-0.5">{t('salary')}</p>
                                                    <p className="text-sm md:text-base font-black text-amber-600">₹ {formatIndianNumber(job.salary_range)}</p>
                                                </div>
                                                <div className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm border border-amber-100 flex items-center justify-center">
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center mt-4 md:mt-6">
                            <Link to="/jobs?type=private" className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-amber-600 transition-all active:scale-95 flex items-center gap-4">
                                View All Private Jobs <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>

                    {jobs.length === 0 && (
                        <div className="col-span-full py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
                            <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No listings available</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Simple Process */}
            < section className="py-8 md:py-12 bg-[#fffff4] reveal-section px-4" >
                <div className="max-w-[1536px] mx-auto">
                    <div className="text-center mb-6 md:mb-10">
                        <h2 className="text-xl md:text-3xl font-extrabold text-slate-900 flex items-center justify-center gap-3 md:gap-4">
                            <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-amber-500" />
                            {t('hiringMadeEasy').split(' ')[0]} <span className="text-amber-500">{t('hiringMadeEasy').split(' ').slice(1).join(' ')}</span>
                        </h2>
                    </div>
                    <div className="flex lg:grid lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 pb-6 md:pb-0 overflow-x-auto lg:overflow-visible no-scrollbar snap-x snap-mandatory -mx-4 px-4 lg:mx-0 lg:px-0">
                        {/* Note: the steps n, t, d remain the same, just adding min-width for mobile scroll */}
                        {[
                            { n: '01', t: t('register'), d: t('registerDesc') },
                            { n: '02', t: t('verified'), d: t('verifiedDesc') },
                            { n: '03', t: t('interview'), d: t('interviewDesc') },
                            { n: '04', t: t('hired'), d: t('hiredDesc') }
                        ].map((step, i) => (
                            <div key={i} className="min-w-[280px] sm:min-w-[320px] lg:min-w-0 w-full bg-amber-50 border-2 border-amber-200 hover:border-amber-500 hover:bg-amber-100 p-5 md:p-6 lg:p-7 rounded-2xl md:rounded-[2rem] shadow-sm hover:shadow-md relative overflow-hidden group transition-all min-h-[160px] md:min-h-[180px] snap-center">
                                <div className="text-3xl md:text-6xl font-black text-amber-500/10 absolute top-4 right-6 group-hover:text-amber-500/20 transition-colors z-0 pointer-events-none">
                                    {step.n}
                                </div>
                                <div className="relative z-10 space-y-2 md:space-y-3">
                                    <div className="w-8 h-8 md:w-12 md:h-12 bg-white rounded-lg md:rounded-xl flex items-center justify-center text-amber-500 shadow-sm group-hover:bg-amber-500 group-hover:text-white transition-all border border-amber-200">
                                        {i === 0 ? <Users className="w-4 h-4 md:w-6 h-6" /> : i === 1 ? <CheckCircle className="w-4 h-4 md:w-6 h-6" /> : i === 2 ? <Briefcase className="w-4 h-4 md:w-6 h-6" /> : <Sparkles className="w-4 h-4 md:w-6 h-6" />}
                                    </div>
                                    <h4 className="text-[13px] md:text-xl font-bold text-slate-900">{step.t}</h4>
                                    <p className="text-slate-500 text-[9px] md:text-sm font-medium leading-relaxed">{step.d}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section >

            <ReviewsSection />

            {/* Simple CTA - AMBER THEME */}
            <section className="py-8 md:py-12 px-4">
                <div className="max-w-4xl mx-auto bg-amber-50 rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 lg:p-14 text-center relative overflow-hidden shadow-md border border-amber-200">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <div className="relative z-10 px-2 lg:px-0">
                        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 mb-4 md:mb-6 tracking-tight leading-none uppercase">{t('readyToBegin')}</h2>
                        <p className="text-slate-500 text-[13px] md:text-lg max-w-2xl mx-auto mb-8 md:mb-12 font-bold leading-relaxed">
                            {t('ctaDesc')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                            <Link to="/employee-register" className="bg-white text-amber-500 px-7 py-3 md:px-8 md:py-3.5 rounded-xl font-bold text-sm shadow-xl hover:scale-105 transition-transform">
                                {t('joinAsSeeker')}
                            </Link>
                            <Link to="/employer-register" className="bg-slate-900 text-white px-7 py-3 md:px-8 md:py-3.5 rounded-xl font-bold text-sm shadow-xl hover:bg-black transition-all">
                                {t('joinAsCompany')}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div >
    );
};

export default Home;