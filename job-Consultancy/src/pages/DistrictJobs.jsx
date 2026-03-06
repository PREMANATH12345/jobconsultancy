
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    MapPin,
    Building2,
    Landmark,
    ArrowLeft,
    Briefcase,
    TrendingUp,
    ChevronRight,
    Map
} from 'lucide-react';
import { allService } from '../services/api';
import { FEATURED_DISTRICTS } from '../constants/districts';
import { useLanguage } from '../contexts/LanguageContext';
import { formatIndianNumber } from '../utils/helpers';

const DistrictJobs = () => {
    const { name } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [jobs, setJobs] = useState([]);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('Private'); // Default to Private as requested

    const districtInfo = FEATURED_DISTRICTS.find(d => d.name.toLowerCase() === name.toLowerCase()) || {
        name: name,
        image: "https://images.unsplash.com/photo-1590483734724-383b9f47bbad?q=80&w=1500&auto=format&fit=crop"
    };

    useEffect(() => {
        fetchJobs();
    }, [name]);

    useEffect(() => {
        if (filterType === 'Government') {
            setFilteredJobs(jobs.filter(j => j.category === 'Government'));
        } else {
            setFilteredJobs(jobs.filter(j => j.category === 'Private'));
        }
    }, [filterType, jobs]);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            // Using the district column filter
            const result = await allService.getData('jobs', { district: name, status: 'approved' });
            if (Array.isArray(result)) {
                setJobs(result);
            }
        } catch (error) {
            console.error("Failed to fetch jobs:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Professional Banner */}
            <div className="relative h-[400px] lg:h-[500px] w-full overflow-hidden">
                <img
                    src={districtInfo.image}
                    alt={name}
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-transparent" />

                <div className="absolute inset-0 flex items-center justify-center pt-20">
                    <div className="max-w-7xl w-full px-6 text-center">
                        <button
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 mb-8 hover:bg-white/20 transition-all font-bold text-[10px] uppercase tracking-widest"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {t('changeRegion')}
                        </button>
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-2xl mb-2 rotate-3">
                                <MapPin className="w-6 h-6 md:w-8 md:h-8" />
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter shadow-sm">
                                {t(`districtsList.${name}`)} <span className="text-emerald-400">{t('jobsIn')}</span>
                            </h1>
                            <p className="max-w-xl text-white/80 font-bold text-sm md:text-lg lowercase tracking-wide leading-relaxed">
                                {t('heroSubtitle').includes('Easily')
                                    ? `discovering career opportunities in the heart of ${name}. find your next role today.`
                                    : `${t(`districtsList.${name}`)} மையப்பகுதியில் வேலை வாய்ப்புகளைக் கண்டறிதல். இன்று உங்கள் அடுத்த இடத்தைப் பிடியுங்கள்.`}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-20 relative z-10 pb-24">
                {/* Control Panel */}
                <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] md:rounded-[3rem] p-3 md:p-6 border border-white/20 mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex bg-slate-100 p-2 rounded-[2rem] w-full md:w-auto">
                        <button
                            onClick={() => setFilterType('Private')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 md:gap-3 px-4 md:px-10 py-3.5 md:py-4 rounded-[1.2rem] md:rounded-[1.5rem] font-black text-[9px] md:text-[11px] uppercase tracking-widest transition-all ${filterType === 'Private' ? 'bg-white text-emerald-600 shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            <Building2 className={`w-3.5 h-3.5 md:w-4 md:h-4 ${filterType === 'Private' ? 'animate-bounce' : ''}`} />
                            {t('privateSector')}
                        </button>
                        <button
                            onClick={() => setFilterType('Government')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 md:gap-3 px-4 md:px-10 py-3.5 md:py-4 rounded-[1.2rem] md:rounded-[1.5rem] font-black text-[9px] md:text-[11px] uppercase tracking-widest transition-all ${filterType === 'Government' ? 'bg-white text-amber-600 shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            <Landmark className={`w-3.5 h-3.5 md:w-4 md:h-4 ${filterType === 'Government' ? 'animate-bounce' : ''}`} />
                            {t('govtSector')}
                        </button>
                    </div>

                    <div className="flex items-center gap-4 md:gap-6 px-4 md:px-10 overflow-x-auto w-full md:w-auto no-scrollbar justify-center md:justify-end">
                        <div className="flex flex-col text-center md:text-right shrink-0">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('active')}</span>
                            <span className="text-sm md:text-xl font-black text-slate-900 uppercase tracking-tighter">{filteredJobs.length} {t('vacancy')}</span>
                        </div>
                    </div>
                </div>

                {/* Job Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-[300px] bg-white rounded-2xl animate-pulse border border-slate-100" />
                        ))}
                    </div>
                ) : filteredJobs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {filteredJobs.map((job, index) => (
                            <div
                                key={job.id}
                                onClick={() => navigate(`/job/${job.id}`)}
                                className="group bg-white rounded-2xl p-5 shadow-xl hover:shadow-2xl border border-slate-50 hover:border-emerald-100 transition-all duration-500 cursor-pointer flex flex-col animate-in slide-in-from-bottom-5"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="flex justify-between items-start mb-4 text-slate-400 font-bold text-[9px] uppercase tracking-[0.2em]">
                                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100">
                                        {job.job_type || 'Full Time'}
                                    </span>
                                    <span>#{job.id}</span>
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight mb-2 group-hover:text-emerald-500 transition-colors leading-tight line-clamp-2">
                                        {job.title}
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-50 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-all">
                                                <Building2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500" />
                                            </div>
                                            <span className="font-bold text-[11px] uppercase tracking-wide truncate">{job.company_name || 'Organization'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-50 group-hover:bg-amber-50 group-hover:border-amber-100 transition-all">
                                                <TrendingUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500" />
                                            </div>
                                            <span className="font-bold text-[11px] uppercase tracking-wide truncate">{formatIndianNumber(job.salary_range) || 'Competitive'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-white text-[9px] font-black">
                                            {name.charAt(0)}
                                        </div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{job.location && job.location.toLowerCase() !== name.toLowerCase() ? `${t(`districtsList.${job.location}`) !== `districtsList.${job.location}` ? t(`districtsList.${job.location}`) : job.location}, ` : ''}{t(`districtsList.${name}`) !== `districtsList.${name}` ? t(`districtsList.${name}`) : name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-emerald-500 group-hover:gap-3 transition-all">
                                        <span className="font-black text-[9px] uppercase tracking-widest">{t('applyNow')}</span>
                                        <ChevronRight className="w-3 h-3" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 md:py-32 bg-white rounded-[2rem] md:rounded-[4rem] shadow-xl border border-slate-100 px-6">
                        <div className="w-20 h-20 md:w-32 md:h-32 bg-slate-50 rounded-[2rem] md:rounded-[3rem] flex items-center justify-center mx-auto mb-6 md:mb-10 border border-slate-100 shadow-inner">
                            <Briefcase className="w-8 h-8 md:w-12 md:h-12 text-slate-200" />
                        </div>
                        <h2 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tight mb-4">{t('noResultFound')}</h2>
                        <p className="text-xs md:text-sm text-slate-400 font-bold mb-8 md:mb-10 max-w-md mx-auto leading-relaxed">
                            {t('noMatchingDistrict')} {t(`districtsList.${name}`)}. {t('searchAdvice')}
                        </p>
                        <button
                            onClick={() => navigate('/districts')}
                            className="bg-slate-900 text-white px-8 md:px-12 py-4 md:py-5 rounded-[1.5rem] md:rounded-[2rem] font-black text-[10px] md:text-[11px] uppercase tracking-widest transition-all hover:bg-emerald-600 hover:scale-105 shadow-2xl"
                        >
                            {t('browseOtherDistricts')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DistrictJobs;
