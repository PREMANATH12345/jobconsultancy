
import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Instagram, Facebook, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Footer = () => {
    const { t } = useLanguage();

    return (
        <footer className="relative pt-24 pb-12 overflow-hidden bg-[#eab308]">
            {/* Decorative background element */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-white/30 rounded-full blur-[100px] -ml-40 -mt-40" />

            <div className="max-w-[1536px] mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
                    {/* Brand Section */}
                    <div className="space-y-8">
                        <Link to="/" className="flex items-center space-x-3 group min-w-fit shrink-0">
                            <img
                                src="/logo.PNG"
                                alt="Job Consultancy"
                                className="h-20 lg:h-24 w-auto object-contain transition-all transform group-hover:scale-105 filter brightness-0"
                            />
                        </Link>
                        <p className="text-slate-800 leading-relaxed text-sm font-bold">
                            {t('footerDesc')}
                        </p>
                        <div className="flex items-center space-x-4">
                            {[
                                { Icon: Facebook, url: 'https://www.facebook.com' },
                                { Icon: Instagram, url: 'https://www.instagram.com' },
                                { Icon: Youtube, url: 'https://www.youtube.com' }
                            ].map(({ Icon, url }, idx) => (
                                <a 
                                    key={idx} 
                                    href={url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="w-12 h-12 rounded-xl bg-slate-900/5 flex items-center justify-center text-slate-800 hover:bg-slate-900 hover:text-yellow-500 transition-all transform hover:scale-110"
                                >
                                    <Icon className="w-6 h-6" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-lg font-black text-slate-900 mb-8">{t('quickLinks')}</h4>
                        <ul className="space-y-4">
                            {['Home', 'About', 'Services', 'Contact'].map((item) => (
                                <li key={item}>
                                    <Link
                                        to={item === 'Home' ? '/' : `/${item.toLowerCase().replace(' ', '-')}`}
                                        className="text-slate-800 hover:text-slate-900 transition-colors text-sm font-bold flex items-center gap-3 group"
                                    >
                                        <span className="w-2 h-2 rounded-full bg-slate-900/30 group-hover:bg-slate-900 transition-colors" />
                                        {t(item.toLowerCase())}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Platform */}
                    <div>
                        <h4 className="text-lg font-black text-slate-900 mb-8">{t('platform')}</h4>
                        <ul className="space-y-4">
                            {[
                                { name: 'findJobs', path: '/employee-register' },
                                { name: 'hireTalent', path: '/employer-register' },
                                { name: 'login', path: '/login' }
                            ].map((item) => (
                                <li key={item.name}>
                                    <Link
                                        to={item.path}
                                        className="text-slate-800 hover:text-slate-900 transition-colors text-sm font-bold flex items-center gap-3 group"
                                    >
                                        <span className="w-2 h-2 rounded-full bg-slate-900/30 group-hover:bg-slate-900 transition-colors" />
                                        {t(item.name)}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-lg font-black text-slate-900 mb-8">{t('contactUs')}</h4>
                        <ul className="space-y-6">
                            <li className="flex items-start gap-4 text-slate-800 text-sm font-bold leading-relaxed">
                                <MapPin className="w-5 h-5 shrink-0 text-slate-900/60" />
                                <span>{t('locations')}</span>
                            </li>
                            <li className="flex items-center gap-4 text-slate-800 text-sm font-bold">
                                <Phone className="w-5 h-5 shrink-0 text-slate-900/60" />
                                <span>+91 96000 38856</span>
                            </li>
                            <li className="flex items-center gap-4 text-slate-800 text-sm font-bold">
                                <Mail className="w-5 h-5 shrink-0 text-slate-900/60" />
                                <span>info@jobconsultancy.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-12 border-t border-slate-900/10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-slate-800 text-xs font-bold">
                        © {new Date().getFullYear()} Job Consultancy. {t('allRightsReserved')}
                    </p>
                    <div className="flex gap-8">
                        <Link to="/privacy-policy" className="text-xs font-bold text-slate-800 hover:text-slate-900">{t('privacyPolicy')}</Link>
                        <Link to="/terms-of-service" className="text-xs font-bold text-slate-800 hover:text-slate-900">{t('termsOfService')}</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
