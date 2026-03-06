import React, { useState, useEffect } from 'react';
import {
    Briefcase, MapPin, IndianRupee, Layout, FileText, Send, Loader2, Building2, User,
    Users, Landmark, Calendar, Award, CheckCircle, Globe, Clock, ChevronLeft, ChevronRight,
    AlertCircle, MessageSquare, ShieldCheck, Target, TrendingUp, Search, Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { allService } from '../../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TN_DISTRICTS } from '../../constants/districts';
import { formatIndianNumber } from '../../utils/helpers';

const CreateJob = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');

    const [subStep, setSubStep] = useState(1); // Added as per instruction
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const user = JSON.parse(localStorage.getItem('user')) || {};

    // Selection Step: 'loading', 'pricing', 'select', 'govt', 'private'
    const [step, setStep] = useState('loading');
    const [jobsPosted, setJobsPosted] = useState(0);
    const [rejectedCount, setRejectedCount] = useState(0);
    const [subscription, setSubscription] = useState(null);
    const [dbPlans, setDbPlans] = useState([]);

    const isLimitReached = subscription && subscription.job_limit !== -1 && jobsPosted >= subscription.job_limit;
    const mustUpgrade = !subscription || isLimitReached;

    const timeOptions = [
        { value: '00:00', label: '12:00 AM (Midnight)' },
        { value: '06:00', label: '06:00 AM' },
        { value: '07:00', label: '07:00 AM' },
        { value: '08:00', label: '08:00 AM' },
        { value: '09:00', label: '09:00 AM' },
        { value: '10:00', label: '10:00 AM' },
        { value: '11:00', label: '11:00 AM' },
        { value: '12:00', label: '12:00 PM (Noon)' },
        { value: '13:00', label: '01:00 PM' },
        { value: '14:00', label: '02:00 PM' },
        { value: '15:00', label: '03:00 PM' },
        { value: '16:00', label: '04:00 PM' },
        { value: '17:00', label: '05:00 PM' },
        { value: '18:00', label: '06:00 PM' },
        { value: '19:00', label: '07:00 PM' },
        { value: '20:00', label: '08:00 PM' },
        { value: '21:00', label: '09:00 PM' },
        { value: '22:00', label: '10:00 PM' },
        { value: '23:00', label: '11:00 PM' },
        { value: '23:59', label: '11:59 PM (End of Day)' }
    ];

    const [formData, setFormData] = useState({
        // Common
        title: '',
        description: '',
        category: 'Private',
        job_role_category: 'Other',
        district: '',

        // Government Specific
        govt_type: 'Central Government',
        department: '',
        sector: 'Banking',
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

        // Status Details
        application_deadline: '',
        shortlisted_candidates: '0',
        posted_date: new Date().toISOString().split('T')[0],

        // Expiry
        expiry_date: '',
        expiry_time: '23:59'
    });

    const COLORS = [
        'from-blue-500 to-indigo-600',
        'from-purple-500 to-pink-600',
        'from-amber-500 to-orange-600',
        'from-emerald-500 to-teal-600',
        'from-rose-500 to-red-600'
    ];

    const fallbackPlans = [
        { name: 'Starter', price: 999, limit: 5, color: COLORS[0] },
        { name: 'Growth', price: 2499, limit: 20, color: COLORS[1] },
        { name: 'Unlimited', price: 4999, limit: -1, color: COLORS[2] }
    ];

    const PLANS = (!dbPlans || dbPlans.length === 0) 
        ? fallbackPlans 
        : (Array.isArray(dbPlans) ? dbPlans : []).map((dbPlan, index) => {
            return {
                name: dbPlan.plan_name,
            price: parseInt(dbPlan.price || 0), // Default to 0 until the user adds price
            limit: parseInt(dbPlan.job_limit || dbPlan.applicant_limit || 0), // fallback to old limit logic mostly as a placeholder
            color: COLORS[index % COLORS.length]
            };
        });

    const getSubscription = (subs) => {
        if (!user.id || !Array.isArray(subs)) return null;
        return subs.find(s =>
            String(s.employer_id).trim() == String(user.id).trim() &&
            String(s.status).trim().toLowerCase() === 'active'
        );
    };

    const checkStatus = async () => {
        try {
            const [subs, myJobs, limits, fetchedPlanLimits] = await Promise.all([
                allService.getData('subscriptions', { employer_id: user.id }),
                allService.getData('jobs', { employer_id: user.id }),
                allService.getData('jobs_limits'),
                allService.getData('plan_limits').catch(() => []) 
            ]);

            setDbPlans(Array.isArray(fetchedPlanLimits) ? fetchedPlanLimits : (fetchedPlanLimits?.data || []));

            const allSubs = Array.isArray(subs) ? subs : (subs?.data || []);
            const activeSubs = allSubs.filter(s =>
                String(s.employer_id).trim() == String(user.id).trim() &&
                String(s.status).trim().toLowerCase() === 'active'
            );

            // Identify best plan and enforce strict limits
            let maxLimit = 0;
            let hasUnlimited = false;
            let bestPlanName = 'No Plan';

            activeSubs.forEach(s => {
                const name = (s.plan_name || '').toLowerCase();
                if (name.includes('unlimited') || parseInt(s.job_limit) === -1) {
                    hasUnlimited = true;
                    bestPlanName = 'Unlimited';
                } else if (name.includes('growth') && !hasUnlimited) {
                    if (maxLimit < 20) maxLimit = 20;
                    bestPlanName = 'Growth';
                } else if (name.includes('starter') && !hasUnlimited && maxLimit < 20) {
                    if (maxLimit < 5) maxLimit = 5;
                    if (bestPlanName === 'No Plan') bestPlanName = 'Starter';
                }
            });

            const calcLimit = hasUnlimited ? -1 : maxLimit;
            
            // Check limits table
            const allLimits = Array.isArray(limits) ? limits : (limits?.data || []);
            const employerLimit = allLimits.find(l => String(l.employer_id) === String(user.id));
            const finalLimit = employerLimit ? parseInt(employerLimit.current_plan_limit || 0) : calcLimit;

            // For UI display, pick the latest plan details but force our logic's limit
            const activeSub = activeSubs.sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0];
            if (activeSub) {
                // Determine limits priority (jobsLimits > ActiveSubCalcLimit)
                activeSub.job_limit = finalLimit;
                activeSub.plan_name = bestPlanName;
            }

            setSubscription(activeSub);

            const allJobs = Array.isArray(myJobs) ? myJobs : (myJobs?.data || []);
            
            const planDate = activeSub?.created_at;
            let validJobsCount = 0;
            
            if (employerLimit) {
                validJobsCount = parseInt(employerLimit.current_plan_posted || 0);
            } else if (planDate) {
                validJobsCount = allJobs.filter(j => new Date(j.created_at) >= new Date(planDate)).length;
            } else {
                validJobsCount = allJobs.filter(j => String(j.status).trim().toLowerCase() !== 'rejected').length;
            }

            const rejectedJobsCount = allJobs.filter(j => String(j.status).trim().toLowerCase() === 'rejected').length;

            setJobsPosted(validJobsCount);
            setRejectedCount(rejectedJobsCount);

            if (editId) {
                fetchJobForEdit();
            } else {
                if (!activeSub) {
                    setStep('pricing');
                } else {
                    const reached = finalLimit !== -1 && validJobsCount >= finalLimit;
                    if (reached) {
                        setStep('pricing');
                    } else if (step === 'loading') {
                        setStep('private');
                        setFormData(prev => ({ ...prev, category: 'Private' }));
                    }
                }
            }
        } catch (error) {
            console.error("Status check failed", error);
            if (!editId) setStep('select');
        }
    };

    const fetchJobForEdit = async () => {
        try {
            setFetching(true);
            const data = await allService.getData('jobs', { id: editId });
            if (data && data[0]) {
                const job = data[0];

                // Sanitize all fields to prevent null values in controlled inputs
                const sanitizedJob = {};
                Object.keys(job).forEach(key => {
                    sanitizedJob[key] = job[key] === null ? '' : job[key];
                });

                setFormData(prev => ({
                    ...prev,
                    ...sanitizedJob,
                    expiry_date: job.job_expiry && job.job_expiry !== '0000-00-00 00:00:00' ? job.job_expiry.split(' ')[0] : '',
                    expiry_time: job.job_expiry && job.job_expiry !== '0000-00-00 00:00:00' ? job.job_expiry.split(' ')[1]?.substring(0, 5) : '23:59',
                    posted_date: job.created_at ? job.created_at.split(' ')[0] : new Date().toISOString().split('T')[0]
                }));
                setStep(job.category === 'Government' ? 'govt' : 'private');
            }
        } catch (error) {
            toast.error("Failed to load job details");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        checkStatus();
    }, [user.id, editId]);

    const handlePayment = async (plan) => {
        setLoading(true);
        try {
            // 1. Get configuration from backend (Key ID)
            const orderRes = await allService.createRazorpayOrder({
                amount: plan.price,
                plan_name: plan.name,
                employer_id: user.id
            });

            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => {
                const options = {
                    key: orderRes.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY',
                    amount: plan.price * 100,
                    currency: "INR",
                    name: "Job Consultancy",
                    description: `Subscription: ${plan.name} Plan`,
                    // Use order_id only if backend creation succeeded
                    ...(orderRes.order_id && { order_id: orderRes.order_id }),
                    handler: async (response) => {
                        try {
                            // 2. Verified & Save on backend
                            await allService.verifyRazorpayPayment({
                                employer_id: user.id,
                                plan_name: plan.name,
                                amount: plan.price,
                                job_limit: plan.limit,
                                razorpay_payment_id: response.razorpay_payment_id,
                                // Send these if they exist (requires secret key later)
                                razorpay_order_id: response.razorpay_order_id || null,
                                razorpay_signature: response.razorpay_signature || null
                            });

                            // 3. Update Plan History in jobs_limits
                            try {
                                const limitsDataRaw = await allService.getData('jobs_limits', { employer_id: user.id });
                                const limitsData = Array.isArray(limitsDataRaw) ? limitsDataRaw : (limitsDataRaw?.data || []);
                                if (limitsData && limitsData.length > 0) {
                                    const limitRecord = limitsData[0];
                                    let history = [];
                                    if (limitRecord.plan_history && limitRecord.plan_history !== 'null') {
                                        try {
                                            if(typeof limitRecord.plan_history === 'string') {
                                                history = JSON.parse(limitRecord.plan_history);
                                            } else {
                                                history = limitRecord.plan_history;
                                            }
                                        } catch (e) {
                                            console.error("Failed to parse history", e);
                                        }
                                    }
                                    history.push({
                                        plan_name: plan.name,
                                        limit: plan.limit,
                                        price: plan.price,
                                        date: new Date().toISOString()
                                    });
                                    await allService.updateData('jobs_limits', { id: limitRecord.id }, {
                                        plan_history: JSON.stringify(history),
                                        current_plan_posted: 0,
                                        current_plan_limit: plan.limit
                                    });
                                }
                            } catch (histErr) {
                                console.error("History update error", histErr);
                            }

                            // Update UI instantly
                            setSubscription({ 
                                plan_name: plan.name, 
                                job_limit: plan.limit, 
                                status: 'active' 
                            });
                            setJobsPosted(0);
                            setStep('private');
                            setFormData(prev => ({ ...prev, category: 'Private' }));
                            toast.success("Payment successful!");
                        } catch (e) {
                            toast.error("Payment recording failed");
                        }
                    },
                    prefill: { name: user.name, email: user.email },
                    theme: { color: "#db2777" }
                };
                const rzp = new window.Razorpay(options);
                rzp.open();
            };
            document.body.appendChild(script);
        } catch (error) {
            console.error("Payment error:", error);
            toast.error("Payment initialization failed");
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

        // Form validation
        if (formData.category === 'Government') {
            if (!formData.title || !formData.district || !formData.department || !formData.vacancy || !formData.last_date) {
                toast.error("Please fill in all essential fields (District, Designation, Organization, Vacancies, Last Date) to submit.");
                return;
            }
        } else {
            // Private Jobs
            if (!formData.title || !formData.company_name || !formData.district || !formData.location || !formData.salary_range || !formData.vacancy || !formData.description) {
                toast.error("⚠️ Incomplete Form! Please scroll up and make sure Title, Company Name, District, Location, Salary, Vacancies, and Description are firmly filled out.");
                return;
            }
        }

        setLoading(true);

        let autoApprove = user.auto_approve_jobs;
        try {
            const userData = await allService.getData('users', { id: user.id });
            if (userData && userData[0]) {
                autoApprove = userData[0].auto_approve_jobs;
                const freshUser = { ...user, auto_approve_jobs: autoApprove };
                localStorage.setItem('user', JSON.stringify(freshUser));
            }
        } catch (e) {
            console.error("Failed to fetch fresh user data for auto-approve check", e);
        }

        const job_expiry = (formData.expiry_date && formData.expiry_time)
            ? `${formData.expiry_date} ${formData.expiry_time}:00`
            : null;

        // Define which fields belong to which category to prevent SQL errors from non-existent columns
        const commonFields = ['title', 'description', 'category', 'job_role_category', 'vacancy', 'qualification', 'district'];

        const govtFields = [
            'govt_type', 'department', 'sector', 'application_mode', 'exam_fee',
            'last_date', 'selection_process', 'age_relaxation', 'post_name',
            'application_start_date', 'min_age', 'max_age'
        ];

        const privateFields = [
            'company_name', 'company_logo', 'location', 'shift', 'salary_range',
            'job_type', 'skills', 'experience', 'language', 'responsibilities',
            'work_mode', 'company_industry', 'company_type', 'company_employees',
            'company_turnover', 'application_deadline', 'age_limit'
        ];

        const allowedFields = [...commonFields, ...(formData.category === 'Government' ? govtFields : privateFields)];

        const payload = {
            employer_id: user.id,
            status: autoApprove == 1 ? 'approved' : 'pending',
            job_expiry,
            created_at: new Date().toISOString().replace('T', ' ').split('.')[0]
        };

        // For Government jobs, set a default location if not present and sync post_name
        if (formData.category === 'Government') {
            payload.location = 'Government';
            payload.post_name = formData.title;
        }

        // Only include allowed fields that have values
        allowedFields.forEach(field => {
            if (formData[field] !== undefined && formData[field] !== '') {
                payload[field] = formData[field];
            }
        });

        try {
            if (editId) {
                // Remove created_at on update to prevent issues
                delete payload.created_at;
                await allService.updateData('jobs', { id: editId }, payload);
                toast.success("Job updated for review!");
            } else {
                await allService.insertData('jobs', payload);
                toast.success("Job submitted for review!");
            }
            navigate('/employer/my-jobs');
        } catch (error) {
            console.error("Submission error:", error);
            toast.error(error.message || "Operation failed");
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-4 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none text-slate-900 transition-all font-bold text-sm md:text-base bg-white placeholder:text-slate-300";
    const labelClass = "text-[10px] md:text-xs font-extrabold text-slate-500 uppercase tracking-widest ml-1 mb-2 md:mb-3 block group-hover:text-primary transition-colors";

    if (step === 'loading' || fetching) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Processing...</p>
            </div>
        );
    }

    if (step === 'pricing' || mustUpgrade) {
        const actuallyReached = subscription && subscription.job_limit !== -1 && jobsPosted >= subscription.job_limit;
        return (
            <div className="p-10 max-w-6xl mx-auto animate-in fade-in duration-500">
                {actuallyReached && (
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
                        <div className="flex gap-4">
                            <div className="bg-white px-6 py-3 rounded-2xl border border-rose-100 flex-1">
                                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-1">Current Plan Posted</span>
                                <span className="text-lg font-black text-rose-900">{jobsPosted}</span>
                            </div>
                            <div className="bg-white px-6 py-3 rounded-2xl border border-rose-100 flex-1">
                                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-1">Current Plan Limit</span>
                                <span className="text-lg font-black text-rose-900">{subscription.job_limit === -1 ? 'Unlimited' : subscription.job_limit}</span>
                            </div>
                            <div className="bg-white px-6 py-3 rounded-2xl border border-rose-100 flex-1">
                                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-1">Current Plan Balance</span>
                                <span className="text-lg font-black text-rose-900">{subscription.job_limit === -1 ? 'Unlimited' : Math.max(0, parseInt(subscription.job_limit) - parseInt(jobsPosted || 0))}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mb-16 text-center">
                    <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4">
                        {actuallyReached ? 'Upgrade Your Potential' : 'Choose Your Plan'}
                    </h1>
                    <p className="text-sm font-bold text-slate-500 max-w-lg mx-auto uppercase tracking-widest leading-relaxed">
                        {actuallyReached
                            ? "Your current plan has served you well, but it's time to grow. Pick a higher capacity plan to keep hiring."
                            : "Select a plan to start posting jobs and hiring talent."}
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {PLANS.map((plan, i) => (
                        <div key={i} className={`bg-white rounded-[3rem] p-10 border-2 border-slate-100 shadow-xl flex flex-col items-center text-center relative overflow-hidden group transition-all hover:border-primary/20`}>
                            <div className={`absolute top-0 inset-x-0 h-2 bg-gradient-to-r ${plan.color}`} />
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">{plan.name}</h3>
                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-4xl font-black text-slate-900">₹{formatIndianNumber(plan.price)}</span>
                                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">/month</span>
                            </div>
                            <div className="w-full mb-10">
                                <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span className="font-bold text-slate-700 text-xs">{plan.limit === -1 ? 'Unlimited' : plan.limit} Job Posts</span>
                                </div>
                            </div>
                            <button
                                onClick={() => handlePayment(plan)}
                                disabled={loading}
                                className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] transition-all ${loading ? 'opacity-50' : 'bg-slate-900 text-white hover:bg-primary shadow-lg shadow-primary/20'}`}
                            >
                                Activate Plan
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (step === 'select') {
        // Redirect to private automatically if someone somehow lands here
        setStep('private');
        setFormData(prev => ({ ...prev, category: 'Private' }));
        return null;
    }

    return (
        <div className="max-w-7xl mx-auto pb-20 px-0 md:px-4">
            <button
                onClick={() => navigate(-1)}
                className="mb-6 md:mb-8 flex items-center gap-2 text-[10px] md:text-xs font-extrabold text-slate-400 uppercase tracking-widest hover:text-primary transition-all group px-4 md:px-0"
            >
                <ChevronLeft className="w-4 h-4 md:w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
            </button>

            <div className="mb-8 md:mb-12 px-4 md:px-0">
                <div className="inline-flex flex-wrap items-center gap-2 md:gap-4 bg-white border border-slate-100 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-full shadow-sm mb-4 md:mb-6">
                    <div className="flex items-center gap-2">
                        <span className="text-[8px] md:text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Active Plan:</span>
                        <span className="text-[8px] md:text-[10px] font-extrabold text-slate-900 uppercase tracking-widest leading-none">{subscription?.plan_name}</span>
                    </div>
                    <div className="hidden md:block h-4 w-px bg-slate-100" />
                    <div className="flex items-center gap-2">
                        <span className="text-[8px] md:text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Current Plan Posted:</span>
                        <span className="text-[8px] md:text-[10px] font-extrabold text-slate-900 uppercase tracking-widest leading-none">
                            {jobsPosted}
                        </span>
                    </div>
                    <div className="hidden md:block h-4 w-px bg-slate-100" />
                    <div className="flex items-center gap-2">
                        <span className="text-[8px] md:text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Current Plan Balance:</span>
                        <span className="text-[8px] md:text-[10px] font-extrabold text-slate-900 uppercase tracking-widest leading-none">
                            {subscription?.job_limit === -1 ? '∞' : Math.max(0, parseInt(subscription?.job_limit || 0) - parseInt(jobsPosted || 0))}
                        </span>
                    </div>
                </div>

                <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 uppercase tracking-tight mb-2">
                    Post {formData.category} Job
                </h1>
                <p className="text-[10px] md:text-sm font-semibold text-slate-400 lowercase tracking-normal">Fill in all details below to publish your vacancy.</p>
            </div>

            <form noValidate onSubmit={handleSubmit} className="space-y-6 md:space-y-10 px-0 md:px-0">
                {formData.category === 'Government' ? (
                    <div className="bg-transparent md:bg-white p-0 md:p-12 rounded-[3.5rem] md:shadow-xl border-0 md:border border-slate-100 md:divide-y md:divide-slate-100 space-y-6 md:space-y-0">
                        {/* Section 1: Job Info & Dates */}
                        <div className="pb-8 md:pb-12 bg-transparent md:bg-transparent p-4 md:p-0 rounded-none md:rounded-none shadow-none md:shadow-none border-0 md:border-none mx-0 md:mx-0">
                            <div className="flex items-center gap-3 md:gap-5 bg-amber-50/80 p-4 md:p-6 rounded-xl md:rounded-[2rem] mb-6 md:mb-12 uppercase tracking-widest text-amber-900 font-extrabold text-sm md:text-xl shadow-sm border border-amber-100/50">
                                <div className="w-8 h-8 md:w-12 md:h-12 bg-white rounded-lg md:rounded-2xl flex items-center justify-center shadow-md shrink-0">
                                    <Landmark className="w-4 h-4 md:w-6 md:h-6 text-amber-600" />
                                </div>
                                Basic Info & Dates
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 px-4 md:px-0">
                                <div>
                                    <label className={labelClass}>District</label>
                                    <select required className={inputClass} value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })}>
                                        <option value="">Select District</option>
                                        {TN_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Job Type</label>
                                    <select className={inputClass} value={formData.govt_type} onChange={(e) => setFormData({ ...formData, govt_type: e.target.value })}>
                                        <option>Central Government</option>
                                        <option>State Government</option>
                                        <option>Public Sector Unit (PSU)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Designation</label>
                                    <input required className={inputClass} placeholder="e.g. Probationary Officer" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Organization Name</label>
                                    <input required className={inputClass} placeholder="e.g. Ministry of Finance" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Total Vacancies</label>
                                    <input required className={inputClass} placeholder="e.g. 500" value={formData.vacancy} onChange={(e) => setFormData({ ...formData, vacancy: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Last Date to Apply</label>
                                    <input required type="date" className={inputClass} value={formData.last_date} onChange={(e) => setFormData({ ...formData, last_date: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Start Date</label>
                                    <input type="date" className={inputClass} value={formData.application_start_date} onChange={(e) => setFormData({ ...formData, application_start_date: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Details & Process */}
                        <div className="py-8 md:py-12 bg-transparent md:bg-transparent p-4 md:p-0 rounded-none md:rounded-none shadow-none md:shadow-none border-0 md:border-none mx-0 md:mx-0">
                            <div className="flex items-center gap-3 md:gap-5 bg-amber-50/80 p-4 md:p-6 rounded-xl md:rounded-[2rem] mb-6 md:mb-12 uppercase tracking-widest text-amber-900 font-extrabold text-sm md:text-base shadow-sm border border-amber-100/50">
                                <div className="w-8 h-8 md:w-12 md:h-12 bg-white rounded-lg md:rounded-2xl flex items-center justify-center shadow-md shrink-0">
                                    <Target className="w-4 h-4 md:w-6 md:h-6 text-amber-600" />
                                </div>
                                Process & Requirements
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 transition-all">
                                <div>
                                    <label className={labelClass}>Application Mode</label>
                                    <select className={inputClass} value={formData.application_mode} onChange={(e) => setFormData({ ...formData, application_mode: e.target.value })}>
                                        <option>Online</option>
                                        <option>Offline</option>
                                        <option>Both</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Min Age</label>
                                    <input type="number" className={inputClass} placeholder="18" value={formData.min_age} onChange={(e) => setFormData({ ...formData, min_age: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Max Age</label>
                                    <input type="number" className={inputClass} placeholder="35" value={formData.max_age} onChange={(e) => setFormData({ ...formData, max_age: e.target.value })} />
                                </div>
                                <div className="lg:col-span-2">
                                    <label className={labelClass}>Selection Process</label>
                                    <input className={inputClass} placeholder="Written Test, Interview..." value={formData.selection_process} onChange={(e) => setFormData({ ...formData, selection_process: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Application Fee</label>
                                    <input className={inputClass} placeholder="e.g. Free or ₹500" value={formData.exam_fee} onChange={(e) => setFormData({ ...formData, exam_fee: e.target.value })} />
                                </div>
                                <div className="col-span-full">
                                    <label className={labelClass}>Age Relaxation Details</label>
                                    <textarea className={`${inputClass} !h-24 pt-4`} placeholder="e.g. SC/ST: 5 years, OBC: 3 years..." value={formData.age_relaxation} onChange={(e) => setFormData({ ...formData, age_relaxation: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Expiry Settings */}
                        <div className="py-8 md:pt-12 bg-transparent md:bg-transparent p-4 md:p-0 rounded-none md:rounded-none shadow-none md:shadow-none border-0 md:border-none mx-0 md:mx-0">
                            <div className="flex items-center gap-3 md:gap-5 bg-amber-50/80 p-4 md:p-6 rounded-xl md:rounded-[2rem] mb-6 md:mb-12 uppercase tracking-widest text-amber-900 font-extrabold text-sm md:text-base shadow-sm border border-amber-100/50">
                                <div className="w-8 h-8 md:w-12 md:h-12 bg-white rounded-lg md:rounded-2xl flex items-center justify-center shadow-md shrink-0">
                                    <Clock className="w-4 h-4 md:w-6 md:h-6 text-amber-600" />
                                </div>
                                Post Expiry Settings
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 items-end">
                                <div>
                                    <label className={labelClass}>Remove Post On (Date)</label>
                                    <input required type="date" className={inputClass} value={formData.expiry_date} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Remove Post At (Time)</label>
                                    <select
                                        className={inputClass}
                                        value={formData.expiry_time}
                                        onChange={(e) => setFormData({ ...formData, expiry_time: e.target.value })}
                                    >
                                        {timeOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="bg-amber-50 p-4 rounded-2xl flex items-center gap-4 border border-amber-100">
                                    <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shrink-0">
                                        <CheckCircle className="w-5 h-5 text-white" />
                                    </div>
                                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-tight">Post will be live after admin review.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-transparent md:bg-white p-0 md:p-12 rounded-[3.5rem] md:shadow-xl border-0 md:border border-slate-100 md:divide-y md:divide-slate-100 space-y-6 md:space-y-0">
                        {/* Section 1: Basic & Company Info */}
                        <div className="pb-8 md:pb-12 bg-transparent md:bg-transparent p-4 md:p-0 rounded-none md:rounded-none shadow-none md:shadow-none border-0 md:border-none mx-0 md:mx-0">
                            <div className="flex items-center gap-3 md:gap-5 bg-pink-50/80 p-4 md:p-6 rounded-xl md:rounded-[2rem] mb-6 md:mb-12 uppercase tracking-widest text-pink-900 font-extrabold text-sm md:text-base shadow-sm border border-pink-100/50">
                                <div className="w-8 h-8 md:w-12 md:h-12 bg-white rounded-lg md:rounded-2xl flex items-center justify-center shadow-md shadow-pink-200/20 shrink-0">
                                    <Briefcase className="w-4 h-4 md:w-6 md:h-6 text-pink-600" />
                                </div>
                                Basic & Company Details
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 px-4 md:px-0">
                                <div>
                                    <label className={labelClass}>Job Title</label>
                                    <input required className={inputClass} placeholder="e.g. Sales Executive" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Company Name</label>
                                    <input required className={inputClass} placeholder="Company Name" value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClass}>TN District</label>
                                    <select required className={inputClass} value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })}>
                                        <option value="">Select District</option>
                                        {TN_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Location (Specific Area)</label>
                                    <input required className={inputClass} placeholder="e.g. T. Nagar" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Job Type</label>
                                    <select className={inputClass} value={formData.job_type} onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}>
                                        <option>Full Time</option>
                                        <option>Part Time</option>
                                        <option>Internship</option>
                                        <option>Freelance</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Monthly Salary</label>
                                    <input required className={inputClass} placeholder="e.g. 15000 - 25000" value={formData.salary_range} onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Openings</label>
                                    <input required type="number" className={inputClass} placeholder="10" value={formData.vacancy} onChange={(e) => setFormData({ ...formData, vacancy: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Requirements & About */}
                        <div className="py-8 md:py-12 bg-transparent md:bg-transparent p-4 md:p-0 rounded-none md:rounded-none shadow-none md:shadow-none border-0 md:border-none mx-0 md:mx-0">
                            <div className="flex items-center gap-3 md:gap-5 bg-pink-50/80 p-4 md:p-6 rounded-xl md:rounded-[2rem] mb-6 md:mb-12 uppercase tracking-widest text-pink-900 font-extrabold text-sm md:text-base shadow-sm border border-pink-100/50">
                                <div className="w-8 h-8 md:w-12 md:h-12 bg-white rounded-lg md:rounded-2xl flex items-center justify-center shadow-md shadow-pink-200/20 shrink-0">
                                    <Target className="w-4 h-4 md:w-6 md:h-6 text-pink-600" />
                                </div>
                                Requirements & About
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                                <div className="lg:col-span-2">
                                    <label className={`${labelClass} bg-pink-50/50 w-fit px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl border border-pink-100 !text-pink-600 text-[10px] md:text-xs shadow-sm capitalize md:uppercase`}>Job Description</label>
                                    <textarea required className={`${inputClass} !h-28 pt-4`} placeholder="Describe what the employee will do..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <label className={labelClass}>Shift Timing</label>
                                        <select className={inputClass} value={formData.shift} onChange={(e) => setFormData({ ...formData, shift: e.target.value })}>
                                            <option>Day Shift</option>
                                            <option>Night Shift</option>
                                            <option>Rotational</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Work Mode</label>
                                        <select className={inputClass} value={formData.work_mode} onChange={(e) => setFormData({ ...formData, work_mode: e.target.value })}>
                                            <option>Work from Office</option>
                                            <option>Work from Home</option>
                                            <option>Hybrid</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Skills</label>
                                    <input className={inputClass} placeholder="e.g. Sales, Tamil" value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Experience</label>
                                    <select className={inputClass} value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })}>
                                        <option value="">Any Experience</option>
                                        <option>Fresher</option>
                                        <option>1-2 Years</option>
                                        <option>2-5 Years</option>
                                        <option>5+ Years</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Language</label>
                                    <input className={inputClass} placeholder="e.g. Tamil" value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Final Details & Expiry */}
                        <div className="py-8 md:pt-12 bg-transparent md:bg-transparent p-4 md:p-0 rounded-none md:rounded-none shadow-none md:shadow-none border-0 md:border-none mx-0 md:mx-0">
                            <div className="flex items-center gap-3 md:gap-5 bg-pink-50/80 p-4 md:p-6 rounded-xl md:rounded-[2rem] mb-6 md:mb-12 uppercase tracking-widest text-pink-900 font-extrabold text-sm md:text-base shadow-sm border border-pink-100/50">
                                <div className="w-8 h-8 md:w-12 md:h-12 bg-white rounded-lg md:rounded-2xl flex items-center justify-center shadow-md shadow-pink-200/20 shrink-0">
                                    <Clock className="w-4 h-4 md:w-6 md:h-6 text-pink-600" />
                                </div>
                                Final Settings
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                                <div>
                                    <label className={labelClass}>Industry</label>
                                    <input className={inputClass} placeholder="e.g. Retail" value={formData.company_industry} onChange={(e) => setFormData({ ...formData, company_industry: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Logo URL (Optional)</label>
                                    <input className={inputClass} placeholder="link to logo" value={formData.company_logo} onChange={(e) => setFormData({ ...formData, company_logo: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Expire On (Date)</label>
                                    <input required type="date" className={inputClass} value={formData.expiry_date} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Expire At (Time)</label>
                                    <select
                                        className={inputClass}
                                        value={formData.expiry_time}
                                        onChange={(e) => setFormData({ ...formData, expiry_time: e.target.value })}
                                    >
                                        {timeOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Removed Back to Selection button */}

                <div className="flex justify-center md:justify-end py-6 px-4 md:px-0">
                    <button
                        disabled={loading}
                        className="w-full md:w-auto bg-slate-900 text-white px-8 md:px-16 py-4 md:py-6 rounded-xl md:rounded-[2rem] font-extrabold text-[10px] md:text-sm uppercase tracking-widest hover:bg-primary transition-all flex items-center justify-center gap-3 md:gap-4 shadow-2xl hover:scale-105 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : <Send className="w-4 h-4 md:w-5 h-5" />}
                        Submit Job for Review
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateJob;
