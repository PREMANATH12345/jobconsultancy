
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Landmark, Building2, LogIn, Globe, UserPlus, User } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { MainSearchBar } from './MainSearchBar';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
    const { language, setLanguage, t } = useLanguage();
    const location = useLocation();
    const [user, setUser] = useState(JSON.parse(sessionStorage.getItem('user')));

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        const handleLoginUpdate = () => setUser(JSON.parse(sessionStorage.getItem('user')));

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('user-login', handleLoginUpdate);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('user-login', handleLoginUpdate);
        };
    }, []);

    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    const toggleLanguage = () => setLanguage(language === 'en' ? 'ta' : 'en');

    const isDashboard = location.pathname.startsWith('/employer/') || location.pathname.startsWith('/employee/');

    // Hide global Navbar on dashboard as dashboards have their own navigation
    if (isDashboard) return null;

    const themeColor = location.pathname.startsWith('/employee/') ? 'text-emerald-500' : 'text-primary';
    const hoverColor = location.pathname.startsWith('/employee/') ? 'hover:text-emerald-500' : 'hover:text-primary';

    const navLinkClass = `text-[13px] font-bold text-slate-700 ${hoverColor} transition-all flex items-center gap-1.5 py-4 shrink-0 whitespace-nowrap`;

    return (
        <nav className={`fixed top-0 w-full z-[70] transition-all duration-500 ${isSearchFocused ? 'py-2' : (scrolled ? 'py-2' : 'py-6')}`}>
            <div className={`px-4 md:px-6 transition-all duration-500 w-full flex justify-center`}>
                <div className={`rounded-[2rem] md:rounded-full px-4 md:px-8 flex flex-col items-center transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] shadow-xl border border-white/20 w-full max-w-[1536px]
                    ${isSearchFocused ? 'bg-white py-4 shadow-2xl ring-1 ring-slate-100' : 'bg-white/90 backdrop-blur-2xl py-3'}
                `}>

                    {/* Main Row */}
                    <div className="flex items-center justify-between w-full gap-4">
                        {/* Logo */}
                        <div className="flex items-center shrink-0">
                            <Link to="/" className="shrink-0">
                                <img
                                    src="/logo.PNG"
                                    alt="Logo"
                                    className={`${isSearchFocused ? 'h-8 md:h-10 lg:h-12' : 'h-10 md:h-12 lg:h-14'} w-auto object-contain transition-all duration-500`}
                                />
                            </Link>
                        </div>

                        {/* Search Bar - Hidden on Mobile unless focused */}
                        <div className={`transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] hidden lg:flex items-center
                            ${isSearchFocused ? 'flex-1 max-w-5xl opacity-100 translate-x-0' : 'w-[280px] xl:w-[320px]'}
                        `}>
                            <MainSearchBar
                                compact={true}
                                isExpandedProp={isSearchFocused}
                                onToggle={(val) => setIsSearchFocused(val)}
                                className="w-full"
                            />
                        </div>

                        {/* Desktop Options */}
                        <div className={`hidden lg:flex items-center gap-4 xl:gap-8 transition-all duration-500 
                            ${isSearchFocused ? 'opacity-0 translate-x-20 pointer-events-none w-0 overflow-hidden' : 'opacity-100 translate-x-0'}
                        `}>
                            {/* Nav Links */}
                            <div className="flex items-center space-x-6 xl:space-x-8">
                                <Link to="/" className={navLinkClass}>{t('home')}</Link>
                                <Link to="/jobs?type=govt" className={navLinkClass}><Landmark className="w-4 h-4" /> {t('jobTypes.govt')}</Link>
                                <Link to="/jobs?type=private" className={navLinkClass}><Building2 className="w-4 h-4" /> {t('jobTypes.private')}</Link>
                                <Link to="/contact" className={navLinkClass}>{t('contact')}</Link>
                            </div>

                            {/* Registration Buttons */}
                            {!user && (
                                <div className="flex items-center gap-3 shrink-0">
                                    <Link to="/employee-register" className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-4 py-2.5 rounded-full border border-emerald-100 transition-all flex items-center gap-2 whitespace-nowrap">
                                        <UserPlus className="w-3.5 h-3.5" /> {t('employee')}
                                    </Link>
                                    <Link to="/employer-register" className="text-[10px] font-black uppercase tracking-widest text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-4 py-2.5 rounded-full border border-amber-100 transition-all flex items-center gap-2 whitespace-nowrap">
                                        <Building2 className="w-3.5 h-3.5" /> {t('employer')}
                                    </Link>
                                </div>
                            )}

                            {/* Language Toggle */}
                            <button onClick={toggleLanguage} className="flex items-center gap-1.5 text-[12px] font-bold text-slate-700 px-3 py-2 rounded-full border border-slate-200 hover:bg-slate-50 transition-all shrink-0">
                                <Globe className={`w-4 h-4 ${themeColor}`} />
                                {language === 'en' ? 'தமிழ்' : 'English'}
                            </button>

                            {/* User Authentication */}
                            {user ? (
                                <Link to={user.role === 'employer' ? "/employer/dashboard" : "/employee/dashboard"} className={`${user.role === 'employer' ? 'bg-primary' : 'bg-emerald-500'} text-white px-7 py-2.5 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all whitespace-nowrap`}>
                                    {user.role === 'employer' ? t('employerHub') : t('candidatePortal')}
                                </Link>
                            ) : (
                                <Link to="/login" className="bg-slate-900 text-white px-7 py-2.5 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2 ml-1">
                                    <LogIn className="w-4 h-4" /> {t('login')}
                                </Link>
                            )}
                        </div>

                        {/* Mobile Actions */}
                        <div className="flex lg:hidden items-center gap-2">
                            {user ? (
                                <Link to={user.role === 'employer' ? "/employer/dashboard" : "/employee/dashboard"} className={`${user.role === 'employer' ? 'bg-primary' : 'bg-emerald-500'} text-white px-4 py-2 rounded-full text-[10px] font-bold shadow-md whitespace-nowrap`}>
                                    {user.role === 'employer' ? t('employerHub').split(' ')[0] : t('candidatePortal').split(' ')[0]}
                                </Link>
                            ) : (
                                <Link to="/login" className="bg-slate-900 text-white px-4 py-2 rounded-full text-[10px] font-bold shadow-md flex items-center gap-1.5">
                                    <LogIn className="w-3.5 h-3.5" /> {t('login')}
                                </Link>
                            )}
                            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-slate-800 hover:bg-slate-50 rounded-xl transition-all">
                                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div
                    className="lg:hidden absolute top-full left-0 w-full mt-2 px-6 animate-in slide-in-from-top-6 duration-500 pb-10 outline-none"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                    <div className="bg-white rounded-[2rem] p-6 shadow-2xl border border-slate-100 flex flex-col gap-6 outline-none focus:outline-none" style={{ WebkitTapHighlightColor: 'transparent' }}>

                        {/* Personalized Greeting when search is active */}
                        {isMobileSearchActive && (
                            <div className="animate-in fade-in slide-in-from-left-4 duration-500 outline-none">
                                <p className="text-slate-900 font-bold mb-1 opacity-70">
                                    Hey {user?.name ? user.name.split(' ')[0] : 'there'},
                                </p>
                                <h2 className="text-2xl font-black text-slate-900 leading-none">Find your dream job</h2>
                            </div>
                        )}

                        <MainSearchBar
                            compact={true}
                            isExpandedProp={isMobileSearchActive}
                            onToggle={(val) => setIsMobileSearchActive(val)}
                            className="w-full"
                        />

                        {!isMobileSearchActive && (
                            <>
                                <div className="space-y-1">
                                    <Link to="/" className="flex items-center px-4 py-3 rounded-xl hover:bg-slate-50 font-bold text-slate-700 text-[14px]">{t('home')}</Link>
                                    <Link to="/jobs?type=govt" className="flex items-center px-4 py-3 rounded-xl hover:bg-emerald-50 font-bold text-slate-700 text-[14px]">{t('jobTypes.govt')}</Link>
                                    <Link to="/jobs?type=private" className="flex items-center px-4 py-3 rounded-xl hover:bg-emerald-50 font-bold text-slate-700 text-[14px]">{t('jobTypes.private')}</Link>
                                    <Link to="/contact" className="flex items-center px-4 py-3 rounded-xl hover:bg-slate-50 font-bold text-slate-700 text-[14px]">{t('contact')}</Link>
                                </div>
                                <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                                    {!user && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <Link to="/employee-register" className="py-3 px-2 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 font-bold text-[11px] text-center">{t('employee')}</Link>
                                            <Link to="/employer-register" className="py-3 px-2 rounded-xl border border-amber-100 bg-amber-50 text-amber-600 font-bold text-[11px] text-center">{t('employer')}</Link>
                                        </div>
                                    )}
                                    <button onClick={toggleLanguage} className="flex items-center justify-between px-5 py-3 rounded-xl bg-slate-50 font-bold text-slate-700 text-[14px]">
                                        <span>{language === 'en' ? 'மண்டல மொழி' : 'Regional Language'}</span>
                                        <span className={themeColor}>{language === 'en' ? 'தமிழ்' : 'English'}</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
