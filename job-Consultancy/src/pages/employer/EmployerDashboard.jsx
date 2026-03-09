
import React, { useState, useEffect } from 'react';
import {
    Users,
    Briefcase,
    CheckCircle,
    Clock,
    TrendingUp,
    PlusCircle,
    ArrowRight,
    Loader2,
    UserCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { allService } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

const EmployerDashboard = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalJobs: 0,
        activeJobs: 0,
        totalApplications: 0,
        pendingApprovals: 0
    });
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(sessionStorage.getItem('user'));

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const jobsData = await allService.getData('jobs', { employer_id: user.id });
            const myJobs = Array.isArray(jobsData) ? jobsData : [];

            const appsData = await allService.getData('job_applications');
            const allApps = Array.isArray(appsData) ? appsData : [];

            const myJobIds = myJobs.map(j => parseInt(j.id));
            const myApps = allApps.filter(app => myJobIds.includes(parseInt(app.job_id)));

            setStats({
                totalJobs: myJobs.length,
                activeJobs: myJobs.filter(j => j.status === 'approved').length,
                totalApplications: myApps.length,
                pendingApprovals: myJobs.filter(j => j.status === 'pending').length
            });
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { label: t('totalJobs'), value: stats.totalJobs, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: t('activeListings'), value: stats.activeJobs, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
        { label: t('applications'), value: stats.totalApplications, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: t('pendingReview'), value: stats.pendingApprovals, icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50' },
    ];

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('employerDashboard')}</h1>
                    <p className="text-sm font-medium text-slate-500 mt-2 px-1">{t('welcomeBackToday')}</p>
                </div>
                <button
                    onClick={() => navigate('/employer/post-job')}
                    className="bg-primary text-white px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-pink-600 transition-all flex items-center gap-3 shadow-xl shadow-primary/20"
                >
                    <PlusCircle className="w-5 h-5" />
                    {t('postNewVacancy')}
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                {statCards.map((stat, i) => (
                    <div key={i} className="bg-white p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-primary/20 transition-all flex flex-col items-center text-center md:items-start md:text-left">
                        <div className={`${stat.bg} ${stat.color} w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-6 group-hover:scale-110 transition-transform`}>
                            <stat.icon className="w-5 h-5 md:w-7 md:h-7" />
                        </div>
                        <h4 className="text-[8px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</h4>
                        <p className="text-xl md:text-3xl font-bold text-slate-900">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <div className="bg-white p-5 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6 md:mb-8">
                        <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">{t('quickActions')}</h3>
                        <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 md:gap-4">
                        <button
                            onClick={() => navigate('/employer/my-jobs')}
                            className="p-4 md:p-6 bg-slate-50 rounded-2xl md:rounded-3xl text-left group hover:bg-primary transition-all flex flex-col items-center md:items-start text-center md:text-left"
                        >
                            <Briefcase className="w-5 h-5 md:w-6 md:h-6 text-primary mb-3 md:mb-4 group-hover:text-white" />
                            <p className="text-[10px] md:text-sm font-bold text-slate-900 tracking-wide group-hover:text-white leading-tight">{t('manageJobs')}</p>
                            <p className="hidden md:block text-xs font-medium text-slate-400 group-hover:text-white/60 mt-1">{t('editCloseListings')}</p>
                        </button>
                        <button
                            onClick={() => navigate('/employer/my-jobs')}
                            className="p-4 md:p-6 bg-slate-50 rounded-2xl md:rounded-3xl text-left group hover:bg-primary transition-all flex flex-col items-center md:items-start text-center md:text-left"
                        >
                            <Users className="w-5 h-5 md:w-6 md:h-6 text-primary mb-3 md:mb-4 group-hover:text-white" />
                            <p className="text-[10px] md:text-sm font-bold text-slate-900 tracking-wide group-hover:text-white leading-tight">{t('viewCandidates')}</p>
                            <p className="hidden md:block text-xs font-medium text-slate-400 group-hover:text-white/60 mt-1">{t('reviewApplicantProfiles')}</p>
                        </button>
                    </div>
                </div>

                <div className="bg-primary/5 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-primary/20 flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-sm">
                        <UserCircle className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight mb-2 uppercase md:normal-case">{t('updateProfilePrompt')}</h3>
                    <p className="text-xs md:text-sm font-medium text-slate-500 max-w-xs mb-6 md:mb-8">{t('companyInfoUpdate')}</p>
                    <button
                        onClick={() => navigate('/employer/profile')}
                        className="bg-white text-primary px-6 py-3 md:px-8 md:py-4 rounded-xl font-extrabold text-[10px] md:text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center gap-3 shadow-md"
                    >
                        {t('goToProfile')}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmployerDashboard;
