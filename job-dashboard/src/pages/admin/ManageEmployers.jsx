import React, { useState, useEffect } from 'react';
import { Users, CheckCircle2, XCircle, Clock, ShieldCheck, Mail, Eye, ArrowLeft, Phone, MapPin, Building2, Globe, Calendar, Search, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { allService } from '../../services/api';

const ManageEmployers = () => {
    const [employers, setEmployers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployer, setSelectedEmployer] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchEmployers();
    }, []);

    const fetchEmployers = async () => {
        try {
            const data = await allService.getData('users', { role: 'employer' });
            setEmployers(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error("Error fetching data");
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await allService.updateData('users', { id }, { status });
            toast.success(`Employer ${status} successfully!`);
            if (selectedEmployer && selectedEmployer.id === id) {
                setSelectedEmployer({ ...selectedEmployer, status });
            }
            fetchEmployers();
        } catch (error) {
            toast.error("Action failed");
        }
    };

    const toggleAutoApprove = async (employer) => {
        try {
            const newValue = employer.auto_approve_jobs ? 0 : 1;
            await allService.updateData('users', { id: employer.id }, { auto_approve_jobs: newValue });

            // If enabling, also approve all pending jobs for this employer retroactively
            if (newValue === 1) {
                await allService.updateData('jobs', { employer_id: employer.id, status: 'pending' }, { status: 'approved' });
            }

            toast.success(`Auto-approval ${newValue ? 'enabled' : 'disabled'} for ${employer.name}`);

            if (selectedEmployer && selectedEmployer.id === employer.id) {
                setSelectedEmployer({ ...selectedEmployer, auto_approve_jobs: newValue });
            }

            fetchEmployers();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update auto-approval settings");
        }
    };

    const filteredEmployers = employers.filter(emp => {
        const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (selectedEmployer) {
        let details = {};
        try {
            details = typeof selectedEmployer.user_details === 'string'
                ? JSON.parse(selectedEmployer.user_details || '{}')
                : (selectedEmployer.user_details || {});
        } catch (e) {
            console.error("Failed to parse user_details", e);
        }

        const renderValue = (val) => {
            if (!val) return 'Not Specified';
            if (typeof val === 'object') {
                return Object.values(val).filter(v => v && typeof v !== 'object').join(', ');
            }
            return val;
        };

        return (
            <div className="p-4 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
                <button
                    onClick={() => setSelectedEmployer(null)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-500 transition-colors mb-6 md:mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Registry
                </button>

                <div className="bg-transparent md:bg-white rounded-none md:rounded-[3rem] shadow-none md:shadow-xl border-0 md:border md:border-slate-100 overflow-hidden">
                    <div className="bg-slate-900 p-8 md:p-12 md:rounded-none text-white flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
                        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                            <div className="w-24 h-24 md:w-24 md:h-24 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center font-black text-3xl md:text-4xl uppercase border border-white/10 shrink-0">
                                {selectedEmployer.name?.substring(0, 2) || 'NA'}
                            </div>
                            <div>
                                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">{selectedEmployer.name}</h2>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3">
                                    <span className={`px-5 py-1.5 rounded-full text-[10px] md:text-[10px] font-black uppercase tracking-widest ${selectedEmployer.status === 'approved' ? 'bg-emerald-500 text-white' :
                                        selectedEmployer.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                                        }`}>
                                        {selectedEmployer.status || 'pending'}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Registered: {new Date(selectedEmployer.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-center gap-3 w-full md:w-auto">
                            {selectedEmployer.status !== 'approved' && (
                                <button onClick={() => updateStatus(selectedEmployer.id, 'approved')} className="bg-emerald-500 hover:bg-emerald-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Approve</button>
                            )}
                            {selectedEmployer.status !== 'rejected' && (
                                <button onClick={() => updateStatus(selectedEmployer.id, 'rejected')} className="bg-red-500 hover:bg-red-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Reject</button>
                            )}
                        </div>
                    </div>

                    <div className="p-4 md:p-12 grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 bg-transparent md:bg-transparent">
                        <div className="lg:col-span-2 space-y-10 md:space-y-12">
                            <section>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Security & Permissions
                                </h3>
                                <div className={`p-6 md:p-8 rounded-[1.75rem] md:rounded-3xl border transition-all duration-300 flex flex-col sm:flex-row items-center justify-between gap-6 ${selectedEmployer.auto_approve_jobs ? 'bg-emerald-50 border-emerald-200 shadow-sm shadow-emerald-500/5' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="text-center sm:text-left">
                                        <p className={`font-black text-xl ${selectedEmployer.auto_approve_jobs ? 'text-emerald-900' : 'text-slate-900'}`}>Automatic Job Posting</p>
                                        <p className={`text-xs md:text-sm font-bold mt-1.5 ${selectedEmployer.auto_approve_jobs ? 'text-emerald-600' : 'text-slate-500'}`}>
                                            {selectedEmployer.auto_approve_jobs
                                                ? 'Enabled - Jobs will be published immediately without review.'
                                                : 'Disabled - Every job post will require manual approval.'}
                                        </p>
                                    </div>
                                    <label className="flex items-center cursor-pointer gap-4 shrink-0">
                                        <div className="relative">
                                            <input type="checkbox" className="sr-only" checked={!!selectedEmployer.auto_approve_jobs} onChange={() => toggleAutoApprove(selectedEmployer)} />
                                            <div className={`block w-14 md:w-16 h-8 md:h-9 rounded-full transition-all border-2 ${selectedEmployer.auto_approve_jobs ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-200 border-slate-300'}`}></div>
                                            <div className={`dot absolute left-1.5 top-1.5 bg-white w-5 md:w-6 h-5 md:h-6 rounded-full transition-transform duration-300 shadow-md ${selectedEmployer.auto_approve_jobs ? 'transform translate-x-6 md:translate-x-7' : ''}`}></div>
                                        </div>
                                    </label>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-emerald-500" /> Company Profile
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                                    {[
                                        { label: 'Company Type', value: details.companyType || details.company_type },
                                        { label: 'Industry', value: details.companyCategory || details.industry },
                                        { label: 'Company Website', value: details.website, isLink: true },
                                        { label: 'Employees', value: details.companySize || details.company_size },
                                    ].map((item, i) => (
                                        <div key={i} className="md:bg-white md:p-6 md:rounded-2xl md:border md:border-slate-100 flex flex-col gap-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                                            <p className={`text-sm md:text-base font-black ${item.isLink ? 'text-emerald-500 underline' : 'text-slate-900'}`}>
                                                {item.isLink && item.value ? (
                                                    <a
                                                        href={item.value.startsWith('http') ? item.value : `https://${item.value}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 cursor-pointer hover:text-emerald-600 transition-colors"
                                                    >
                                                        {item.value} <Globe className="w-3.5 h-3.5" />
                                                    </a>
                                                ) : renderValue(item.value)}
                                            </p>
                                            <div className="h-[1px] w-full bg-slate-100 mt-2 md:hidden" />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 md:bg-white md:p-8 md:rounded-3xl md:border md:border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">About Company</p>
                                    <p className="text-sm md:text-base font-bold text-slate-600 leading-relaxed italic border-l-4 border-emerald-500 pl-4 py-2 bg-slate-50/50 md:bg-transparent rounded-r-xl md:rounded-none">
                                        "{renderValue(details.description)}"
                                    </p>
                                </div>
                            </section>
                        </div>

                        <div className="space-y-10 md:space-y-12">
                            <section>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-emerald-500" /> Contact Details
                                </h3>
                                <div className="md:bg-white md:rounded-3xl md:border md:border-slate-100 md:divide-y md:divide-slate-50 space-y-6 md:space-y-0">
                                    {[
                                        { label: 'Representative', value: details.contactPerson?.name ? `${details.contactPerson.name} (${details.contactPerson.designation || 'Specialist'})` : null, icon: User },
                                        { label: 'Email Address', value: selectedEmployer.email || details.contactPerson?.email, icon: Mail },
                                        { label: 'Phone Number', value: selectedEmployer.phone || details.contact_phone || details.contactPerson?.cellNo, icon: Phone },
                                        { label: 'Office Timings', value: details.contactPerson?.timing, icon: Clock },
                                        { label: 'HQ Location', value: details.address || details.hq_location, icon: MapPin },
                                    ].filter(item => item.value).map((item, i) => (
                                        <div key={i} className="flex items-center gap-5 md:p-6">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm border border-emerald-100/50">
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{item.label}</p>
                                                <p className="text-sm md:text-base font-black text-slate-900 truncate">{renderValue(item.value)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-emerald-500" /> Registration Log
                                </h3>
                                <div className="md:bg-white p-6 md:p-8 rounded-[1.75rem] md:rounded-3xl md:border md:border-slate-100 bg-slate-900 md:shadow-none shadow-2xl">
                                    <div className="space-y-5">
                                        <div className="flex justify-between items-center bg-white/5 md:bg-transparent p-3 md:p-0 rounded-xl">
                                            <span className="text-[10px] font-black text-slate-400 md:text-slate-400 uppercase tracking-tight">System User ID</span>
                                            <span className="text-[10px] md:text-[11px] font-mono font-black text-white md:text-slate-900 bg-emerald-500/20 md:bg-slate-50 px-3 py-1 rounded-lg border border-emerald-500/20 md:border-slate-100">{selectedEmployer.user_id}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white/5 md:bg-transparent p-3 md:p-0 rounded-xl">
                                            <span className="text-[10px] font-black text-slate-400 md:text-slate-400 uppercase tracking-tight">Unique Database ID</span>
                                            <span className="text-[10px] md:text-[11px] font-mono font-black text-white md:text-slate-900 bg-emerald-500/20 md:bg-slate-50 px-3 py-1 rounded-lg border border-emerald-500/20 md:border-slate-100">#{selectedEmployer.id}</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-10 max-w-7xl mx-auto">
            <div className="mb-10 md:mb-14 flex flex-col lg:flex-row lg:items-end justify-between gap-8 text-left">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 uppercase tracking-tight">Employer registry</h1>
                    <p className="text-sm font-medium text-slate-400 mt-1">Manage and authorize company organizer accounts.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Find employer..."
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-100 shadow-lg focus:border-emerald-500 outline-none text-sm font-bold sm:min-w-[280px] transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="w-full sm:w-auto px-4 py-3 rounded-xl bg-white border border-slate-100 shadow-lg focus:border-emerald-500 outline-none text-xs font-bold uppercase tracking-wider cursor-pointer min-w-[150px]"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Every status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:gap-8">
                {filteredEmployers.length === 0 && !loading && (
                    <div className="text-center py-20 md:py-32 bg-white rounded-[2rem] md:rounded-[4rem] border-2 border-dashed border-slate-100 shadow-sm transition-all animate-in fade-in zoom-in duration-500">
                        <Users className="w-16 h-16 md:w-24 md:h-24 text-slate-100 mx-auto mb-6 md:mb-8" />
                        <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">No accounts match criteria</h3>
                        <p className="text-sm md:text-base font-bold text-slate-400 mt-2 lowercase">Try broadening your search or resetting the registry filters.</p>
                    </div>
                )}

                {filteredEmployers.map((emp) => (
                    <div key={emp.id} className="bg-white p-4 md:p-12 rounded-[1.5rem] md:rounded-[4rem] shadow-xl border border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between group hover:border-emerald-500/50 transition-all duration-500 overflow-hidden relative gap-4 md:gap-8 text-left">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity hidden lg:block">
                            <Building2 className="w-48 h-48 text-slate-900 -rotate-12" />
                        </div>

                        <div className="flex items-start sm:items-center gap-4 md:gap-10 relative z-10 w-full lg:w-auto">
                            <div className={`w-14 h-14 md:w-28 md:h-28 rounded-2xl md:rounded-[2.5rem] ${emp.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : emp.status === 'rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'} flex items-center justify-center font-black text-xl md:text-4xl uppercase border-2 md:border-4 border-white shadow-lg shrink-0`}>
                                {emp.name?.substring(0, 2) || 'NA'}
                            </div>
                            <div className="flex-1 min-w-0 py-1">
                                <h3 className="text-lg md:text-3xl font-black text-slate-900 uppercase tracking-tighter group-hover:text-emerald-500 transition-colors italic truncate">{emp.name}</h3>
                                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-1.5 md:gap-8 mt-1 md:mt-4">
                                    <span className="flex items-center gap-1.5 text-[11px] md:text-base font-bold text-slate-400 lowercase italic truncate max-w-[180px] md:max-w-[250px]">
                                        <Mail className="w-3 h-3 md:w-5 md:h-5 text-emerald-500 shrink-0" /> {emp.email}
                                    </span>
                                    <span className={`px-3 md:px-6 py-1 md:py-2.5 rounded-full text-[8px] md:text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm ${emp.status === 'approved' ? 'bg-emerald-500 text-white' :
                                        emp.status === 'rejected' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
                                        }`}>
                                        {emp.status === 'pending' && <Clock className="w-2.5 h-2.5" />}
                                        {emp.status || 'pending'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-5 relative z-10 w-full lg:w-auto">
                            <div className={`flex items-center gap-3 ${emp.auto_approve_jobs ? 'bg-emerald-500 text-white' : 'bg-slate-900'} px-4 md:px-8 py-2.5 md:py-5 rounded-xl md:rounded-[2rem] border animate-in slide-in-from-right-2 duration-300 ${emp.auto_approve_jobs ? 'border-emerald-400' : 'border-slate-800'}`}>
                                <label className="flex items-center cursor-pointer gap-3 md:gap-6 flex-1">
                                    <div className="relative shrink-0">
                                        <input type="checkbox" className="sr-only" checked={!!emp.auto_approve_jobs} onChange={() => toggleAutoApprove(emp)} />
                                        <div className={`block w-10 md:w-16 h-6 md:h-9 rounded-full border-2 ${emp.auto_approve_jobs ? 'bg-white border-white' : 'bg-slate-700 border-slate-600'} transition-all`}></div>
                                        <div className={`dot absolute left-1 top-1 w-3.5 md:w-5 h-3.5 md:h-5 rounded-full shadow-sm transition-transform ${emp.auto_approve_jobs ? 'transform translate-x-4 md:translate-x-7 bg-emerald-500' : 'bg-slate-400'}`}></div>
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className={`text-[8px] md:text-xs font-black uppercase tracking-wide ${emp.auto_approve_jobs ? 'text-white' : 'text-slate-200'}`}>Auto-Approve</span>
                                        <span className={`text-[7px] md:text-[10px] font-bold uppercase tracking-widest ${emp.auto_approve_jobs ? 'text-white/80' : 'text-slate-400'}`}>{emp.auto_approve_jobs ? 'Active' : 'Manual'}</span>
                                    </div>
                                </label>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSelectedEmployer(emp)}
                                    className="flex-1 sm:flex-none bg-slate-900 text-white px-5 py-3 md:py-5 rounded-xl md:rounded-3xl font-black text-[9px] md:text-sm uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-lg"
                                >
                                    <Eye className="w-3.5 h-3.5 md:w-6 md:h-6" /> Details
                                </button>
                                {emp.status !== 'approved' && (
                                    <button
                                        onClick={() => updateStatus(emp.id, 'approved')}
                                        className="bg-emerald-500 text-white p-3 md:p-5 rounded-xl md:rounded-3xl font-black hover:bg-emerald-600 transition-all shadow-lg hover:scale-105"
                                        title="Verify"
                                    >
                                        <CheckCircle2 className="w-5 h-5 md:w-7 md:h-7" />
                                    </button>
                                )}
                                {emp.status !== 'rejected' && (
                                    <button
                                        onClick={() => updateStatus(emp.id, 'rejected')}
                                        className="bg-rose-500 text-white p-3 md:p-5 rounded-xl md:rounded-3xl font-black hover:bg-rose-600 transition-all shadow-lg hover:scale-105"
                                        title="Deactivate"
                                    >
                                        <XCircle className="w-5 h-5 md:w-7 md:h-7" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ManageEmployers;
