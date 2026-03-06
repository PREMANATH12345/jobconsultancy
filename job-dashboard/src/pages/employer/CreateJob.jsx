import React, { useState } from 'react';
import { Briefcase, MapPin, IndianRupee, Layout, FileText, Send, Loader2, Building2, User, Users, Landmark, Calendar, Award, CheckCircle, Globe, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { allService } from '../../services/api';

const CreateJob = () => {
    const [loading, setLoading] = useState(false);
    const user = JSON.parse(sessionStorage.getItem('user')) || {};

    // Selection Step: 'select', 'govt', 'private', 'pricing'
    const [step, setStep] = useState('loading');
    const [subscription, setSubscription] = useState(null);
    const [jobsPosted, setJobsPosted] = useState(0);
    const [rejectedCount, setRejectedCount] = useState(0);

    const isLimitReached = subscription && subscription.job_limit !== -1 && jobsPosted >= subscription.job_limit;
    const mustUpgrade = !subscription || isLimitReached;

    const [formData, setFormData] = useState({
        // Common
        title: '',
        description: '',
        category: 'Private', // 'Government' or 'Private'
        job_role_category: 'Administrative', // Default category

        // Government Specific
        govt_type: 'Central Government', // Central / State
        department: '', // NEW FIELD
        sector: 'Banking', // Army, Navy, Banking...
        vacancy: '',
        application_mode: 'Online',
        exam_fee: '',
        last_date: '',
        post_name: '',
        application_start_date: '',
        min_age: '',
        max_age: '',
        age_relaxation: '',
        selection_process: '',

        // Private Specific
        company_name: '',
        company_logo: '',
        location: '',
        shift: 'Day Shift',
        salary_range: '',
        job_type: 'Full Time',
        skills: '',
        experience: '',
        language: '',
        responsibilities: '',
        qualification: '',
        age_limit: '',
        work_mode: 'Work from Office',

        // Company Details (Private)
        company_industry: '',
        company_type: 'Private Ltd',
        company_employees: '',
        company_turnover: '',

        // Job Status Details (Private)
        application_deadline: '',

        // Expiry (Website Cleanup)
        expiry_date: '',
        expiry_time: '23:59' // Default End Time
    });

    const jobCategories = [
        "Administrative", "IT / Telecom", "Labour & Helper", "Marketing",
        "Medical", "Office Staff", "Sales", "Technician & Mechanic"
    ];

    const PLANS = [
        { name: 'Starter', price: 999, limit: 5, color: 'from-blue-500 to-indigo-600' },
        { name: 'Growth', price: 2499, limit: 20, color: 'from-purple-500 to-pink-600' },
        { name: 'Unlimited', price: 4999, limit: -1, color: 'from-amber-500 to-orange-600' }
    ];

    const getSubscription = (subs) => {
        if (!user.id || !Array.isArray(subs)) return null;
        return subs.find(s =>
            String(s.employer_id).trim() == String(user.id).trim() &&
            String(s.status).trim().toLowerCase() === 'active'
        );
    };

    const checkStatus = async () => {
        try {
            const [subs, myJobs] = await Promise.all([
                allService.getData('subscriptions', { employer_id: user.id }),
                allService.getData('jobs', { employer_id: user.id })
            ]);

            const activeSub = getSubscription(subs);
            setSubscription(activeSub);

            // Calculate limits: only count pending and approved jobs against the limit
            const validJobsCount = Array.isArray(myJobs) ? myJobs.filter(j =>
                String(j.status).trim().toLowerCase() !== 'rejected'
            ).length : 0;

            const rejectedJobsCount = Array.isArray(myJobs) ? myJobs.filter(j =>
                String(j.status).trim().toLowerCase() === 'rejected'
            ).length : 0;

            setJobsPosted(validJobsCount);
            setRejectedCount(rejectedJobsCount);

            if (!activeSub) {
                setStep('pricing');
            } else {
                const reached = activeSub.job_limit !== -1 && validJobsCount >= activeSub.job_limit;
                if (reached) {
                    setStep('pricing');
                } else if (step === 'loading') {
                    setStep('select');
                }
            }
        } catch (error) {
            console.error("Status check failed", error);
            if (step === 'loading') setStep('select');
        }
    };

    React.useEffect(() => {
        checkStatus();
    }, [user.id]);

    const handlePayment = async (plan) => {
        setLoading(true);
        try {
            const res = await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.onload = () => {
                    const options = {
                        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                        amount: plan.price * 100,
                        currency: "INR",
                        name: "Job Consultancy",
                        description: `Subscription: ${plan.name} Plan`,
                        handler: async (response) => {
                            try {
                                const subPayload = {
                                    employer_id: user.id,
                                    plan_name: plan.name,
                                    amount: plan.price,
                                    job_limit: plan.limit,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    status: 'active'
                                };
                                await allService.insertData('subscriptions', subPayload);
                                setSubscription(subPayload);
                                setStep('select');
                                toast.success("Payment Successful! Your plan is activated.");
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        },
                        prefill: { name: user.name, email: user.email },
                        theme: { color: "#000000" }
                    };
                    const rzp = new window.Razorpay(options);
                    rzp.open();
                };
                script.onerror = () => reject(new Error('Razorpay SDK failed to load'));
                document.body.appendChild(script);
            });
        } catch (error) {
            toast.error("Payment failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Final sanity check for limit
        if (mustUpgrade) {
            toast.error("Subscription required or limit reached! Please upgrade your plan.");
            setStep('pricing');
            return;
        }

        setLoading(true);
        try {
            // Prepare payload based on type
            const commonFields = ['title', 'description', 'category', 'job_role_category', 'job_expiry'];
            const govtFields = ['govt_type', 'department', 'sector', 'vacancy', 'application_mode', 'exam_fee', 'last_date', 'post_name', 'application_start_date', 'min_age', 'max_age', 'age_relaxation', 'selection_process'];
            const privateFields = ['company_name', 'company_logo', 'location', 'shift', 'salary_range', 'job_type', 'skills', 'experience', 'language', 'responsibilities', 'qualification', 'age_limit', 'work_mode', 'company_industry', 'company_type', 'company_employees', 'company_turnover', 'application_deadline', 'posted_date'];

            const relevantFields = formData.category === 'Government'
                ? [...commonFields, ...govtFields]
                : [...commonFields, ...privateFields];

            // Calculate job_expiry from dedicated fields
            let job_expiry = null;
            if (formData.expiry_date && formData.expiry_time) {
                job_expiry = `${formData.expiry_date} ${formData.expiry_time}:00`;
            }

            const cleanedData = {};
            if (job_expiry) cleanedData.job_expiry = job_expiry;

            relevantFields.forEach(field => {
                if (formData[field] !== undefined && field !== 'job_expiry' && field !== 'expiry_date' && field !== 'expiry_time') {
                    // Send null instead of empty string or '0000-00-00' for dates/optional fields
                    if (formData[field] === '' || formData[field] === '0000-00-00') {
                        cleanedData[field] = null;
                    } else {
                        cleanedData[field] = formData[field];
                    }
                }
            });

            const payload = {
                ...cleanedData,
                employer_id: user.id,
                status: (user.auto_approve_jobs == 1 || user.auto_approve_jobs == true) ? 'approved' : 'pending'
            };

            await allService.insertData('jobs', payload);
            if (user.auto_approve_jobs) {
                toast.success("Job posted and approved automatically!", { icon: '⚡' });
            } else {
                toast.success("Job request sent to Admin for approval!", { icon: '🚀' });
            }

            // Reset the form data
            setFormData(prev => ({
                ...prev,
                title: '', description: '', vacancy: '', exam_fee: '', last_date: '',
                company_name: '', location: '', salary_range: '', skills: '', experience: '', department: ''
            }));

            // Re-check status to verify if limit is reached now
            await checkStatus();

            // Only go back to select if we haven't hit the limit
            // checkStatus will handle setting step to pricing if limit is hit
            if (!isLimitReached) {
                setStep('select');
            }

        } catch (error) {
            console.error(error);
            toast.error("Failed to post job");
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full pl-12 pr-6 py-4 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none text-slate-900 transition-all font-bold text-sm mb-4";
    const labelClass = "text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block";
    const iconClass = "absolute left-4 top-[2.4rem] w-5 h-5 text-slate-300";

    // --- LOADING STATE ---
    if (step === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-10">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Verifying Account Status...</p>
            </div>
        );
    }

    // --- PRICING STEP / LIMIT REACHED ---
    if (step === 'pricing' || mustUpgrade) {
        return (
            <div className="p-10 max-w-6xl mx-auto animate-in fade-in duration-500">
                {isLimitReached && (
                    <div className="mb-12 bg-rose-50 border-2 border-rose-100 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-rose-500/5">
                        <div className="w-16 h-16 bg-rose-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <h3 className="text-xl font-black text-rose-900 uppercase tracking-tight">Subscription Limit Reached!</h3>
                            <p className="text-sm font-bold text-rose-700/80 leading-relaxed mt-1 italic">
                                You have posted {jobsPosted} jobs out of your {subscription.job_limit} job limit.
                                Please upgrade your plan to continue publishing new opportunities.
                            </p>
                        </div>
                        <div className="bg-white px-6 py-3 rounded-2xl border border-rose-100">
                            <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-1">Current Usage</span>
                            <span className="text-lg font-black text-rose-900">{jobsPosted} / {subscription.job_limit} Jobs</span>
                        </div>
                    </div>
                )}

                <div className="mb-16 text-center">
                    <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter mb-4">
                        {isLimitReached ? 'Upgrade Your Potential' : 'Choose Your Plan'}
                    </h1>
                    <p className="text-lg font-bold text-slate-400 max-w-2xl mx-auto">
                        {isLimitReached
                            ? "Your current plan has served you well, but it's time to grow. Pick a higher capacity plan to keep hiring."
                            : "To post jobs and find great talent, please select a subscription plan that fits your organization's needs."}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {PLANS.map((plan, i) => (
                        <div key={i} className={`bg-white rounded-[3rem] p-10 border-2 border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center relative overflow-hidden group`}>
                            <div className={`absolute top-0 inset-x-0 h-2 bg-gradient-to-r ${plan.color}`} />
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">{plan.name}</h3>
                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-4xl font-black text-slate-900">₹{plan.price}</span>
                                <span className="text-slate-400 font-bold text-sm uppercase">/month</span>
                            </div>
                            <div className="w-full space-y-4 mb-10">
                                <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span className="font-bold text-slate-700">{plan.limit === -1 ? 'Unlimited' : plan.limit} Job Posts</span>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-center gap-3 opacity-50">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span className="font-bold text-slate-700">Dedicated Support</span>
                                </div>
                            </div>
                            <button
                                onClick={() => handlePayment(plan)}
                                disabled={loading}
                                className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition-all shadow-lg ${loading ? 'bg-slate-100 text-slate-400' : `bg-slate-900 text-white hover:bg-black hover:scale-105 shadow-slate-200/50`}`}
                            >
                                {loading ? 'Processing...' : 'Activate Plan'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // --- STEP 1: SELECTION ---
    if (step === 'select') {
        const remaining = subscription ? (subscription.job_limit === -1 ? '∞' : subscription.job_limit - jobsPosted) : 0;
        // isLimitReached is already defined at top level

        return (
            <div className="p-10 max-w-5xl mx-auto">
                <div className="mb-10 text-center flex flex-col items-center">
                    <div className="inline-flex items-center gap-4 bg-white border border-slate-100 px-6 py-3 rounded-full shadow-sm mb-6">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Plan:</span>
                            <span className="text-[10px] font-black text-primary uppercase bg-primary/5 px-2 py-1 rounded-md">{subscription?.plan_name}</span>
                        </div>
                        <div className="h-4 w-px bg-slate-100" />
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jobs Posted:</span>
                            <span className="text-[10px] font-black text-slate-900">{jobsPosted} / {subscription?.job_limit === -1 ? '∞' : subscription?.job_limit}</span>
                        </div>
                    </div>

                    <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Post New Opportunity</h1>
                    <p className="text-sm font-bold text-slate-400 mt-2 lowercase">Choose the type of listing you want to create.</p>

                    {remaining > 0 && remaining !== '∞' && rejectedCount > 0 && (
                        <div className="mt-8 bg-amber-50 border border-amber-100 p-6 rounded-[2rem] flex items-center gap-6 max-w-2xl">
                            <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                                <Award className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-black text-amber-900 uppercase tracking-tight">Limit Re-granted!</p>
                                <p className="text-xs font-bold text-amber-700/80 leading-relaxed">Admin has rejected {rejectedCount} of your jobs. This limit has been added back to your account. You can now post {remaining} more job{remaining > 1 ? 's' : ''}.</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Government Job Card */}
                    <div
                        onClick={() => {
                            if (isLimitReached) return toast.error("Plan limit reached! Upgrade to post more.");
                            setStep('govt');
                            setFormData({ ...formData, category: 'Government' });
                        }}
                        className={`bg-white p-10 rounded-[3rem] border-2 transition-all group text-center ${isLimitReached ? 'opacity-50 cursor-not-allowed grayscale' : 'border-slate-100 hover:border-secondary hover:shadow-xl cursor-pointer'}`}
                    >
                        <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-secondary/10 transition-colors">
                            <Landmark className="w-10 h-10 text-slate-400 group-hover:text-secondary transition-colors" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Government Job</h3>
                        <p className="text-sm font-bold text-slate-400">Posts for State/Central Govt, Army, Navy, Banking sectors.</p>
                        {isLimitReached && <div className="mt-4 text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-50 py-1 rounded-full">Limit Reached</div>}
                    </div>

                    {/* Private Job Card */}
                    <div
                        onClick={() => {
                            if (isLimitReached) return toast.error("Plan limit reached! Upgrade to post more.");
                            setStep('private');
                            setFormData({ ...formData, category: 'Private' });
                        }}
                        className={`bg-white p-10 rounded-[3rem] border-2 transition-all group text-center ${isLimitReached ? 'opacity-50 cursor-not-allowed grayscale' : 'border-slate-100 hover:border-secondary hover:shadow-xl cursor-pointer'}`}
                    >
                        <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-secondary/10 transition-colors">
                            <Briefcase className="w-10 h-10 text-slate-400 group-hover:text-secondary transition-colors" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Private Job</h3>
                        <p className="text-sm font-bold text-slate-400">Corporate openings, internships, full-time & part-time roles.</p>
                        {isLimitReached && <div className="mt-4 text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-50 py-1 rounded-full">Limit Reached</div>}
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <button onClick={() => setStep('pricing')} className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-transparent hover:border-slate-200 transition-all pb-1">
                        Change / Upgrade Plan
                    </button>
                </div>
            </div>
        );
    }

    // --- SHARED FORM WRAPPER ---
    return (
        <div className="p-10 max-w-4xl mx-auto">
            <button onClick={() => setStep('select')} className="mb-6 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors">
                ← Back to Selection
            </button>
            <div className="mb-10">
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                    Post {step === 'govt' ? 'Government' : 'Private'} Job
                </h1>
                <p className="text-sm font-bold text-slate-400 mt-1 lowercase">Fill in the details below.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 space-y-6">

                {/* --- GOVERNMENT FORM --- */}
                {step === 'govt' && (
                    <div className="space-y-8">
                        {/* SIMPLIFIED GOVERNMENT FORM */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                                <Landmark className="w-4 h-4 text-primary" /> Government Job Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="relative">
                                    <label className={labelClass}>Job Type</label>
                                    <Landmark className={iconClass} />
                                    <select required className={inputClass} value={formData.govt_type} onChange={(e) => setFormData({ ...formData, govt_type: e.target.value })}>
                                        <option>Central Government</option>
                                        <option>State Government</option>
                                        <option>Public Sector Unit (PSU)</option>
                                    </select>
                                </div>
                                <div className="relative">
                                    <label className={labelClass}>Designation</label>
                                    <Award className={iconClass} />
                                    <input required className={inputClass} placeholder="e.g. Probationary Officer" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                                </div>
                                <div className="relative col-span-full">
                                    <label className={labelClass}>Recruiting Organization / Department</label>
                                    <Building2 className={iconClass} />
                                    <input required className={inputClass} placeholder="e.g. Ministry of Finance / TANGEDCO" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
                                </div>
                                <div className="relative">
                                    <label className={labelClass}>Total Vacancies</label>
                                    <User className={iconClass} />
                                    <input required type="number" className={inputClass} placeholder="e.g. 500" value={formData.vacancy} onChange={(e) => setFormData({ ...formData, vacancy: e.target.value })} />
                                </div>
                                <div className="relative">
                                    <label className={labelClass}>Mode of Application</label>
                                    <Layout className={iconClass} />
                                    <select className={inputClass} value={formData.application_mode} onChange={(e) => setFormData({ ...formData, application_mode: e.target.value })}>
                                        <option>Online</option>
                                        <option>Offline</option>
                                        <option>Both</option>
                                    </select>
                                </div>
                                <div className="relative">
                                    <label className={labelClass}>Mode of Examination</label>
                                    <FileText className={iconClass} />
                                    <input className={inputClass} placeholder="Written, Interview..." value={formData.selection_process} onChange={(e) => setFormData({ ...formData, selection_process: e.target.value })} />
                                </div>
                                <div className="relative">
                                    <label className={labelClass}>Last Date to Apply</label>
                                    <Calendar className={iconClass} />
                                    <input required type="date" className={inputClass} value={formData.last_date} onChange={(e) => setFormData({ ...formData, last_date: e.target.value })} />
                                </div>
                                <div className="relative">
                                    <label className={labelClass}>Remove Post On (Date)</label>
                                    <Calendar className={iconClass} />
                                    <input type="date" className={inputClass} value={formData.expiry_date} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} />
                                </div>
                                <div className="relative">
                                    <label className={labelClass}>Remove Post At (Time)</label>
                                    <Clock className={iconClass} />
                                    <input type="time" className={inputClass} value={formData.expiry_time} onChange={(e) => setFormData({ ...formData, expiry_time: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* SYSTEM CONTROLLED */}
                        <div className="p-4 bg-slate-50 rounded-xl flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-900">Status: Pending Approval</p>
                                <p className="text-[10px] text-slate-400">Post will be active after admin approves.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- PRIVATE FORM --- */}
                {
                    step === 'private' && (
                        <div className="space-y-8">
                            {/* 1. BASIC JOB DETAILS */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-primary" /> 1. Basic Job Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="relative">
                                        <label className={labelClass}>Job Title</label>
                                        <FileText className={iconClass} />
                                        <input required className={inputClass} placeholder="e.g. Sales Executive" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                                    </div>
                                    <div className="relative">
                                        <label className={labelClass}>Company Name</label>
                                        <Building2 className={iconClass} />
                                        <input required className={inputClass} placeholder="Company Name" value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} />
                                    </div>
                                    <div className="relative">
                                        <label className={labelClass}>Company Logo URL (Optional)</label>
                                        <Layout className={iconClass} />
                                        <input className={inputClass} placeholder="e.g. https://logo.com/img.png" value={formData.company_logo} onChange={(e) => setFormData({ ...formData, company_logo: e.target.value })} />
                                    </div>
                                    <div className="relative">
                                        <label className={labelClass}>Job Location</label>
                                        <MapPin className={iconClass} />
                                        <input required className={inputClass} placeholder="City / Area" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                                    </div>
                                    <div className="relative">
                                        <label className={labelClass}>Job Type</label>
                                        <Briefcase className={iconClass} />
                                        <select className={inputClass} value={formData.job_type} onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}>
                                            <option>Full Time</option>
                                            <option>Part Time</option>
                                            <option>Internship</option>
                                            <option>Contract</option>
                                            <option>Any</option>
                                        </select>
                                    </div>
                                    <div className="relative">
                                        <label className={labelClass}>Shift Timing</label>
                                        <Clock className={iconClass} />
                                        <input required className={inputClass} placeholder="e.g. 10:00 AM - 6:00 PM / Day Shift" value={formData.shift} onChange={(e) => setFormData({ ...formData, shift: e.target.value })} />
                                    </div>
                                    <div className="relative">
                                        <label className={labelClass}>Total Openings</label>
                                        <User className={iconClass} />
                                        <input required type="number" className={inputClass} placeholder="e.g. 10" value={formData.vacancy} onChange={(e) => setFormData({ ...formData, vacancy: e.target.value })} />
                                    </div>
                                    <div className="relative">
                                        <label className={labelClass}>Salary Range (Monthly)</label>
                                        <IndianRupee className={iconClass} />
                                        <input required className={inputClass} placeholder="e.g. 15000 - 25000" value={formData.salary_range} onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })} />
                                    </div>
                                    <div className="relative">
                                        <label className={labelClass}>Experience Required</label>
                                        <Award className={iconClass} />
                                        <select className={inputClass} value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })}>
                                            <option value="">Select Experience</option>
                                            <option>Fresher</option>
                                            <option>0 - 1 Year</option>
                                            <option>1 - 2 Years</option>
                                            <option>2 - 5 Years</option>
                                            <option>5+ Years</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* 2. JOB DESCRIPTION */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" /> 2. Job Description
                                </h3>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <label className={labelClass}>About the Role</label>
                                        <textarea required className={`${inputClass} !h-32 pt-4 px-4`} placeholder="Brief description of the job..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            {/* 3. REQUIRED SKILLS */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                                    <Award className="w-4 h-4 text-primary" /> 3. Required Skills
                                </h3>
                                <div className="relative">
                                    <label className={labelClass}>Skills (Comma Separated)</label>
                                    <Award className={iconClass} />
                                    <input className={inputClass} placeholder="e.g. Communication, Tally, Excel" value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} />
                                </div>
                            </div>

                            {/* 4. JOB REQUIREMENTS */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-primary" /> 4. Job Requirements
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="relative">
                                        <label className={labelClass}>Languages Known</label>
                                        <Globe className={iconClass} />
                                        <input className={inputClass} placeholder="e.g. Tamil, English" value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            {/* 5. COMPANY DETAILS */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-primary" /> 5. Company Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="relative">
                                        <label className={labelClass}>Industry</label>
                                        <Building2 className={iconClass} />
                                        <input className={inputClass} placeholder="e.g. IT Services, Retail" value={formData.company_industry} onChange={(e) => setFormData({ ...formData, company_industry: e.target.value })} />
                                    </div>
                                    <div className="relative">
                                        <label className={labelClass}>Company Type</label>
                                        <Building2 className={iconClass} />
                                        <select className={inputClass} value={formData.company_type} onChange={(e) => setFormData({ ...formData, company_type: e.target.value })}>
                                            <option>Private Ltd</option>
                                            <option>Partnership</option>
                                            <option>Startup</option>
                                            <option>Sole Proprietorship</option>
                                            <option>MNC</option>
                                        </select>
                                    </div>
                                    <div className="relative">
                                        <label className={labelClass}>No. of Employees</label>
                                        <Users className={iconClass} />
                                        <select className={inputClass} value={formData.company_employees} onChange={(e) => setFormData({ ...formData, company_employees: e.target.value })}>
                                            <option value="">Select Range</option>
                                            <option>1 - 10</option>
                                            <option>10 - 50</option>
                                            <option>50 - 200</option>
                                            <option>200+</option>
                                        </select>
                                    </div>
                                    <div className="relative">
                                        <label className={labelClass}>Turnover (Optional)</label>
                                        <IndianRupee className={iconClass} />
                                        <input className={inputClass} placeholder="e.g. 1 Cr" value={formData.company_turnover} onChange={(e) => setFormData({ ...formData, company_turnover: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            {/* 6. JOB STATUS */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-primary" /> 6. Job Status Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="relative">
                                        <label className={labelClass}>Posted Date</label>
                                        <Calendar className={iconClass} />
                                        <input type="date" className={inputClass} value={formData.posted_date || ''} onChange={(e) => setFormData({ ...formData, posted_date: e.target.value })} />
                                    </div>
                                    <div className="relative">
                                        <label className={labelClass}>Application Deadline</label>
                                        <Calendar className={iconClass} />
                                        <input type="date" className={inputClass} value={formData.application_deadline} onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })} />
                                    </div>
                                    <div className="relative">
                                        <label className={labelClass}>Shortlisted Candidates</label>
                                        <User className={iconClass} />
                                        <input type="number" className={inputClass} placeholder="0" value={formData.shortlisted_count || ''} onChange={(e) => setFormData({ ...formData, shortlisted_count: e.target.value })} />
                                    </div>
                                    <div className="relative">
                                        <label className={labelClass}>Remove Post On (Date)</label>
                                        <Calendar className={iconClass} />
                                        <input type="date" className={inputClass} value={formData.expiry_date} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} />
                                    </div>
                                    <div className="relative">
                                        <label className={labelClass}>Remove Post At (Time)</label>
                                        <Clock className={iconClass} />
                                        <input type="time" className={inputClass} value={formData.expiry_time} onChange={(e) => setFormData({ ...formData, expiry_time: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }


                <div className="flex justify-end pt-6 border-t border-slate-50">
                    <button
                        disabled={loading}
                        className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-primary transition-all flex items-center gap-4 shadow-xl disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        Submit for Review
                    </button>
                </div>
            </form >
        </div >
    );
};

export default CreateJob;
