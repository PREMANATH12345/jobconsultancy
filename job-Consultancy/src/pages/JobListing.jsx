import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, Landmark, Calendar, User, Search, Filter, ArrowRight, Building2, Layout, Users, AlertCircle, ArrowLeft } from 'lucide-react';
import { allService } from '../services/api';
import { slugify, formatIndianNumber } from '../utils/helpers';
import { useLanguage } from '../contexts/LanguageContext';

const JobListing = () => {
    const { t, language } = useLanguage();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const type = searchParams.get('type')?.toLowerCase(); // 'govt' or 'private'
    const sub = searchParams.get('sub')?.toLowerCase();   // 'state', 'central', 'internship', etc.
    const category = searchParams.get('category')?.toLowerCase(); // 'Sales', 'IT', etc.
    const searchRaw = searchParams.get('search')?.toLowerCase() || '';
    const exp = searchParams.get('exp');
    const locParam = searchParams.get('location')?.toLowerCase() || '';

    const [jobs, setJobs] = useState([]);
    const [allJobs, setAllJobs] = useState([]); // Store all approved jobs for fallback
    const [relatedJobs, setRelatedJobs] = useState([]); // Store keyword matches in other locations
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchJobs();
    }, [type, sub, category, searchRaw, exp, locParam]);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const response = await allService.getData('jobs');
            const rawJobs = Array.isArray(response) ? response : (response?.data || []);
            const approvedJobs = rawJobs.filter(job => {
                const statusStr = String(job.status || '').toLowerCase().trim();
                if (statusStr !== 'approved') return false;
                if (String(job.deleted_at) === '1') return false;
                if (!job.job_expiry || job.job_expiry === '0000-00-00 00:00:00') return true;
                try {
                    const expiryDate = new Date(job.job_expiry);
                    if (isNaN(expiryDate.getTime())) return true;
                    return expiryDate > new Date();
                } catch (e) { return true; }
            });

            setAllJobs(approvedJobs);

            let filtered = [...approvedJobs];

            // 1. Handle explicit 'type' filter
            if (type) {
                if (type === 'govt') {
                    filtered = filtered.filter(j => {
                        const cat = String(j.category || '').toLowerCase().trim();
                        return cat === 'government' || cat === 'govt';
                    });
                } else if (type === 'private') {
                    filtered = filtered.filter(j => {
                        const cat = String(j.category || '').toLowerCase().trim();
                        return cat === 'private';
                    });
                }
            }

            // 2. Handle sub-category/type filters
            if (sub) {
                if (type === 'govt') {
                    if (sub !== 'all') {
                        filtered = filtered.filter(j => String(j.govt_type || '').toLowerCase().includes(sub));
                    }
                } else if (type === 'private') {
                    if (sub !== 'all') {
                        filtered = filtered.filter(j => {
                            const jobType = String(j.job_type || '').toLowerCase().replace(/\s/g, '');
                            return jobType.includes(sub.replace(/\s/g, ''));
                        });
                    }
                }
            }

            // 3. Handle explicit 'category' (role) filter
            if (category) {
                filtered = filtered.filter(j => {
                    const jobCat = String(j.job_role_category || '').toLowerCase().trim();
                    if (!jobCat) return false;
                    return jobCat.includes(category) || category.includes(jobCat);
                });
            }

            // 4. Handle Search Query, Experience, and Location
            if (searchRaw || exp || locParam) {
                const searchWords = searchRaw.split(/\s+/).filter(w => w.length > 2);

                filtered = filtered.filter(j => {
                    let match = true;

                    if (searchRaw) {
                        const title = String(j.title || '').toLowerCase();
                        const desc = String(j.description || '').toLowerCase();
                        const comp = String(j.company_name || '').toLowerCase();
                        const skills = String(j.skills || '').toLowerCase();

                        let keywordMatch = title.includes(searchRaw) ||
                            desc.includes(searchRaw) ||
                            comp.includes(searchRaw) ||
                            skills.includes(searchRaw);

                        if (!keywordMatch && searchWords.length > 0) {
                            keywordMatch = searchWords.some(word =>
                                title.includes(word) ||
                                comp.includes(word) ||
                                skills.includes(word)
                            );
                        }

                        if (!keywordMatch) match = false;
                    }

                    if (match && exp) {
                        const jobExpStr = String(j.experience || '0');
                        const jobExpMatch = jobExpStr.match(/\d+/);
                        const jobMinExp = jobExpMatch ? parseInt(jobExpMatch[0]) : 0;
                        const filterExp = parseInt(exp);

                        // If the job's minimum required experience is more than the filter value, hide it
                        if (jobMinExp > filterExp) match = false;
                    }

                    if (match && locParam) {
                        const jobLoc = String(j.location || '').toLowerCase();
                        const jobDist = String(j.district || '').toLowerCase();
                        const locMatch = jobLoc.includes(locParam) || locParam.includes(jobLoc) || jobDist.includes(locParam) || locParam.includes(jobDist);
                        if (!locMatch) match = false;
                    }

                    return match;
                });
            }

            setJobs(filtered);

            // Related Jobs: Match keyword but ignore location/exp if strictly filtered returned nothing
            if (filtered.length === 0 && searchRaw) {
                const searchWords = searchRaw.split(/\s+/).filter(w => w.length > 2);
                const keywordOnly = approvedJobs.filter(j => {
                    const title = String(j.title || '').toLowerCase();
                    const desc = String(j.description || '').toLowerCase();
                    const comp = String(j.company_name || '').toLowerCase();
                    const skills = String(j.skills || '').toLowerCase();
                    
                    let kMatch = title.includes(searchRaw) || desc.includes(searchRaw) || comp.includes(searchRaw) || skills.includes(searchRaw);
                    if (!kMatch && searchWords.length > 0) {
                        kMatch = searchWords.some(word => 
                            title.includes(word) || 
                            comp.includes(word) || 
                            skills.includes(word)
                        );
                    }
                    return kMatch;
                });
                setRelatedJobs(keywordOnly.slice(0, 8));
            } else {
                setRelatedJobs([]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const isGovt = (job) => {
        const cat = String(job.category || '').toLowerCase().trim();
        return cat === 'government' || cat === 'govt';
    };

    const JobCard = ({ job }) => {
        const isGovernment = isGovt(job);
        return (
            <Link
                to={`/job/${slugify(job.title)}-${job.id}`}
                key={job.id}
                style={isGovernment ? { backgroundColor: 'oklch(0.769 0.188 70.08)', borderColor: 'rgba(0,0,0,0.05)' } : {}}
                className={`p-4 md:p-5 rounded-xl md:rounded-2xl shadow-md border-2 transition-all relative overflow-hidden flex flex-col justify-between hover:shadow-xl 
                    ${isGovernment ? '' : 'bg-pink-100 border-pink-400/30 hover:border-pink-500'}`}
            >
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-3 md:mb-4">
                        <div className={`w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center p-2 md:p-2.5 transition-colors border ${isGovernment ? 'border-white/20' : 'border-pink-100'}`}>
                            {isGovernment ? <Landmark className={`w-full h-full text-white`} /> : <Briefcase className={`w-full h-full text-pink-600`} />}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className={`text-[8px] md:text-[10px] font-black px-2 md:py-1 rounded-full capitalize shadow-md ${isGovernment ? 'bg-slate-900 text-white' : 'bg-pink-600 text-white'}`}>
                                {isGovernment ? t('govt') : t('private')}
                            </span>
                            {job.govt_type && <span className={`text-[8px] md:text-[9px] font-black border px-2 py-0.5 md:py-1 rounded-full capitalize shadow-sm ${isGovernment ? 'text-white bg-white/20 border-white/20' : 'text-slate-900 bg-white/50 border-black/5'}`}>{job.govt_type}</span>}
                        </div>
                    </div>

                    <h3 className={`text-[14px] md:text-base font-black uppercase tracking-tight mb-1.5 md:mb-2 transition-colors leading-tight line-clamp-2 ${isGovernment ? 'text-white group-hover:underline' : 'text-black group-hover:text-pink-600'}`}>{job.title}</h3>
                    {isGovernment && (
                        <p className="text-[9px] md:text-[10px] font-black text-white/70 uppercase tracking-widest mb-3 md:mb-4">{job.department || job.sector}</p>
                    )}

                    <div className="space-y-1.5 md:space-y-2 mb-4 md:mb-6">
                        <div className={`flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest ${isGovernment ? 'text-white' : 'text-slate-500'}`}>
                            <MapPin className={`w-2.5 h-2.5 md:w-3 md:h-3 ${isGovernment ? 'text-white' : 'text-pink-500'}`} /> {job.location ? (t(`districtsList.${job.location}`) !== `districtsList.${job.location}` ? t(`districtsList.${job.location}`) : job.location) : (isGovernment ? t('allIndia') : job.sector)}{job.district && job.district.toLowerCase() !== (job.location || '').toLowerCase() ? `, ${t(`districtsList.${job.district}`) !== `districtsList.${job.district}` ? t(`districtsList.${job.district}`) : job.district}` : ''}
                        </div>
                        {!isGovernment ? (
                            <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                <Building2 className="w-2.5 h-2.5 md:w-3 md:h-3 text-pink-500" /> {job.company_name}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-white/70 uppercase tracking-widest">
                                <Users className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" /> {t('vacancy')}: <span className="text-white font-extrabold">{job.vacancy}</span>
                            </div>
                        )}
                        <div className={`flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest ${isGovernment ? 'text-white/40' : 'text-slate-400'}`}>
                            <Layout className={`w-2.5 h-2.5 md:w-3 md:h-3 ${isGovernment ? 'text-white/40' : 'text-pink-200'}`} /> {job.job_role_category}
                        </div>
                    </div>
                </div>

                <div className={`pt-3 md:pt-4 border-t flex items-center justify-between ${isGovernment ? 'border-white/10' : 'border-pink-100'}`}>
                    <div>
                        <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest mb-0.5 ${isGovernment ? 'text-white/60' : 'text-slate-400'}`}>{isGovernment ? t('lastDate') : t('salary')}</p>
                        <p className={`text-[14px] md:text-base font-black ${isGovernment ? 'text-white' : 'text-pink-600'}`}>
                            {isGovernment ? (job.last_date ? new Date(job.last_date).toLocaleDateString('en-GB') : 'N/A') : `₹ ${formatIndianNumber(job.salary_range)}`}
                        </p>
                    </div>
                    <div className={`p-2 md:p-2.5 rounded-lg md:rounded-xl transition-all shadow-sm border ${isGovernment ? 'bg-white text-slate-900 border-white/10' : 'bg-pink-50 text-pink-600 border-pink-100'}`}>
                        <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </div>
                </div>
            </Link>
        );
    };

    return (
        <div className="pt-32 pb-20 px-4 min-h-screen bg-slate-50">
            <div className="max-w-[1536px] mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-primary hover:bg-white rounded-full transition-all mb-8 -ml-4 group w-fit"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> {t('backToHome')}
                </button>

                {/* Result Header - ONLY shown if jobs exist */}
                {!loading && jobs.length > 0 && (
                    <div className="mb-6 md:mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="flex items-start md:items-center gap-3 md:gap-4 w-full md:w-auto">
                            <div className="w-9 h-9 md:w-12 md:h-12 bg-pink-50 rounded-lg md:rounded-2xl flex items-center justify-center shrink-0">
                                <Search className="w-4 h-4 md:w-6 md:h-6 text-pink-500" />
                            </div>
                            <div className="min-w-0 pr-2">
                                <h1 className="text-base md:text-2xl font-black text-slate-900 tracking-tight capitalize leading-tight line-clamp-2">
                                    {searchRaw ? (
                                        <>{t('resultsFor')} "<span className="text-pink-600">{searchRaw}</span>"</>
                                    ) : type ? (
                                        `${t(type)} ${t('opportunities')}`
                                    ) : category ? (
                                        `${category} ${t('opportunities')}`
                                    ) : (
                                        t('jobsForYou')
                                    )}
                                </h1>
                                {locParam && (
                                    <p className="text-slate-400 text-[9px] md:text-xs font-bold uppercase tracking-widest mt-0.5 truncate flex items-center gap-1.5">
                                        <MapPin className="w-2.5 h-2.5 text-pink-300" /> {t(`districtsList.${locParam.charAt(0).toUpperCase() + locParam.slice(1).toLowerCase()}`) !== `districtsList.${locParam.charAt(0).toUpperCase() + locParam.slice(1).toLowerCase()}` ? t(`districtsList.${locParam.charAt(0).toUpperCase() + locParam.slice(1).toLowerCase()}`) : locParam}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 md:self-center">
                            <div className="px-3.5 md:px-5 py-1.5 md:py-2.5 bg-slate-50 rounded-full border border-slate-100 shadow-sm">
                                <span className="text-[9px] md:text-[11px] font-black text-slate-400 tracking-widest uppercase">{jobs.length} {t('opportunitiesFound')}</span>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="h-64 bg-white rounded-2xl animate-pulse shadow-sm" />
                        ))}
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="space-y-12">
                        {/* ULTRA COMPACT No Results View */}
                        <div className="py-10 px-6 bg-white rounded-[2rem] border border-slate-100 text-center shadow-lg max-w-lg mx-auto border-b-4 border-b-pink-500 animate-in zoom-in-95 duration-500">
                            <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                <AlertCircle className="w-7 h-7 text-pink-500" />
                            </div>

                            <h2 className="text-lg md:text-xl font-black text-slate-900 leading-tight mb-4 capitalize">
                                {t('noResultFound')} '<span className="text-pink-600">
                                    {searchRaw ? searchRaw : (category ? category : (type ? type : ''))}
                                    {locParam ? `, ${locParam}` : ''}
                                </span>'
                            </h2>

                            <p className="text-slate-400 font-semibold text-[13px] max-w-xs mx-auto mb-8 leading-relaxed">
                                {t('searchAdvice')}
                            </p>

                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-[#ed145b] transition-all shadow-xl active:scale-95"
                            >
                                <Search className="w-3.5 h-3.5" />
                                {t('searchNewJobs')}
                            </Link>
                        </div>

                        {/* Fallback Section: Related Jobs or Trending */}
                        {(relatedJobs.length > 0 || allJobs.length > 0) && (
                            <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000 pt-8 border-t border-slate-100">
                                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 px-4 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-xl md:text-3xl font-extrabold text-slate-900 tracking-normal">
                                            {relatedJobs.length > 0 ? (
                                                <>{t('matchInOtherLocations').split(' Other ')[0]} <span className="text-pink-600">Other Locations</span></>
                                            ) : t('browseTrending')}
                                        </h2>
                                        <p className="text-slate-400 text-xs md:text-sm font-medium">
                                            {relatedJobs.length > 0 ? `${t('resultsFor')} "${searchRaw}"` : t('dontMissOpenings')}
                                        </p>
                                    </div>
                                    <Link to="/jobs" className="text-pink-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all underline underline-offset-8 decoration-2 decoration-pink-100">
                                        {t('viewAllOpportunities')} <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                    {relatedJobs.length > 0
                                        ? relatedJobs.map(job => <JobCard key={job.id} job={job} />)
                                        : allJobs.slice(0, 8).map(job => <JobCard key={job.id} job={job} />)
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 animate-in fade-in duration-700">
                        {jobs.map((job) => (
                            <JobCard key={job.id} job={job} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobListing;
