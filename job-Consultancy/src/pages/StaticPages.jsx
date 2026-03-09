
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const PageHero = ({ title, subtitle }) => (
    <div className="relative pt-40 md:pt-48 pb-16 md:pb-24 px-4 overflow-hidden bg-pink-50">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-100 rounded-full blur-[120px] -mr-40 -mt-40" />
        <div className="max-w-[1536px] mx-auto relative z-10 text-center space-y-4 md:space-y-6">
            <h1 className="text-3xl md:text-6xl font-extrabold text-pink-600 tracking-tight mb-2 md:mb-4 animate-in fade-in slide-in-from-bottom-8 duration-700">{title}</h1>
            <p className="text-xs md:text-sm lg:text-base text-slate-500 font-semibold max-w-2xl mx-auto uppercase tracking-widest leading-relaxed">{subtitle}</p>
        </div>
    </div>
);

const StaticCard = ({ children }) => (
    <div className="p-6 md:p-10 lg:p-14 bg-white md:border border-pink-100 mb-6 md:mb-12 reveal-section md:shadow-sm rounded-none md:rounded-[2rem]">
        {children}
    </div>
);

export const About = () => {
    const { t } = useLanguage();
    return (
        <div className="min-h-screen bg-[#fffff4]">
            <PageHero title={t('ourJourney')} subtitle={t('journeySubtitle')} />
            <div className="max-w-6xl mx-auto px-4 py-24">
                <StaticCard>
                    <h2 className="text-xl md:text-2xl font-extrabold text-pink-600 mb-6 tracking-tight flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-pink-500 rounded-full" />
                        {t('whoWeAre')}
                    </h2>
                    <div className="space-y-4 text-slate-600 font-medium leading-relaxed text-sm md:text-base">
                        <p>{t('whoWeAreDesc')}</p>
                        <p>Founded with a vision to streamline recruitment, we use a human-centric approach combined with modern technology to ensure the perfect match for every role.</p>
                    </div>
                </StaticCard>
            </div>
        </div>
    );
};

export const ServicesPage = () => {
    const { t } = useLanguage();
    return (
        <div className="min-h-screen bg-[#fffff4]">
            <PageHero title={t('globalSolutions')} subtitle={t('solutionsSubtitle')} />
            <div className="max-w-[1536px] mx-auto px-4 py-12 md:py-24 grid md:grid-cols-2 gap-8 md:gap-12">
                <StaticCard>
                    <h3 className="text-lg md:text-xl font-extrabold text-pink-600 mb-6 tracking-tight flex items-center gap-2">
                        <div className="w-1 h-5 bg-pink-500 rounded-full" />
                        {t('forSeekers')}
                    </h3>
                    <ul className="space-y-3 md:space-y-4 text-slate-600 font-medium text-sm md:text-base">
                        <li className="flex items-start gap-2">
                            <span className="text-pink-500 mt-1">•</span>
                            Direct Access to Verified MNCs
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-pink-500 mt-1">•</span>
                            Professional Resume Branding
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-pink-500 mt-1">•</span>
                            Mock Interviews & Skill Scaling
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-pink-500 mt-1">•</span>
                            Priority Placement in TN Districts
                        </li>
                    </ul>
                </StaticCard>
                <StaticCard>
                    <h3 className="text-lg md:text-xl font-extrabold text-pink-600 mb-6 tracking-tight flex items-center gap-2">
                        <div className="w-1 h-5 bg-pink-500 rounded-full" />
                        {t('forEmployers')}
                    </h3>
                    <ul className="space-y-3 md:space-y-4 text-slate-600 font-medium text-sm md:text-base">
                        <li className="flex items-start gap-2">
                            <span className="text-pink-500 mt-1">•</span>
                            Pre-Screened Candidate Database
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-pink-500 mt-1">•</span>
                            Background Verification Services
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-pink-500 mt-1">•</span>
                            Rapid Hiring Solutions
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-pink-500 mt-1">•</span>
                            Executive Talent Sourcing
                        </li>
                    </ul>
                </StaticCard>
            </div>
        </div>
    );
};

export const PrivacyPolicy = () => {
    const { t } = useLanguage();
    return (
        <div className="min-h-screen bg-[#fffff4]">
            <PageHero title={t('privacyCore')} subtitle={t('privacySubtitle')} />
            <div className="max-w-6xl mx-auto px-4 py-24">
                <StaticCard>
                    <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed text-sm md:text-base">
                        <h2 className="text-lg md:text-xl font-extrabold text-pink-600 mb-4 tracking-tight uppercase">Data Collection</h2>
                        <p className="mb-8">Your data is yours. At Job Consultancy, we only collect necessary information (Resume, Contact details, Qualifications) to provide matching services. We never sell your personal metrics to third-party aggregators.</p>
                        <h2 className="text-lg md:text-xl font-extrabold text-pink-600 mb-4 tracking-tight uppercase">Legal Compliance</h2>
                        <p>We adhere to the Information Technology Act, 2000 and the SPDI Rules of India. Your profile is encrypted and stored in local servers for maximum security.</p>
                    </div>
                </StaticCard>
            </div>
        </div>
    );
};

export const TermsOfService = () => {
    const { t } = useLanguage();
    return (
        <div className="min-h-screen bg-[#fffff4]">
            <PageHero title={t('usageTerms')} subtitle={t('usageSubtitle')} />
            <div className="max-w-6xl mx-auto px-4 py-24">
                <StaticCard>
                    <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed text-sm md:text-base">
                        <h2 className="text-lg md:text-xl font-extrabold text-pink-600 mb-4 tracking-tight uppercase">User Conduct</h2>
                        <p className="font-medium">Candidates and employers are expected to maintain professionalism. Misrepresentation of skills or company standing will result in immediate profile termination from the Job Consultancy ecosystem.</p>
                    </div>
                </StaticCard>
            </div>
        </div>
    );
};
