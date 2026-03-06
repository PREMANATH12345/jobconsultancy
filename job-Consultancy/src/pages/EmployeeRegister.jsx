
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    User, Phone, Mail, Lock, Loader2, ChevronRight, CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { allService } from '../services/api';

const EmployeeRegister = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showOtpField, setShowOtpField] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [otp, setOtp] = useState('');
    const [regNo] = useState(`EMP-${Math.floor(100000 + Math.random() * 900000)}`);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        cellNo: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleInitialSubmit = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.cellNo || !formData.name) {
            toast.error('Email, Mobile and Name are required');
            return;
        }
        setLoading(true);
        try {
            await allService.sendOTP(formData.email, formData.name, 'register');
            toast.success('Verification code sent to your email!');
            setShowOtpField(true);
        } catch (error) {
            toast.error(error.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp) {
            toast.error('Please enter the OTP');
            return;
        }
        setLoading(true);
        try {
            await allService.verifyOTP(formData.email, otp, 'register');
            setIsVerified(true);
            toast.success('Email verified successfully!', { icon: '✅' });
        } catch (error) {
            toast.error(error.message || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteRegistration = async () => {
        if (!formData.password || formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match or are empty');
            return;
        }

        setLoading(true);
        try {
            const registrationData = {
                user_id: regNo,
                password: formData.password,
                role: 'employee',
                name: formData.name,
                email: formData.email,
                phone: formData.cellNo,
                whatsapp_no: formData.cellNo,
                user_details: JSON.stringify({}) // Initially empty
            };

            await allService.completeRegistration(registrationData);

            toast.success('Registration successful! Welcome ' + formData.name, { icon: '🎓' });
            setTimeout(() => navigate('/login'), 2000);

        } catch (error) {
            toast.error(error.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none text-slate-900 transition-all text-sm font-bold shadow-sm";
    const labelClass = "text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1.5 block";

    return (
        <div className="min-h-screen pt-40 pb-20 px-4 bg-white relative overflow-hidden flex items-center justify-center">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full -mr-48 -mt-48 blur-3xl opacity-50" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full -ml-48 -mb-48 blur-3xl opacity-50" />

            <div className="w-full max-w-lg relative">
                <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl border border-slate-50">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5 text-emerald-600 shadow-inner">
                            <User className="w-8 h-8" />
                        </div>
                        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
                            {t('joinAsEmployee').includes('Employee') ? (
                                <>Join as <span className="text-emerald-600">Employee</span></>
                            ) : t('joinAsEmployee').includes('பணியாளராக') ? (
                                <><span className="text-emerald-600">பணியாளராக</span> சேரவும்</>
                            ) : t('joinAsEmployee')}
                        </h1>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{t('startJourney')}</p>
                    </div>

                    {!showOtpField ? (
                        <form onSubmit={handleInitialSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className={labelClass}>{t('fullName')}</label>
                                <input required name="name" value={formData.name} onChange={handleChange} placeholder={t('fullName')} className={inputClass} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className={labelClass}>{t('emailId')}</label>
                                    <input required type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" className={inputClass} />
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClass}>{t('mobileNumber')}</label>
                                    <input required type="tel" name="cellNo" value={formData.cellNo} onChange={handleChange} placeholder="+91" className={inputClass} />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-emerald-600 hover:shadow-emerald-600/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 group text-[10px]"
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                        <>
                                            {t('continueToVerify')}
                                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            {!isVerified ? (
                                <>
                                    <div className="bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/10 text-center">
                                        <p className="text-xs text-slate-600 font-bold">
                                            Code sent to <span className="text-emerald-500 font-extrabold uppercase tracking-tight">{formData.email}</span>
                                        </p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className={labelClass}>{t('verificationCode')}</label>
                                            <input
                                                type="text"
                                                maxLength="6"
                                                placeholder="0 0 0 0 0 0"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                className="w-full text-center text-3xl font-black tracking-[0.5em] py-5 rounded-3xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 outline-none transition-all"
                                            />
                                        </div>

                                        <div className="pt-4 space-y-4">
                                            <button
                                                onClick={handleVerifyOtp}
                                                disabled={loading}
                                                className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-[10px]"
                                            >
                                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : t('verifyAccount')}
                                            </button>
                                            <button
                                                onClick={() => setShowOtpField(false)}
                                                className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-500 transition-all text-center"
                                            >
                                                {t('differentNumber')}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-8 animate-in zoom-in-95 duration-500">
                                    <div className="bg-green-50 p-6 rounded-3xl border border-green-100 flex items-center justify-center gap-4">
                                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                                        <p className="text-xs text-green-600 font-bold uppercase tracking-widest">{t('verified')}</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className={labelClass}>Set Password</label>
                                                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className={inputClass} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className={labelClass}>Confirm Password</label>
                                                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className={inputClass} />
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <button
                                                onClick={handleCompleteRegistration}
                                                disabled={loading}
                                                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-[10px]"
                                            >
                                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : t('finalizeReg')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-10 pt-10 border-t border-slate-50 text-center">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            {t('alreadyAccount')} <Link to="/login" className="text-emerald-600 font-black hover:underline ml-2">{t('loginHere')}</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeRegister;
