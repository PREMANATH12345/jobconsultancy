
import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { TN_DISTRICTS } from '../constants/districts';
import { allService } from '../services/api';

export const MainSearchBar = ({ compact = false, className = '', isExpandedProp = false, onToggle }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [keyword, setKeyword] = useState('');
    const [experience, setExperience] = useState('');
    const [location, setLocation] = useState('');
    const [error, setError] = useState(false);
    const [showExpDropdown, setShowExpDropdown] = useState(false);
    const [isExpanded, setIsExpanded] = useState(isExpandedProp);
    const [suggestions, setSuggestions] = useState([]);
    const [locSuggestions, setLocSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showLocSuggestions, setShowLocSuggestions] = useState(false);
    const [activeInput, setActiveInput] = useState(null); // 'keyword' or 'location'
    const [dynamicLocations, setDynamicLocations] = useState([]);

    const dropdownRef = useRef(null);
    const containerRef = useRef(null);
    const suggestionsRef = useRef(null);
    const keywordInputRef = useRef(null);
    const locationInputRef = useRef(null);

    // Sync with external state and handle initial focus
    useEffect(() => {
        setIsExpanded(isExpandedProp);
        if (isExpandedProp) {
            const timer = setTimeout(() => {
                if (keywordInputRef.current) keywordInputRef.current.focus();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isExpandedProp]);

    const jobTitles = [
        "Software Developer", "Full Stack Developer", "Frontend Developer",
        "Backend Developer", "Graphic Designer", "Digital Marketing",
        "Sales Executive", "Manager", "Human Resources", "Data Entry",
        "Project Manager", "UI/UX Designer", "Content Writer",
        "Marketing Specialist", "Business Analyst", "Customer Service"
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowExpDropdown(false);
            }
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                if (isExpanded) handleToggle(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isExpanded]);

    const handleToggle = (val) => {
        setIsExpanded(val);
        if (onToggle) onToggle(val);
        if (!val) {
            setShowSuggestions(false);
            setShowExpDropdown(false);
        }
    };

    useEffect(() => {
        if (keyword.trim().length > 0) {
            const filtered = jobTitles.filter(title =>
                title.toLowerCase().includes(keyword.toLowerCase())
            );
            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0 && isExpanded);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [keyword, isExpanded]);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const data = await allService.getData('jobs');
                if (Array.isArray(data)) {
                    const uniqueLocs = new Set();
                    data.forEach(job => {
                        const loc = String(job.location || '').trim();
                        const dist = String(job.district || '').trim();
                        // Only add valid strings that aren't already in TN_DISTRICTS
                        if (loc && loc.length > 2) {
                            const isDistrict = TN_DISTRICTS.some(d => d.toLowerCase() === loc.toLowerCase());
                            if (!isDistrict) {
                                // Capitalize smartly
                                const capitalize = (str) => str.split(' ').map(w => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '').join(' ');
                                const formattedLoc = capitalize(loc);
                                
                                if (dist && dist.length > 2 && dist.toLowerCase() !== loc.toLowerCase()) {
                                    const formattedDist = capitalize(dist);
                                    uniqueLocs.add(`${formattedLoc} - ${formattedDist}`);
                                } else if (dist && dist.length > 0 && dist.toLowerCase() !== loc.toLowerCase()) {
                                    const formattedDist = capitalize(dist);
                                    uniqueLocs.add(`${formattedLoc} - ${formattedDist}`);
                                } else {
                                    uniqueLocs.add(formattedLoc);
                                }
                            }
                        }
                    });
                    setDynamicLocations(Array.from(uniqueLocs).sort());
                }
            } catch (error) {
                console.error("Failed to fetch jobs for location suggestions:", error);
            }
        };
        fetchLocations();
    }, []);

    useEffect(() => {
        const allLocations = [...TN_DISTRICTS, ...dynamicLocations];
        if (location.trim().length > 0) {
            const filtered = allLocations.filter(dist =>
                dist.toLowerCase().includes(location.toLowerCase())
            );
            setLocSuggestions(filtered);
            if (filtered.length > 0 && isExpanded) {
                setShowLocSuggestions(true);
            }
        } else {
            setLocSuggestions(allLocations);
            // Don't auto-show when clearing, let focus handle it
        }
    }, [location, isExpanded, dynamicLocations]);

    const experiences = [
        { label: t('expFresher'), short: t('expFresher').split('(')[0].trim(), value: '0' },
        { label: `1 ${t('expYear')}`, short: `1 ${t('expYear')}`, value: '1' },
        { label: `2 ${t('expYears')}`, short: `2 ${t('expYears')}`, value: '2' },
        { label: `3 ${t('expYears')}`, short: `3 ${t('expYears')}`, value: '3' },
        { label: `4 ${t('expYears')}`, short: `4 ${t('expYears')}`, value: '4' },
        { label: `5 ${t('expYears')}`, short: `5 ${t('expYears')}`, value: '5' },
    ];

    const handleSearch = (e) => {
        if (e) e.stopPropagation();
        if (!keyword.trim()) {
            setError(true);
            return;
        }
        setError(false);
        handleToggle(false);

        let url = `/jobs?search=${encodeURIComponent(keyword)}`;
        if (experience) url += `&exp=${experience}`;
        if (location) {
            const searchLoc = location.split(' - ')[0].trim();
            url += `&location=${encodeURIComponent(searchLoc)}`;
        }

        navigate(url);
    };

    const handleSuggestionClick = (title) => {
        setKeyword(title);
        setError(false);
        setShowSuggestions(false);
    };

    const renderSearchInputs = (mode) => (
        <div className="flex flex-col w-full gap-2 relative">
            <div className={`
                flex flex-col md:flex-row items-stretch md:items-center w-full gap-0
                bg-white rounded-full transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]
                ${mode === 'expanded' ? 'border border-pink-100/50 shadow-2xl' : 'border border-slate-100 shadow-sm'}
                ${error ? 'ring-2 ring-pink-500/20 !border-pink-200 shadow-lg shadow-pink-50' : ''}
            `}>
                {/* Keyword Section */}
                <div className="flex-[1.5] flex items-center px-6 relative h-full bg-transparent border-0 ring-0">
                    <input
                        ref={keywordInputRef}
                        id="keyword-search-desktop"
                        name="keyword-search-desktop"
                        type="text"
                        placeholder={t('searchJob')}
                        value={keyword}
                        autoComplete="new-password"
                        onChange={(e) => {
                            setKeyword(e.target.value);
                            if (e.target.value.trim()) setError(false);
                        }}
                        onFocus={() => {
                            if (suggestions.length > 0) setShowSuggestions(true);
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className={`w-full bg-transparent border-0 !border-none outline-none text-slate-700 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-0 focus:border-0 shadow-none ring-0 focus:ring-offset-0 ${mode === 'expanded' ? 'py-4 text-[14px]' : 'py-5 text-[16px]'}`}
                    />



                    {showSuggestions && (
                        <div
                            ref={suggestionsRef}
                            className="absolute top-full left-0 mt-3 w-full md:w-[400px] bg-white rounded-2xl shadow-2xl border border-slate-50 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[300px] overflow-y-auto"
                        >
                            {suggestions.map((title, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSuggestionClick(title)}
                                    className="w-full px-6 py-2.5 text-left flex items-center gap-3 hover:bg-pink-50/50 transition-colors group"
                                >
                                    <Search className="w-3.5 h-3.5 text-slate-300 group-hover:text-pink-500" />
                                    <span className="text-[14px] font-bold text-slate-600 group-hover:text-pink-700">{title}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="hidden md:flex items-center justify-center shrink-0">
                    <span className="text-slate-200 font-light text-[20px] select-none opacity-50">|</span>
                </div>

                {/* Experience Dropdown */}
                <div className="relative w-full md:w-52 px-4 h-full flex items-center" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setShowExpDropdown(!showExpDropdown); }}
                        className="w-full h-full flex items-center justify-between text-left py-3 px-2 hover:bg-slate-50/50 rounded-xl transition-all border-none outline-none bg-transparent"
                    >
                        <span className={`line-clamp-1 text-[13px] md:text-[14px] font-bold ${experience ? 'text-slate-900' : 'text-slate-400'}`}>
                            {experience ? experiences.find(e => e.value === experience)?.short : t('selectExperience')}
                        </span>
                        <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-500 text-slate-400 ${showExpDropdown ? 'rotate-180 text-pink-500' : ''}`} />
                    </button>

                    {showExpDropdown && (
                        <div className="absolute top-full left-0 mt-3 w-full bg-white rounded-2xl shadow-2xl border border-slate-50 p-2 z-50 animate-in fade-in zoom-in-95 duration-300">
                            {experiences.map((exp) => (
                                <button
                                    key={exp.value}
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setExperience(exp.value === experience ? '' : exp.value);
                                        setShowExpDropdown(false);
                                    }}
                                    className={`w-full px-5 py-3 text-left transition-all flex flex-col rounded-xl hover:bg-pink-50 
                                        ${experience === exp.value ? 'bg-pink-50' : ''}`}
                                >
                                    <span className={`text-[13px] font-bold ${experience === exp.value ? 'text-pink-600' : 'text-slate-600'}`}>
                                        {exp.short}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="hidden md:flex items-center justify-center shrink-0">
                    <span className="text-slate-200 font-light text-[20px] select-none opacity-50">|</span>
                </div>

                {/* Location Section */}
                <div className="flex-1 flex items-center px-6 relative group h-full bg-transparent border-0 ring-0">
                    <input
                        ref={locationInputRef}
                        id="location-search-desktop"
                        name="location-search-desktop"
                        type="text"
                        placeholder={t('searchLocation')}
                        value={location}
                        autoComplete="new-password"
                        onChange={(e) => setLocation(e.target.value)}
                        onFocus={() => {
                            setShowLocSuggestions(true);
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className={`w-full bg-transparent border-0 !border-none outline-none text-slate-700 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-0 focus:border-0 shadow-none ring-0 focus:ring-offset-0 ${mode === 'expanded' ? 'py-4 text-[14px]' : 'py-5 text-[16px]'}`}
                    />

                    {showLocSuggestions && (
                        <div
                            ref={suggestionsRef}
                            className="absolute top-full left-0 mt-3 w-full md:w-[300px] bg-white rounded-2xl shadow-2xl border border-slate-50 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[300px] overflow-y-auto"
                        >
                            {locSuggestions.map((dist, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setLocation(dist);
                                        setShowLocSuggestions(false);
                                    }}
                                    className="w-full px-6 py-2.5 text-left flex items-center gap-3 hover:bg-pink-50/50 transition-colors group"
                                >
                                    <MapPin className="w-3.5 h-3.5 text-slate-300 group-hover:text-pink-500" />
                                    <span className="text-[14px] font-bold text-slate-600 group-hover:text-pink-700">{dist}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pr-1.5 py-1.5 shrink-0">
                    {(keyword || location) && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setKeyword(''); setLocation(''); }}
                            className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-pink-500 hover:bg-slate-50 rounded-full transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                    <button
                        onClick={handleSearch}
                        className="bg-[#ed145b] hover:bg-pink-600 text-white flex items-center justify-center gap-3 font-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-pink-100/50 px-8 py-3.5 rounded-full text-[14px]"
                    >
                        <Search className="w-4 h-4" />
                        {t('findJobs')}
                    </button>
                </div>
            </div>
            {error && (
                <div className="px-6 animate-in fade-in slide-in-from-top-1 duration-300">
                    <p className="text-pink-600 text-[12px] font-bold italic">{t('keywordRequired')}</p>
                </div>
            )}
        </div>
    );

    const renderMobileExpanded = () => (
        <div
            className="flex flex-col gap-6 w-full py-2 animate-in fade-in slide-in-from-top-4 duration-500 outline-none focus:outline-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
        >
            <div className="flex flex-col gap-4">
                {/* Keyword Field */}
                <div className="relative">
                    <div className={`
                        flex items-center rounded-2xl transition-all duration-300 bg-white border-2
                        ${activeInput === 'keyword' ? 'border-slate-200' : (error ? 'border-pink-200 ring-4 ring-pink-500/10' : 'border-slate-100')}
                    `}>
                        <input
                            ref={keywordInputRef}
                            id="mobile-designation-search"
                            name="designation"
                            type="text"
                            placeholder="Enter skills, designations, companies"
                            value={keyword}
                            autoComplete="new-password"
                            onFocus={() => setActiveInput('keyword')}
                            onChange={(e) => {
                                e.stopPropagation();
                                setKeyword(e.target.value);
                                if (e.target.value.trim()) setError(false);
                            }}
                            className="flex-1 bg-transparent border-none text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-medium text-sm py-4.5 px-6 focus:ring-0 shadow-none appearance-none"
                        />
                        {keyword && (
                            <button
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setKeyword(''); }}
                                className="p-4 text-slate-300 hover:text-pink-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    {error && (
                        <div className="mt-1.5 ml-1">
                            <p className="text-pink-600 text-[10px] font-bold">{t('keywordRequired')}</p>
                        </div>
                    )}
                    {showSuggestions && activeInput === 'keyword' && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-[70] animate-in fade-in slide-in-from-top-1 duration-200 max-h-[200px] overflow-y-auto outline-none">
                            {suggestions.map((title, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleSuggestionClick(title);
                                    }}
                                    className="w-full px-5 py-2.5 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors outline-none border-b border-slate-50 last:border-0"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0" />
                                    <span className="text-[13px] font-bold text-slate-700">{title}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Experience Field */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setShowExpDropdown(!showExpDropdown); }}
                        className={`w-full flex items-center justify-between rounded-2xl transition-all duration-300 bg-white border-2 px-6 py-[18px] text-left
                            ${showExpDropdown ? 'border-slate-200' : 'border-slate-100'}`}
                    >
                        <span className={`text-sm font-bold ${experience ? 'text-slate-900' : 'text-slate-400'}`}>
                            {experience ? experiences.find(e => e.value === experience)?.short : t('selectExperience')}
                        </span>
                        <ChevronDown className={`w-5 h-5 transition-transform duration-500 text-slate-400 ${showExpDropdown ? 'rotate-180 text-pink-500' : ''}`} />
                    </button>

                    {showExpDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-[70] animate-in fade-in slide-in-from-top-1 duration-200 max-h-[200px] overflow-y-auto outline-none">
                            {experiences.map((exp) => (
                                <button
                                    key={exp.value}
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setExperience(exp.value === experience ? '' : exp.value);
                                        setShowExpDropdown(false);
                                    }}
                                    className={`w-full px-5 py-3 text-left transition-all flex items-center gap-3 outline-none border-b border-slate-50 last:border-0 hover:bg-slate-50
                                        ${experience === exp.value ? 'bg-pink-50/50' : ''}`}
                                >
                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${experience === exp.value ? 'bg-pink-500' : 'bg-slate-300'}`} />
                                    <span className={`text-[13px] font-bold ${experience === exp.value ? 'text-pink-600' : 'text-slate-700'}`}>
                                        {exp.short}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Location Field */}
                <div className="relative">
                    <div className={`
                        flex items-center rounded-2xl transition-all duration-300 bg-white border-2
                        ${activeInput === 'location' ? 'border-slate-200' : 'border-slate-100'}
                    `}>
                        <input
                            ref={locationInputRef}
                            id="mobile-location-search"
                            name="location"
                            type="text"
                            placeholder={t('searchLocation')}
                            value={location}
                            autoComplete="new-password"
                            onFocus={() => {
                                setActiveInput('location');
                                setShowLocSuggestions(true);
                            }}
                            onChange={(e) => {
                                e.stopPropagation();
                                setLocation(e.target.value);
                            }}
                            className="flex-1 bg-transparent border-none outline-none text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-medium text-sm py-4.5 px-6 focus:ring-0 shadow-none appearance-none"
                        />
                        {location && (
                            <button
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setLocation(''); }}
                                className="p-4 text-slate-300 hover:text-pink-500 outline-none"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    {showLocSuggestions && activeInput === 'location' && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-[70] animate-in fade-in slide-in-from-top-1 duration-200 max-h-[200px] overflow-y-auto outline-none">
                            {locSuggestions.map((dist, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setLocation(dist);
                                        setShowLocSuggestions(false);
                                    }}
                                    className="w-full px-5 py-2.5 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors outline-none border-b border-slate-50 last:border-0"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0" />
                                    <span className="text-[13px] font-bold text-slate-700">{dist}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <button
                onClick={handleSearch}
                className="w-full py-4.5 rounded-2xl bg-[#ed145b] text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-pink-200/50 hover:bg-pink-600 active:scale-95 transition-all text-center outline-none"
            >
                Search jobs
            </button>
        </div>
    );

    // Header Mode
    if (compact) {
        return (
            <div ref={containerRef} className={`relative flex items-center transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] ${className} outline-none focus:outline-none`}>
                {!isExpanded ? (
                    <div
                        onClick={(e) => { e.stopPropagation(); handleToggle(true); }}
                        className="w-full h-11 px-4 bg-slate-50/50 rounded-full border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:bg-white transition-all outline-none"
                    >
                        <div className="flex items-center gap-3 min-w-0 pr-4">
                            <Search className="w-4 h-4 text-slate-400 group-hover:text-pink-500 transition-colors shrink-0" />
                            <span className="text-[13px] font-bold text-slate-400 group-hover:text-slate-600 truncate">{t('searchJob')}</span>
                        </div>
                        <div className="w-8 h-8 bg-[#ed145b] rounded-full flex items-center justify-center text-white shadow-lg shadow-pink-100 group-hover:scale-110 transition-transform">
                            <Search className="w-3.5 h-3.5" />
                        </div>
                    </div>
                ) : (
                    <div className="w-full animate-in fade-in duration-300 outline-none">
                        <div className="lg:hidden outline-none" style={{ WebkitTapHighlightColor: 'transparent' }}>
                            {renderMobileExpanded()}
                        </div>
                        <div className="hidden lg:block outline-none">
                            {renderSearchInputs('expanded')}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div ref={containerRef} className={`relative ${className} w-full max-w-5xl`}>
            {renderSearchInputs('hero')}
        </div>
    );
};

export default MainSearchBar;
