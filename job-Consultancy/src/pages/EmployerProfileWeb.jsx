import React, { useState, useEffect } from 'react';
import { User, Phone, Globe, MapPin, Save, Loader2, LayoutDashboard, LogOut, CheckCircle, Briefcase, Mail, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { allService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const EmployerProfileWeb = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        whatsapp_no: '',
        companyType: '',
        companyCategory: '',
        address: { dNo: '', streetName: '', city: '', district: '' },
        contactPerson: { name: '', designation: '', cellNo: '', timing: '', email: '' },
        jobVacancy: { designation: '', noOfPersons: '', type: 'Permanent', salary: '', city: '', district: '' },
        allowances: { food: false, travel: false, room: false, bf: false, esi: false, insurance: false },
    });

    useEffect(() => {
        const storedUser = JSON.parse(sessionStorage.getItem('user'));
        if (!storedUser || (storedUser.role !== 'employer' && storedUser.role !== 'admin')) {
            navigate('/login');
            return;
        }
        setUser(storedUser);
        fetchProfile(storedUser.id);
    }, [navigate]);

    const fetchProfile = async (id) => {
        try {
            const data = await allService.getData('users', { id });
            if (data && data[0]) {
                const profile = data[0];
                let details = {};

                try {
                    if (typeof profile.user_details === 'string') {
                        if (profile.user_details === '[object Object]') {
                            details = {};
                        } else {
                            try { details = JSON.parse(profile.user_details); } catch (e) { details = {} }
                        }
                    } else {
                        details = profile.user_details || {};
                    }
                } catch (e) { console.error(e); details = {} }

                setFormData({
                    name: profile.name, // This is Company Name
                    phone: profile.phone,
                    whatsapp_no: profile.whatsapp_no,
                    companyType: details.companyType || '',
                    companyCategory: details.companyCategory || '',
                    address: details.address || { dNo: '', streetName: '', city: '', district: '' },
                    contactPerson: details.contactPerson || { name: '', designation: '', cellNo: '', timing: '', email: '' },
                    jobVacancy: details.jobVacancy || { designation: '', noOfPersons: '', type: 'Permanent', salary: '', city: '', district: '' },
                    allowances: details.allowances || { food: false, travel: false, room: false, bf: false, esi: false, insurance: false }
                });
            }
        } catch (error) {
            toast.error("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updatedDetails = {
                companyType: formData.companyType,
                companyCategory: formData.companyCategory,
                address: formData.address,
                contactPerson: formData.contactPerson,
                jobVacancy: formData.jobVacancy,
                allowances: formData.allowances
            };

            await allService.updateData('users', { id: user.id }, {
                name: formData.name,
                phone: formData.phone,
                whatsapp_no: formData.whatsapp_no,
                user_details: JSON.stringify(updatedDetails)
            });
            toast.success("Company Profile updated!");
        } catch (error) {
            toast.error("Update failed");
        } finally {
            setSaving(false);
        }
    };

    // Updated Redirect Logic for Dashboard with Auto-Login
    const goToDashboard = () => {
        navigate('/employer/dashboard');
    };

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
        window.dispatchEvent(new Event('user-login'));
        navigate('/login');
    };

    const inputClass = "w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none text-slate-900 transition-all font-bold text-xs md:text-sm bg-white";
    const labelClass = "text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-[0.15em] ml-1 mb-1 md:mb-2 block";
    const sectionClass = "col-span-full border-b border-slate-100 pb-3 md:pb-4 mb-3 md:mb-4 mt-6 md:mt-8 flex items-center gap-3";

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

    return (
        <div className="min-h-screen pt-32 pb-20 px-4 bg-slate-50">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
                    <div className="text-center md:text-left">
                        <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest mb-4 shadow-sm border border-slate-100">
                            <User className="w-4 h-4 text-primary" /> Employer Portal
                        </div>
                        <h1 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tight">Company Profile</h1>
                        <p className="text-slate-500 font-bold mt-2 text-xs md:text-base lowercase">Manage your organization details.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <button onClick={goToDashboard} className="w-full sm:w-auto bg-amber-500 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95">
                            <LayoutDashboard className="w-4 h-4" /> Open Dashboard
                        </button>
                        <button onClick={handleLogout} className="w-full sm:w-auto bg-red-50 text-red-500 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2 active:scale-95">
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>
                </div>

                <form onSubmit={handleUpdate} className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3.5rem] shadow-xl border-2 border-amber-100 space-y-6 md:space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        <div className={sectionClass}>
                            <User className="w-5 h-5 text-amber-600" />
                            <h3 className="text-sm font-bold text-amber-600 uppercase tracking-widest">Organization Details</h3>
                        </div>

                        <div className="col-span-2">
                            <label className={labelClass}>{t('orgName')}</label>
                            <input
                                required
                                className={inputClass}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>{t('hqContact')}</label>
                            <input
                                required
                                className={inputClass}
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Company Type</label>
                            <select className={inputClass} value={formData.companyType} onChange={(e) => setFormData({ ...formData, companyType: e.target.value })}>
                                <option>Proprietor</option>
                                <option>Partnership</option>
                                <option>Corporate</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>Company Category</label>
                            <select className={inputClass} value={formData.companyCategory} onChange={(e) => setFormData({ ...formData, companyCategory: e.target.value })}>
                                <option>Private Ltd</option>
                                <option>Public Ltd</option>
                                <option>NGO</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>{t('whatsapp_no') || 'WhatsApp Number'}</label>
                            <input className={inputClass} value={formData.whatsapp_no} onChange={(e) => setFormData({ ...formData, whatsapp_no: e.target.value })} />
                        </div>

                        <div className="col-span-full">
                            <label className={labelClass}>{t('coreLocation')}</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input placeholder="Door No / Street" className={inputClass} value={formData.address.streetName || ''}
                                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, streetName: e.target.value } })} />
                                <input placeholder="City" className={inputClass} value={formData.address.city || ''}
                                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })} />
                                <input placeholder="District" className={inputClass} value={formData.address.district || ''}
                                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, district: e.target.value } })} />
                            </div>
                        </div>

                        <div className={sectionClass}>
                            <User className="w-5 h-5 text-pink-600" />
                            <h3 className="text-sm font-bold text-pink-600 uppercase tracking-widest">Primary Contact Person</h3>
                        </div>

                        <div>
                            <label className={labelClass}>Contact Name</label>
                            <input className={inputClass} value={formData.contactPerson.name} onChange={(e) => setFormData({ ...formData, contactPerson: { ...formData.contactPerson, name: e.target.value } })} />
                        </div>

                        <div>
                            <label className={labelClass}>Designation</label>
                            <input className={inputClass} value={formData.contactPerson.designation} onChange={(e) => setFormData({ ...formData, contactPerson: { ...formData.contactPerson, designation: e.target.value } })} />
                        </div>

                        <div>
                            <label className={labelClass}>HR Official Email</label>
                            <input className={inputClass} value={formData.contactPerson.email} onChange={(e) => setFormData({ ...formData, contactPerson: { ...formData.contactPerson, email: e.target.value } })} />
                        </div>

                        <div>
                            <label className={labelClass}>Contact Mobile</label>
                            <input className={inputClass} value={formData.contactPerson.cellNo} onChange={(e) => setFormData({ ...formData, contactPerson: { ...formData.contactPerson, cellNo: e.target.value } })} />
                        </div>

                        <div>
                            <label className={labelClass}>Office Timing</label>
                            <input className={inputClass} value={formData.contactPerson.timing} onChange={(e) => setFormData({ ...formData, contactPerson: { ...formData.contactPerson, timing: e.target.value } })} />
                        </div>

                        <div className={sectionClass}>
                            <Briefcase className="w-5 h-5 text-blue-600" />
                            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest">Active Vacancies</h3>
                        </div>

                        <div>
                            <label className={labelClass}>Hiring Designation</label>
                            <input className={inputClass} value={formData.jobVacancy.designation} onChange={(e) => setFormData({ ...formData, jobVacancy: { ...formData.jobVacancy, designation: e.target.value } })} />
                        </div>

                        <div>
                            <label className={labelClass}>No. of Openings</label>
                            <input type="number" className={inputClass} value={formData.jobVacancy.noOfPersons} onChange={(e) => setFormData({ ...formData, jobVacancy: { ...formData.jobVacancy, noOfPersons: e.target.value } })} />
                        </div>

                        <div>
                            <label className={labelClass}>Salary Range</label>
                            <input className={inputClass} value={formData.jobVacancy.salary} onChange={(e) => setFormData({ ...formData, jobVacancy: { ...formData.jobVacancy, salary: e.target.value } })} />
                        </div>

                        <div>
                            <label className={labelClass}>Job Location (City)</label>
                            <input className={inputClass} value={formData.jobVacancy.city} onChange={(e) => setFormData({ ...formData, jobVacancy: { ...formData.jobVacancy, city: e.target.value } })} />
                        </div>

                        <div className="col-span-full">
                            <label className={labelClass}>Provided Benefits</label>
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                                {Object.keys(formData.allowances).map(k => (
                                    <label key={k} className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer ${formData.allowances[k] ? 'bg-amber-50 border-amber-500' : 'bg-white border-slate-100'}`}>
                                        <input
                                            type="checkbox"
                                            hidden
                                            checked={formData.allowances[k]}
                                            onChange={(e) => setFormData({ ...formData, allowances: { ...formData.allowances, [k]: e.target.checked } })}
                                        />
                                        <span className={`text-[11px] font-bold uppercase tracking-normal ${formData.allowances[k] ? 'text-amber-700' : 'text-slate-400'}`}>{k}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center sm:justify-end pt-6 md:pt-8 border-t border-slate-50 mt-4 md:mt-6">
                        <button
                            disabled={saving}
                            className="w-full sm:w-auto bg-pink-600 text-white px-8 md:px-10 py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-[11px] md:text-sm uppercase tracking-widest hover:bg-amber-500 transition-all flex items-center justify-center gap-4 shadow-xl shadow-pink-500/10 disabled:opacity-50 active:scale-95 translate-y-0 hover:-translate-y-1"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 md:w-6 md:h-6" />}
                            Save Profile Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmployerProfileWeb;
