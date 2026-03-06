
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, Building2, Landmark } from 'lucide-react';
import { FEATURED_DISTRICTS } from '../constants/districts';

import { useLanguage } from '../contexts/LanguageContext';

const DistrictsSection = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    return (
        <section className="py-10 md:py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-16">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 mb-6">
                            <MapPin className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{t('regionalSearch')}</span>
                        </div>
                        <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">
                            {t('findJobsByDistrict').includes('District') ? (
                                <>Find Jobs by <span className="text-emerald-500">District</span></>
                            ) : t('findJobsByDistrict').includes('மாவட்டம்') ? (
                                <>{t('findJobsByDistrict').split('மாவட்டம்')[0]} <span className="text-emerald-500">மாவட்டம்</span></>
                            ) : t('findJobsByDistrict')}
                        </h2>
                        <p className="mt-6 text-slate-500 font-bold text-lg leading-relaxed">
                            {t('heroSubtitle').includes('Easily') ? 'Explore available opportunities across your preferred districts in Tamil Nadu.' : 'தமிழ்நாட்டில் உங்களுக்கு விருப்பமான மாவட்டங்களில் கிடைக்கும் வாய்ப்புகளை ஆராயுங்கள்.'}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/districts')}
                        className="hidden md:flex group items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-emerald-600 hover:scale-105 shadow-xl shadow-slate-900/10"
                    >
                        {t('viewAllDistricts')}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                    </button>
                </div>

                <div className="flex lg:grid lg:grid-cols-4 gap-4 md:gap-6 overflow-x-auto lg:overflow-visible pb-8 lg:pb-0 no-scrollbar">
                    {FEATURED_DISTRICTS.map((district, index) => (
                        <div
                            key={district.name}
                            onClick={() => navigate(`/district/${district.name}`)}
                            className="min-w-[200px] lg:min-w-0 flex-1 group relative h-56 md:h-64 rounded-[2rem] overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-5"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <img
                                src={district.image}
                                alt={district.name}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent group-hover:via-slate-900/50 transition-all duration-500" />

                            <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2 flex items-center gap-3">
                                    {t(`districtsList.${district.name}`)}
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                </h3>
                                <div className="flex items-center gap-4 text-white/70 text-[10px] font-bold uppercase tracking-widest transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                                    <span className="flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5" /> {t('private')}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Landmark className="w-3.5 h-3.5" /> {t('govt')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Mobile View All Button */}
                <div className="flex md:hidden justify-center mt-10">
                    <button
                        onClick={() => navigate('/districts')}
                        className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-emerald-600 active:scale-95 shadow-xl shadow-slate-900/10"
                    >
                        {t('viewAllDistricts')}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default DistrictsSection;
