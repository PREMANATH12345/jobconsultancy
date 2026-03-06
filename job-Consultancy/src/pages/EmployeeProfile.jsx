
import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Briefcase, FileText, Save, Loader2, LogOut, GraduationCap, Calendar, IndianRupee, ShieldCheck, Upload, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { allService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { formatIndianNumber } from '../utils/helpers';

const EmployeeProfile = ({ hideHeader = false }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        whatsapp_no: '',
        dob: '',
        gender: '',
        education: '',
        address: { dNo: '', streetName: '', anjal: '', city: '', district: '' },
        experience: {
            type: 'Fresher',
            designation: '',
            lastSalary: '',
            years: '',
            workPlace: ''
        },
        expectations: {
            expectedSalary: '',
            job: '',
            workPlace: ''
        },
        documents: {
            passportPhoto: null,
            idProof: null,
            resume: null
        }
    });

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser || storedUser.role !== 'employee') {
            navigate('/login');
            return;
        }
        setUser(storedUser);
        fetchProfile(storedUser.id);
    }, [navigate]);

    const fetchProfile = async (id) => {
        try {
            const data = await allService.getData('users', { id });
            if (data && data.length > 0) {
                const profile = data[0];
                let details = {};

                try {
                    if (typeof profile.user_details === 'string') {
                        if (profile.user_details === '[object Object]') {
                            details = {};
                        } else {
                            try {
                                details = JSON.parse(profile.user_details);
                            } catch (err) {
                                details = {};
                            }
                        }
                    } else if (typeof profile.user_details === 'object') {
                        details = profile.user_details || {};
                    }
                } catch (e) {
                    details = {};
                }

                setFormData({
                    name: profile.name || '',
                    phone: profile.phone || '',
                    whatsapp_no: profile.whatsapp_no || '',
                    dob: details.dob || '',
                    gender: details.gender || '',
                    education: details.education || '',
                    address: details.address || { dNo: '', streetName: '', anjal: '', city: '', district: '' },
                    experience: details.experience || { type: 'Fresher', designation: '', lastSalary: '', years: '', workPlace: '' },
                    expectations: details.expectations || { expectedSalary: '', job: '', workPlace: '' },
                    documents: details.documents || { passportPhoto: null, idProof: null, resume: null }
                });
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updatedUserDetails = {
                dob: formData.dob,
                gender: formData.gender,
                education: formData.education,
                address: formData.address,
                experience: formData.experience,
                expectations: formData.expectations,
                documents: formData.documents
            };

            await allService.updateData('users', { id: user.id }, {
                name: formData.name,
                phone: formData.phone,
                whatsapp_no: formData.whatsapp_no,
                user_details: JSON.stringify(updatedUserDetails)
            });
            toast.success("Profile updated successfully!");

            const updatedUser = { ...user, name: formData.name };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            toast.error("Update failed");
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (file, type) => {
        if (!file) return;

        const toastId = toast.loading(`Uploading ${type}...`);
        try {
            const regNo = user.userId || user.user_id;
            const result = await allService.uploadFile(file, {
                subdirectory: `employees/${regNo}`,
                custom_name: `${type}_${regNo}`
            });

            if (result.public_url) {
                let relativePath = result.public_url;
                if (relativePath.indexOf('/uploads/') !== -1) {
                    relativePath = relativePath.substring(relativePath.indexOf('/uploads/'));
                }
                const newDocuments = { ...formData.documents, [type]: relativePath };
                setFormData(prev => ({ ...prev, documents: newDocuments }));

                const updatedUserDetails = {
                    dob: formData.dob,
                    gender: formData.gender,
                    education: formData.education,
                    address: formData.address,
                    experience: formData.experience,
                    expectations: formData.expectations,
                    documents: newDocuments
                };

                await allService.updateData('users', { id: user.id }, {
                    user_details: JSON.stringify(updatedUserDetails)
                });

                toast.success(`${type} uploaded and saved!`, { id: toastId });
            }
        } catch (error) {
            console.error(error);
            toast.error(`Upload failed: ${error.message}`, { id: toastId });
        }
    };

    const getFullUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const baseUrl = 'https://apiphp.dsofthub.com/jobconsultancy/';
        const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
        return `${baseUrl}${cleanUrl}`;
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const inputClass = "w-full px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none text-slate-900 transition-all font-bold text-sm md:text-base bg-white shadow-sm placeholder:text-slate-300 hover:border-slate-300";
    const labelClass = "text-[10px] md:text-sm font-extrabold text-slate-500 mb-2 block ml-1 uppercase tracking-wider";
    const sectionClass = "col-span-full border-b border-slate-100 pb-4 md:pb-6 mb-6 md:mb-8 mt-6 md:mt-10 flex items-center gap-4 flex-wrap";

    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-emerald-500" /></div>;

    return (
        <div className={`min-h-screen ${hideHeader ? 'pt-0' : 'pt-0 md:pt-24'} pb-20 px-0 md:px-4 ${hideHeader ? 'bg-transparent' : 'bg-slate-50'}`}>
            <div className={`max-w-6xl mx-auto ${hideHeader ? 'max-w-full' : ''}`}>
                {!hideHeader && (
                    <div className="hidden md:flex flex-col md:flex-row justify-between items-end mb-6 md:mb-10 gap-4 md:gap-6 px-4 md:px-0">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 shadow-sm border border-slate-100">
                                <User className="w-4 h-4 text-emerald-500" /> Employee Portal
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">My Profile</h1>
                            <p className="text-slate-500 font-bold mt-2 lowercase">Manage your professional details.</p>
                        </div>
                        <button onClick={handleLogout} className="bg-red-50 text-red-500 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-2">
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>
                )}

                {!isEditing ? (
                    <div className="bg-transparent md:bg-white md:rounded-[3rem] md:shadow-xl md:border-4 md:border-slate-100 overflow-hidden transition-all md:hover:shadow-2xl">
                        {/* Dossier Header */}
                        <div className="bg-slate-900 p-6 md:p-12 text-white flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left md:mx-0">
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl md:rounded-3xl bg-white/10 flex items-center justify-center border-2 border-white/20 overflow-hidden shrink-0">
                                    {formData.documents.passportPhoto ? (
                                        <img src={getFullUrl(formData.documents.passportPhoto)} className="w-full h-full object-cover" alt="Profile" />
                                    ) : <User className="w-10 h-10 md:w-12 md:h-12 text-white" />}
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter leading-tight">{formData.name}</h2>
                                    <p className="text-emerald-400 font-bold text-[10px] md:text-sm uppercase tracking-[0.2em]">Employee Profile</p>
                                </div>
                            </div>
                            <button onClick={() => setIsEditing(true)} className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 md:px-10 md:py-5 rounded-2xl font-black text-[11px] md:text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 active:scale-95">
                                <FileText className="w-4 h-4 md:w-5 md:h-5" /> Edit Profile Details
                            </button>
                        </div>

                        <div className="p-0 md:p-12 md:space-y-16">
                            {/* Personal Details View */}
                            <section className="bg-transparent p-5 md:p-0 mb-2 md:mb-6">
                                <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                                    <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-50 rounded-lg md:rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                        <User className="w-4 h-4 md:w-6 md:h-6" />
                                    </div>
                                    <h3 className="text-base md:text-xl font-black text-slate-900 uppercase tracking-tight">Personal Information</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 md:gap-10">
                                    {[
                                        { label: 'Full Name', value: formData.name },
                                        { label: 'Date of Birth', value: formData.dob },
                                        { label: 'Mobile Number', value: formData.phone },
                                        { label: 'WhatsApp', value: formData.whatsapp_no },
                                        { label: 'Address', value: `${formData.address.streetName} ${formData.address.city} ${t(`districtsList.${formData.address.district}`) !== `districtsList.${formData.address.district}` ? t(`districtsList.${formData.address.district}`) : formData.address.district}`.trim() }
                                    ].map((item, idx) => (
                                        <div key={idx} className="bg-transparent md:bg-slate-50/50 p-2 md:p-5 md:rounded-2xl md:border border-slate-100 md:hover:bg-white md:hover:shadow-md transition-all">
                                            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                                            <p className={`text-sm md:text-lg font-bold leading-tight ${item.value ? 'text-slate-900' : 'text-slate-300 uppercase italic text-xs'}`}>
                                                {item.value || 'Not Provided'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Professional Details View */}
                            <section className="bg-transparent p-5 md:p-0 mb-2 md:mb-6 pt-0 md:pt-12 md:border-t-2 md:border-slate-50">
                                <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                                    <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-50 rounded-lg md:rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                                        <Briefcase className="w-4 h-4 md:w-6 md:h-6" />
                                    </div>
                                    <h3 className="text-base md:text-xl font-black text-slate-900 uppercase tracking-tight">Career Details</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 md:gap-10">
                                    {[
                                        { label: 'Qualification', value: formData.education },
                                        { label: 'Experience Level', value: formData.experience.type },
                                        { label: 'Designation', value: formData.experience.designation },
                                        { label: 'Expected Salary', value: formData.expectations.expectedSalary ? `₹ ${formatIndianNumber(formData.expectations.expectedSalary)}` : null },
                                        { label: 'Desired Job', value: formData.expectations.job }
                                    ].map((item, idx) => (
                                        <div key={idx} className="bg-transparent md:bg-slate-50/50 p-2 md:p-5 md:rounded-2xl md:border border-slate-100 md:hover:bg-white md:hover:shadow-md transition-all">
                                            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                                            <p className={`text-sm md:text-lg font-bold leading-tight ${item.value ? 'text-slate-900' : 'text-slate-300 uppercase italic text-xs'}`}>
                                                {item.value || 'Not Provided'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Documents View */}
                            <section className="pt-12 border-t-2 border-slate-50">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase">Documents Status</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[
                                        { label: 'Passport Photo', present: !!formData.documents.passportPhoto },
                                        { label: 'ID Proof', present: !!formData.documents.idProof },
                                        { label: 'Professional Resume', present: !!formData.documents.resume }
                                    ].map((doc, idx) => (
                                        <div key={idx} className={`p-6 rounded-3xl border-2 flex items-center justify-between ${doc.present ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-slate-500 mb-1">{doc.label}</p>
                                                <p className={`text-sm font-black uppercase ${doc.present ? 'text-emerald-700' : 'text-red-700'}`}>
                                                    {doc.present ? 'Verified' : 'Missing'}
                                                </p>
                                            </div>
                                            {doc.present ? <ShieldCheck className="w-6 h-6 text-emerald-500" /> : <LogOut className="w-6 h-6 text-red-400 rotate-90" />}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                ) : (
                    <div className="relative">
                        <div className="flex flex-wrap justify-between items-center mb-6 md:mb-10 gap-4">
                            <button onClick={() => setIsEditing(false)} className="bg-white text-slate-900 px-4 md:px-8 py-2 md:py-4 rounded-xl md:rounded-2xl font-extrabold text-[10px] md:text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 border border-slate-200 shadow-sm">
                                <ArrowLeft className="w-4 h-4 text-emerald-500" /> Back to Profile
                            </button>
                            <div className="px-4 py-1.5 md:px-6 md:py-2 bg-emerald-50 text-emerald-600 rounded-full font-extrabold text-[9px] md:text-[10px] uppercase tracking-widest border border-emerald-100">
                                Editing Profile
                            </div>
                        </div>
                        <form onSubmit={handleUpdate} className="bg-white p-4 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-slate-50 space-y-6 md:space-y-8 transition-all hover:shadow-md">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                <div className={sectionClass}>
                                    <div className="w-9 h-9 md:w-14 md:h-14 rounded-lg md:rounded-2xl flex items-center justify-center text-white shadow-lg bg-emerald-500 shrink-0">
                                        <User className="w-4 h-4 md:w-8 md:h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg md:text-3xl font-extrabold text-slate-900 tracking-tight uppercase">Personal Information</h3>
                                        <p className="text-[10px] md:text-lg font-semibold text-slate-500 mt-0.5 md:mt-1">Your basic contact and identity details</p>
                                    </div>
                                </div>

                                <div className="col-span-1">
                                    <label className={labelClass}>{t('fullName')}</label>
                                    <input required className={inputClass} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                </div>

                                <div className="col-span-1">
                                    <label className={labelClass}>{t('dob') || 'Date of Birth'}</label>
                                    <input type="date" className={inputClass} value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} />
                                </div>

                                <div className="col-span-1">
                                    <label className={labelClass}>{t('mobileNumber')}</label>
                                    <input required className={inputClass} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                </div>

                                <div className="col-span-1">
                                    <label className={labelClass}>WhatsApp Number</label>
                                    <input className={inputClass} value={formData.whatsapp_no} onChange={(e) => setFormData({ ...formData, whatsapp_no: e.target.value })} />
                                </div>

                                <div className="col-span-full">
                                    <label className={labelClass}>Residential Address</label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <input placeholder="Door No / Street" className={inputClass} value={formData.address.streetName}
                                            onChange={(e) => setFormData({ ...formData, address: { ...formData.address, streetName: e.target.value } })} />
                                        <input placeholder="City" className={inputClass} value={formData.address.city}
                                            onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })} />
                                        <input placeholder="District" className={inputClass} value={formData.address.district}
                                            onChange={(e) => setFormData({ ...formData, address: { ...formData.address, district: e.target.value } })} />
                                    </div>
                                </div>

                                <div className={sectionClass}>
                                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-xl bg-emerald-500 shrink-0">
                                        <Briefcase className="w-5 h-5 md:w-8 md:h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">Professional Details</h3>
                                        <p className="text-[11px] md:text-lg font-bold text-slate-500 mt-0.5 md:mt-1">Your career history and expectations</p>
                                    </div>
                                </div>

                                <div className="col-span-1">
                                    <label className={labelClass}>{t('qualification')}</label>
                                    <input className={inputClass} value={formData.education} onChange={(e) => setFormData({ ...formData, education: e.target.value })} />
                                </div>

                                <div className="col-span-1">
                                    <label className={labelClass}>Experience Level</label>
                                    <select className={inputClass} value={formData.experience.type} onChange={(e) => setFormData({ ...formData, experience: { ...formData.experience, type: e.target.value } })}>
                                        <option>Fresher</option>
                                        <option>Experienced</option>
                                    </select>
                                </div>

                                {formData.experience.type === 'Experienced' && (
                                    <>
                                        <div className="col-span-1">
                                            <label className={labelClass}>{t('currentDesignation')}</label>
                                            <input className={inputClass} value={formData.experience.designation} onChange={(e) => setFormData({ ...formData, experience: { ...formData.experience, designation: e.target.value } })} />
                                        </div>
                                        <div className="col-span-1">
                                            <label className={labelClass}>Years of Experience</label>
                                            <input className={inputClass} value={formData.experience.years} onChange={(e) => setFormData({ ...formData, experience: { ...formData.experience, years: e.target.value } })} />
                                        </div>
                                        <div className="col-span-1">
                                            <label className={labelClass}>{t('lastSalary')}</label>
                                            <input className={inputClass} value={formData.experience.lastSalary} onChange={(e) => setFormData({ ...formData, experience: { ...formData.experience, lastSalary: e.target.value } })} />
                                        </div>
                                    </>
                                )}

                                <div className="col-span-1">
                                    <label className={labelClass}>{t('expectedSalary')}</label>
                                    <input className={inputClass} value={formData.expectations.expectedSalary} onChange={(e) => setFormData({ ...formData, expectations: { ...formData.expectations, expectedSalary: e.target.value } })} />
                                </div>

                                <div className="col-span-1">
                                    <label className={labelClass}>{t('desiredJob') || 'Desired Job Title'}</label>
                                    <input className={inputClass} value={formData.expectations.job} onChange={(e) => setFormData({ ...formData, expectations: { ...formData.expectations, job: e.target.value } })} />
                                </div>

                                <div className={sectionClass}>
                                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-xl bg-emerald-500 shrink-0">
                                        <FileText className="w-5 h-5 md:w-8 md:h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">Identification Documents</h3>
                                        <p className="text-[11px] md:text-lg font-bold text-slate-500 mt-0.5 md:mt-1">Upload your official ID and resume</p>
                                    </div>
                                </div>

                                <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                                    <div className="border-2 border-dashed border-slate-100 p-6 rounded-[2rem] text-center bg-slate-50/30 group/upload flex flex-col items-center">
                                        <label className={labelClass}>Passport Photo</label>
                                        {formData.documents.passportPhoto ? (
                                            <div className="relative group w-24 h-24 md:w-32 md:h-32 mx-auto mb-4">
                                                <img src={getFullUrl(formData.documents.passportPhoto)} className="w-full h-full object-cover rounded-2xl shadow-md border-2 border-white" alt="Passport" />
                                                <label className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer">
                                                    <Upload className="w-5 h-5" />
                                                    <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e.target.files[0], 'passportPhoto')} />
                                                </label>
                                            </div>
                                        ) : (
                                            <label className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-4 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-all text-slate-400">
                                                <User className="w-6 h-6 md:w-8 md:h-8 mb-2 group-hover/upload:scale-110 transition-transform" />
                                                <span className="text-[8px] font-black uppercase tracking-widest">Upload Photo</span>
                                                <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e.target.files[0], 'passportPhoto')} />
                                            </label>
                                        )}
                                    </div>

                                    <div className="border-2 border-dashed border-slate-100 p-6 rounded-[2rem] text-center bg-slate-50/30 group/upload flex flex-col items-center">
                                        <label className={labelClass}>ID Proof (Aadhar/DL)</label>
                                        {formData.documents.idProof ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-2xl flex items-center justify-center border-2 border-slate-50 shadow-sm">
                                                    <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-emerald-500" />
                                                </div>
                                                <label className="text-[10px] font-black text-emerald-600 uppercase cursor-pointer hover:underline mt-2">
                                                    Change ID Proof
                                                    <input type="file" hidden accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e.target.files[0], 'idProof')} />
                                                </label>
                                            </div>
                                        ) : (
                                            <label className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-4 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-all text-slate-400">
                                                <ShieldCheck className="w-6 h-6 md:w-8 md:h-8 mb-2 group-hover/upload:scale-110 transition-transform" />
                                                <span className="text-[8px] font-black uppercase tracking-widest">Upload ID</span>
                                                <input type="file" hidden accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e.target.files[0], 'idProof')} />
                                            </label>
                                        )}
                                    </div>

                                    <div className="border-2 border-dashed border-slate-100 p-6 rounded-[2rem] text-center bg-slate-50/30 group/upload flex flex-col items-center">
                                        <label className={labelClass}>Professional Resume</label>
                                        {formData.documents.resume ? (
                                            <div className="flex flex-col items-center gap-2 h-full justify-center">
                                                <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-2xl flex flex-col items-center justify-center border-2 border-slate-50 shadow-sm">
                                                    <FileText className="w-8 h-8 md:w-10 md:h-10 text-blue-500 mb-2" />
                                                </div>
                                                <label className="text-[10px] font-black text-blue-600 uppercase cursor-pointer hover:underline mt-2">
                                                    Update Resume
                                                    <input type="file" hidden accept=".pdf,.doc,.docx" onChange={(e) => handleFileUpload(e.target.files[0], 'resume')} />
                                                </label>
                                            </div>
                                        ) : (
                                            <label className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-4 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-all text-slate-400">
                                                <Briefcase className="w-6 h-6 md:w-8 md:h-8 mb-2 group-hover/upload:scale-110 transition-transform" />
                                                <span className="text-[8px] font-black uppercase tracking-widest">Upload CV</span>
                                                <input type="file" hidden accept=".pdf,.doc,.docx" onChange={(e) => handleFileUpload(e.target.files[0], 'resume')} />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 md:pt-8 flex justify-end border-t border-slate-100 mt-8 md:mt-12">
                                <button disabled={saving} className="w-full md:w-auto text-white px-8 md:px-12 py-3.5 md:py-5 rounded-xl md:rounded-2xl font-extrabold text-xs md:text-sm uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-3 md:gap-4 shadow-xl shadow-emerald-500/10 disabled:opacity-50" style={{ backgroundColor: 'oklch(0.696 0.17 162.48)' }}>
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 md:w-6 md:h-6" />}
                                    Save Profile Changes
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeProfile;
