import React, { useState, useEffect } from 'react';
import { User, Phone, Globe, MapPin, Save, Loader2, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { allService } from '../../services/api';

const EmployerProfile = () => {
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(JSON.parse(sessionStorage.getItem('user')) || {});
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        whatsapp_no: '',
        company_details: {
            website: '',
            address: '',
            industry: ''
        }
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await allService.getData('users', { id: user.id });
            if (data && data.length > 0) {
                const profile = data[0];

                if (profile.status !== user.status) {
                    const updatedUser = { ...user, status: profile.status };
                    sessionStorage.setItem('user', JSON.stringify(updatedUser));
                    setUser(updatedUser);
                    window.dispatchEvent(new Event('dashboard-login'));
                }

                let details = {};
                try {
                    if (typeof profile.user_details === 'string') {
                        if (profile.user_details.includes('[object Object]')) {
                            details = {};
                        } else {
                            details = JSON.parse(profile.user_details);
                        }
                    } else {
                        details = profile.user_details || {};
                    }
                } catch (e) {
                    console.error("JSON Error", e);
                    details = {};
                }

                setFormData({
                    name: profile.name || '',
                    phone: profile.phone || '',
                    whatsapp_no: profile.whatsapp_no || '',
                    company_details: {
                        website: details.website || '',
                        address: typeof details.address === 'object' ? (details.address.city || '') : (details.address || ''),
                        industry: details.industry || ''
                    }
                });
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load profile");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await allService.updateData('users', { id: user.id }, {
                name: formData.name,
                phone: formData.phone,
                whatsapp_no: formData.whatsapp_no,
                user_details: JSON.stringify(formData.company_details)
            });
            toast.success("Profile updated successfully!");
        } catch (error) {
            toast.error("Update failed");
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full pl-12 pr-6 py-4 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none text-slate-900 transition-all font-bold text-sm";
    const labelClass = "text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 mb-2 block";

    return (
        <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-8 md:space-y-12">
            <div className="text-left border-b border-slate-100 pb-8 md:pb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-tight italic">Company Identity</h1>
                    <p className="text-sm font-bold text-slate-400 mt-2 lowercase">Update your organization details to reach more talent.</p>
                </div>
                <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center gap-4 border border-slate-800 shadow-xl self-start md:self-auto">
                    <Building2 className="w-5 h-5 text-emerald-500" />
                    <div className="text-left">
                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Profile Status</p>
                        <p className="text-[10px] font-black uppercase text-emerald-400 italic">Verified Organizer</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[4rem] shadow-2xl border border-slate-100 space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                    <div className="relative md:col-span-2 text-left">
                        <label className={labelClass}>Company Legal Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
                            <input
                                required
                                className={inputClass}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Acme Corporation"
                            />
                        </div>
                    </div>

                    <div className="relative text-left">
                        <label className={labelClass}>Primary Phone</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
                            <input
                                required
                                className={inputClass}
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+91 00000 00000"
                            />
                        </div>
                    </div>

                    <div className="relative text-left">
                        <label className={labelClass}>Corporate Website</label>
                        <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
                            <input
                                className={inputClass}
                                value={formData.company_details.website}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    company_details: { ...formData.company_details, website: e.target.value }
                                })}
                                placeholder="https://www.example.com"
                            />
                        </div>
                    </div>

                    <div className="relative md:col-span-2 text-left">
                        <label className={labelClass}>Base Location Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-5 w-5 h-5 text-slate-300 pointer-events-none" />
                            <textarea
                                className={`${inputClass} !h-32 pt-5 pl-12 resize-none`}
                                value={formData.company_details.address}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    company_details: { ...formData.company_details, address: e.target.value }
                                })}
                                placeholder="Street, Building, City, Pin Code..."
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-6 md:pt-10 flex flex-col sm:flex-row items-center gap-6 border-t border-slate-50">
                    <button
                        disabled={loading}
                        className="w-full sm:w-auto bg-slate-900 text-white px-10 md:px-14 py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-4 disabled:opacity-50 shadow-2xl transform hover:scale-[1.02] active:scale-95 group"
                    >
                        {loading ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin text-emerald-500" /> : <Save className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-12 transition-transform" />}
                        Commit profile changes
                    </button>
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 italic lowercase">Changes will reflect across all job listings immediately.</p>
                </div>
            </form>
        </div>
    );
};

export default EmployerProfile;
