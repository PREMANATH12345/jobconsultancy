
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft, Search } from 'lucide-react';
import { TN_DISTRICTS } from '../constants/districts';
import { useLanguage } from '../contexts/LanguageContext';

const AllDistricts = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = React.useState('');

    const filteredDistricts = TN_DISTRICTS.filter(d =>
        d.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#fffff4] pt-32 pb-24 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <button
                            onClick={() => navigate("/")}
                            className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-6 hover:text-emerald-500 transition-all group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            {t('backToHome')}
                        </button>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight uppercase">
                            {t('tamilNadu')} <span className="text-emerald-500">{t('districts')}</span>
                        </h1>
                        <p className="mt-4 text-slate-500 font-bold text-sm uppercase tracking-widest">
                            {TN_DISTRICTS.length} {t('districtsDiscovered')}
                        </p>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder={t('locateDistrict')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-96 pl-14 pr-8 py-5 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-900/5 outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/30 transition-all font-bold text-slate-700"
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                    {filteredDistricts.map((district, index) => (
                        <div
                            key={district}
                            onClick={() => navigate(`/district/${district}`)}
                            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-emerald-100 cursor-pointer transition-all duration-300 group animate-in zoom-in-95"
                            style={{ animationDelay: `${index * 20}ms` }}
                        >
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all border border-slate-50 group-hover:border-emerald-100">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm md:text-base group-hover:text-emerald-600 transition-colors">
                                    {t(`districtsList.${district}`)}
                                </h3>
                                <div className="px-4 py-1.5 rounded-full bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                    {t('exploreJobs')}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredDistricts.length === 0 && (
                    <div className="text-center py-20">
                        <MapPin className="w-20 h-20 text-slate-200 mx-auto mb-6" />
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">{t('noDistrictFound')}</h2>
                        <p className="text-slate-400 font-bold lowercase">{t('noMatchingDistrict')} "{searchTerm}".</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllDistricts;
