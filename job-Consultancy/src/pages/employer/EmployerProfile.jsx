import React, { useState, useEffect } from 'react';
import {
    User, Phone, Save, Loader2, Briefcase, Mail,
    Building2, MapPin, Edit3, ArrowLeft, Clock,
    Hash, Globe, Layout, Smartphone, Users, FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { allService } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

const EmployerProfile = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        whatsapp_no: '',
        companyType: '',
        companyCategory: '',
        website: '',
        companySize: '',
        description: '',
        address: { dNo: '', streetName: '', city: '', district: '' },
        contactPerson: { name: '', designation: '', cellNo: '', timing: '', email: '' },
    });

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser || storedUser.role !== 'employer') {
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
                    details = typeof profile.user_details === 'string' ? JSON.parse(profile.user_details) : (profile.user_details || {});
                } catch (e) { details = {} }

                setFormData({
                    name: profile.name || '',
                    phone: profile.phone || '',
                    whatsapp_no: profile.whatsapp_no || '',
                    companyType: details.companyType || '',
                    companyCategory: details.companyCategory || '',
                    website: details.website || '',
                    companySize: details.companySize || '',
                    description: details.description || '',
                    address: {
                        dNo: details.address?.dNo || '',
                        streetName: details.address?.streetName || '',
                        city: details.address?.city || '',
                        district: details.address?.district || '',
                    },
                    contactPerson: {
                        name: details.contactPerson?.name || '',
                        designation: details.contactPerson?.designation || '',
                        cellNo: details.contactPerson?.cellNo || '',
                        timing: details.contactPerson?.timing || '',
                        email: details.contactPerson?.email || '',
                    },
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
                website: formData.website,
                companySize: formData.companySize,
                description: formData.description,
                address: formData.address,
                contactPerson: formData.contactPerson,
            };

            await allService.updateData('users', { id: user.id }, {
                name: formData.name,
                phone: formData.phone,
                whatsapp_no: formData.whatsapp_no,
                user_details: JSON.stringify(updatedDetails)
            });
            toast.success("Profile updated successfully!");
            setIsEditing(false);
        } catch (error) {
            toast.error("Update failed");
        } finally {
            setSaving(false);
        }
    };

    const inputClass = "w-full px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none text-slate-900 transition-all font-bold text-sm md:text-base bg-white placeholder:text-slate-400 hover:border-slate-300";
    const labelClass = "text-[10px] md:text-sm font-extrabold text-slate-500 mb-2 block ml-1 uppercase tracking-wider";

    const DetailItem = ({ icon: Icon, label, value, color = "text-primary", isLink = false }) => (
        <div className="flex items-start gap-3 md:gap-4 p-4 md:p-5 rounded-2xl border-b md:border border-slate-50 bg-white md:bg-slate-50/30">
            <div className={`p-2.5 md:p-3 rounded-xl bg-slate-50 md:bg-white shadow-sm shrink-0 ${color}`}>
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[9px] md:text-[11px] font-extrabold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
                {isLink && value && value !== 'Not provided' ? (
                    <a
                        href={value.startsWith('http') ? value : `https://${value}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm md:text-lg font-bold text-primary hover:text-primary/80 transition-all underline decoration-primary/30 underline-offset-4 truncate block"
                    >
                        {value}
                    </a>
                ) : (
                    <p className="text-sm md:text-lg font-bold text-slate-800 leading-tight truncate">{value || 'Not provided'}</p>
                )}
            </div>
        </div>
    );

    if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 md:space-y-10 animate-in fade-in duration-500 p-0 md:p-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8 px-4 md:px-0">
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
                    <div className="p-3 md:p-4 bg-primary/10 rounded-xl md:rounded-2xl shrink-0">
                        <Building2 className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight uppercase leading-tight">
                            Company Profile
                        </h1>
                        <p className="text-slate-500 font-semibold mt-1 md:mt-2 text-[10px] md:text-lg lowercase">
                            Manage your official organization and contact information.
                        </p>
                    </div>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center justify-center gap-3 px-6 md:px-8 py-3.5 md:py-4 bg-slate-900 md:bg-white text-white md:text-slate-700 border border-transparent md:border-slate-200 rounded-xl md:rounded-2xl font-extrabold text-[10px] md:text-sm uppercase tracking-wider hover:bg-slate-800 md:hover:bg-slate-50 transition-all shadow-lg md:shadow-md group"
                    >
                        <Edit3 className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                        Edit Company Profile
                    </button>
                )}
            </div>

            {!isEditing ? (
                /* VIEW MODE - ALL DETAILS IN ONE CONTAINER */
                <div className="bg-transparent md:bg-white p-4 md:p-12 rounded-[2rem] md:rounded-[3.5rem] md:shadow-xl md:border border-slate-100 space-y-10 md:space-y-16 animate-in slide-in-from-bottom-5 duration-700">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
                        <div className="lg:col-span-8 space-y-12">
                            <div>
                                <h3 className="text-sm font-bold text-primary uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                    <Layout className="w-5 h-5" /> Organization Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <DetailItem icon={Building2} label="Organization Name" value={formData.name} />
                                    <DetailItem icon={Phone} label="HQ Contact No" value={formData.phone} />
                                    <DetailItem icon={Smartphone} label="WhatsApp Number" value={formData.whatsapp_no} />
                                    <DetailItem icon={Briefcase} label="Company Type" value={formData.companyType} />
                                    <DetailItem icon={Globe} label="Company Category" value={formData.companyCategory} />
                                    <DetailItem icon={Globe} label="Official Website" value={formData.website} color="text-emerald-500" isLink={true} />
                                    <DetailItem icon={Users} label="Employee Count" value={formData.companySize} color="text-amber-500" />
                                </div>
                                {formData.description && (
                                    <div className="mt-8 p-6 md:p-8 bg-slate-50/50 border border-slate-100 rounded-3xl">
                                        <p className="text-[10px] md:text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <FileText className="w-3.5 h-3.5" /> About the Company
                                        </p>
                                        <p className="text-sm md:text-base font-bold text-slate-700 leading-relaxed italic">
                                            "{formData.description}"
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-primary uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                    <MapPin className="w-5 h-5" /> Office Location
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <DetailItem icon={Hash} label="Door / Office No" value={formData.address.dNo} />
                                    <DetailItem icon={MapPin} label="Street Name" value={formData.address.streetName} />
                                    <DetailItem icon={Building2} label="City" value={formData.address.city} />
                                    <DetailItem icon={Globe} label="District" value={formData.address.district} />
                                </div>
                            </div>
                        </div>

                        {/* Part 2: Contact Person Integrated */}
                        <div className="lg:col-span-4 self-start">
                            <div className="bg-slate-900 p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl text-white h-fit border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/20 transition-colors" />

                                <div className="relative z-10">
                                    <h3 className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-10 opacity-60">Main Contact Person</h3>

                                    <div className="space-y-10">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center font-bold text-2xl border border-white/20 text-primary uppercase shrink-0">
                                                {formData.contactPerson.name?.[0] || 'A'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xl md:text-2xl font-black truncate">{formData.contactPerson.name || 'Not Set'}</p>
                                                <p className="text-[11px] text-primary font-black uppercase tracking-widest mt-1">
                                                    {formData.contactPerson.designation || 'Position Not Specified'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-6 pt-10 border-t border-white/10">
                                            {[
                                                { icon: Smartphone, label: 'Mobile Number', value: formData.contactPerson.cellNo || 'Add Number' },
                                                { icon: Mail, label: 'Email Address', value: formData.contactPerson.email || 'Add Email' },
                                                { icon: Clock, label: 'Best Time to Call', value: formData.contactPerson.timing || 'Add Timings' }
                                            ].map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-5 group/item">
                                                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover/item:bg-primary group-hover/item:text-white transition-all duration-300 shrink-0">
                                                        <item.icon className="w-5 h-5 text-primary group-hover/item:text-white" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-0.5">{item.label}</p>
                                                        <span className="text-sm md:text-base font-bold block truncate">{item.value}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* EDIT MODE */
                <form onSubmit={handleUpdate} className="bg-transparent md:bg-white p-4 md:p-14 rounded-[2rem] md:rounded-[3.5rem] md:shadow-2xl md:border border-slate-100 space-y-8 md:space-y-12 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="flex flex-wrap justify-between items-center border-b border-slate-100 pb-6 md:pb-8 gap-4">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="flex items-center gap-2 md:gap-3 text-slate-400 hover:text-primary transition-all font-extrabold text-[10px] md:text-sm uppercase tracking-widest group"
                        >
                            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
                            Back to Profile
                        </button>
                        <h2 className="text-[10px] md:text-base font-extrabold text-slate-900 uppercase tracking-widest">Configure Company Details</h2>
                    </div>

                    <div className="gap-12 space-y-12">
                        {/* Section 1: Basic Info */}
                        <div className="space-y-6 md:space-y-8">
                            <h4 className="text-[10px] md:text-xs font-extrabold text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                                <Layout className="w-4 h-4 md:w-5 md:h-5" /> General Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="md:col-span-2">
                                    <label className={labelClass}>Organization Name</label>
                                    <input required className={inputClass} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: ABC Consultancy" />
                                </div>
                                <div className="md:col-span-1">
                                    <label className={labelClass}>Company Type</label>
                                    <input className={inputClass} value={formData.companyType} onChange={(e) => setFormData({ ...formData, companyType: e.target.value })} placeholder="Ex: Pvt Ltd" />
                                </div>
                                <div>
                                    <label className={labelClass}>HQ Contact Number</label>
                                    <input required className={inputClass} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="044-XXXXXXX" />
                                </div>
                                <div>
                                    <label className={labelClass}>WhatsApp Number</label>
                                    <input className={inputClass} value={formData.whatsapp_no} onChange={(e) => setFormData({ ...formData, whatsapp_no: e.target.value })} placeholder="+91 XXXXX XXXXX" />
                                </div>
                                <div>
                                    <label className={labelClass}>Company Category</label>
                                    <input className={inputClass} value={formData.companyCategory} onChange={(e) => setFormData({ ...formData, companyCategory: e.target.value })} placeholder="Ex: IT / Finance" />
                                </div>
                                <div className="md:col-span-1">
                                    <label className={labelClass}>Company Website</label>
                                    <input className={inputClass} value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://www.example.com" />
                                </div>
                                <div className="md:col-span-1">
                                    <label className={labelClass}>Employees Count</label>
                                    <input className={inputClass} value={formData.companySize} onChange={(e) => setFormData({ ...formData, companySize: e.target.value })} placeholder="Ex: 50-100" />
                                </div>
                                <div className="md:col-span-full">
                                    <label className={labelClass}>About Company (Description)</label>
                                    <textarea
                                        className={`${inputClass} min-h-[120px] py-4 resize-none`}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Tell us about your organization..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Address */}
                        <div className="space-y-8">
                            <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                                <MapPin className="w-5 h-5" /> Location & Address
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                <div>
                                    <label className={labelClass}>Door / Office No</label>
                                    <input className={inputClass} value={formData.address.dNo} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, dNo: e.target.value } })} placeholder="No: 123" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelClass}>Street / Area Name</label>
                                    <input className={inputClass} value={formData.address.streetName} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, streetName: e.target.value } })} placeholder="Building / Street..." />
                                </div>
                                <div>
                                    <label className={labelClass}>City</label>
                                    <input className={inputClass} value={formData.address.city} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })} placeholder="City name" />
                                </div>
                                <div className="md:col-span-full">
                                    <label className={labelClass}>District / Region</label>
                                    <input className={inputClass} value={formData.address.district} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, district: e.target.value } })} placeholder="State / District" />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Contact Person */}
                        <div className="space-y-8">
                            <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                                <User className="w-5 h-5" /> Main Contact Person (HR/Manager)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div>
                                    <label className={labelClass}>Person Name</label>
                                    <input className={inputClass} value={formData.contactPerson.name} onChange={(e) => setFormData({ ...formData, contactPerson: { ...formData.contactPerson, name: e.target.value } })} placeholder="Full name" />
                                </div>
                                <div>
                                    <label className={labelClass}>Designation</label>
                                    <input className={inputClass} value={formData.contactPerson.designation} onChange={(e) => setFormData({ ...formData, contactPerson: { ...formData.contactPerson, designation: e.target.value } })} placeholder="Ex: HR Manager" />
                                </div>
                                <div>
                                    <label className={labelClass}>Official Mobile No</label>
                                    <input className={inputClass} value={formData.contactPerson.cellNo} onChange={(e) => setFormData({ ...formData, contactPerson: { ...formData.contactPerson, cellNo: e.target.value } })} placeholder="Personal Cell No" />
                                </div>
                                <div className="md:col-span-1 lg:col-span-1">
                                    <label className={labelClass}>Direct Email</label>
                                    <input className={inputClass} type="email" value={formData.contactPerson.email} onChange={(e) => setFormData({ ...formData, contactPerson: { ...formData.contactPerson, email: e.target.value } })} placeholder="email@company.com" />
                                </div>
                                <div className="md:col-span-2 lg:col-span-2">
                                    <label className={labelClass}>Best Time to Contact</label>
                                    <input className={inputClass} value={formData.contactPerson.timing} onChange={(e) => setFormData({ ...formData, contactPerson: { ...formData.contactPerson, timing: e.target.value } })} placeholder="Ex: 10 AM to 5 PM" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 md:pt-12 border-t border-slate-100 mt-8 md:mt-12 text-center md:text-left">
                        <p className="text-[10px] md:text-sm text-slate-400 font-extrabold italic tracking-wide lowercase">* Please review all details before publishing.</p>
                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="w-full sm:w-auto px-10 py-4 md:py-5 rounded-xl md:rounded-2xl font-extrabold text-[10px] md:text-sm uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all border border-slate-100 md:border-none"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={saving}
                                className="w-full sm:w-auto bg-slate-900 text-white px-10 md:px-14 py-4 md:py-5 rounded-xl md:rounded-2xl font-extrabold text-[10px] md:text-sm uppercase tracking-[0.1em] hover:bg-primary transition-all flex items-center justify-center gap-4 shadow-xl disabled:opacity-50 group active:scale-95"
                            >
                                {saving ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Save className="w-4 h-4 md:w-5 md:h-5 md:w-6 md:h-6 group-hover:scale-125 transition-transform" />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
};

export default EmployerProfile;
