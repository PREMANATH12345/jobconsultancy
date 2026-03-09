
import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { allService } from '../services/api';

const Contact = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: '',
        subject: 'Inquiry from Website'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await allService.submitContactForm(formData);
            toast.success(t('messageSent') || 'Message sent successfully!', { icon: '🚀' });
            setFormData({ name: '', email: '', message: '', subject: 'Inquiry from Website' });
        } catch (error) {
            toast.error(error.message || 'Failed to send message. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none text-slate-900 transition-all text-sm font-bold disabled:opacity-50 placeholder:text-slate-300";
    const labelClass = "text-xs font-black text-slate-900 uppercase tracking-widest ml-3 mb-2 block";

    return (
        <div className="min-h-screen pt-40 pb-20 px-4 bg-[#fffff4]">
            <div className="max-w-[1536px] mx-auto">
                <div className="text-center mb-20 space-y-4">
                    <h1 className="text-2xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-none">{t('getInTouch')}</h1>
                    <p className="text-pink-600 max-w-2xl mx-auto text-sm lg:text-lg font-black uppercase tracking-[0.2em]">
                        {t('contactSubtitle')}
                    </p>
                </div>

                <div className="grid lg:grid-cols-5 gap-16 items-start">
                    <div className="lg:col-span-2 space-y-12 bg-slate-50 p-8 md:p-12 rounded-[3.5rem] border border-slate-100">
                        <div className="space-y-2">
                            <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">{t('contactInfo') || 'Contact Information'}</h2>
                            <p className="text-slate-500 font-medium">{t('contactInfoDesc') || 'Have questions? We\'re here to help you every step of the way.'}</p>
                        </div>

                        <div className="space-y-8">
                            {[
                                { icon: <Phone className="w-6 h-6" />, title: t('directCall'), detail: '+91 96000 38856' },
                                { icon: <Mail className="w-6 h-6" />, title: t('emailSupport'), detail: 'info@jobconsultancy.com' },
                                { icon: <MapPin className="w-6 h-6" />, title: t('mainOffice'), detail: t('locations') },
                            ].map((info, idx) => (
                                <div key={idx} className="flex items-start gap-6 group">
                                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-pink-600 group-hover:scale-110 transition-transform shrink-0">
                                        {info.icon}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{info.title}</h3>
                                        <p className="text-slate-900 font-bold text-lg tracking-tight">{info.detail}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-3">
                        <div className="bg-white p-6 md:p-12 rounded-[3.5rem] border-2 border-amber-200 shadow-xl shadow-amber-500/5">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className={labelClass}>{t('completeName')}</label>
                                        <input required name="name" value={formData.name} onChange={handleChange} disabled={loading} type="text" placeholder={t('namePlaceholder')} className={inputClass} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelClass}>{t('emailId')}</label>
                                        <input required name="email" value={formData.email} onChange={handleChange} disabled={loading} type="email" placeholder={t('emailPlaceholder')} className={inputClass} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClass}>{t('howCanHelp')}</label>
                                    <textarea required name="message" value={formData.message} onChange={handleChange} disabled={loading} rows="6" placeholder={t('messagePlaceholder')} className={inputClass + " resize-none"}></textarea>
                                </div>
                                <button type="submit" disabled={loading} className="w-full bg-amber-500 text-white py-4 lg:py-6 rounded-2xl lg:rounded-[2rem] font-black text-xs lg:text-sm uppercase tracking-[0.3em] hover:bg-pink-600 transition-all flex items-center justify-center gap-4 shadow-lg active:scale-[0.98] disabled:opacity-70">
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-5 h-5 lg:w-6 lg:h-6" />}
                                    {loading ? t('sending') : t('sendMessage')}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;

