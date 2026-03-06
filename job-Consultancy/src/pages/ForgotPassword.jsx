
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Mail, Lock, ShieldCheck, Loader2, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { allService } from '../services/api';

const ForgotPassword = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        otp: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await allService.forgotPassword(formData.email);
            toast.success('Verification code sent to your email');
            setStep(2);
        } catch (error) {
            toast.error(error.message || 'Failed to send verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await allService.verifyOTP(formData.email, formData.otp, 'reset');
            toast.success('Code verified successfully');
            setStep(3);
        } catch (error) {
            toast.error(error.message || 'Invalid verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await allService.resetPassword(formData.email, formData.newPassword);
            toast.success('Password updated successfully! Please login with your new password.');
            navigate('/login');
        } catch (error) {
            toast.error(error.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    const labelClass = "text-xs font-black text-slate-900 uppercase tracking-widest ml-3 mb-2 block";

    return (
        <div className="min-h-screen flex items-center justify-center pt-24 px-4 bg-slate-50">
            <div className="max-w-sm w-full p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-white bg-white/80 backdrop-blur-xl relative overflow-hidden">


                <button
                    onClick={() => step === 1 ? navigate('/login') : setStep(step - 1)}
                    className="mb-8 flex items-center gap-2 text-slate-400 hover:text-primary transition-colors text-xs font-black uppercase tracking-widest"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{step === 1 ? 'Back to Login' : 'Back'}</span>
                </button>

                <div className="text-center mb-6">
                    <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                        {step === 3 ? <CheckCircle2 className="w-8 h-8 text-primary" /> : <ShieldCheck className="w-8 h-8 text-primary" />}
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                        {step === 1 ? 'Forgot Password?' : step === 2 ? 'Verify Email' : 'Reset Password'}
                    </h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">
                        {step === 1 ? 'Enter your email to receive a code' : step === 2 ? 'Enter the code sent to your email' : 'Create a strong new password'}
                    </p>
                </div>

                {step === 1 && (
                    <form onSubmit={handleSendOTP} className="space-y-4">
                        <div>
                            <label className={labelClass}>Registered Email</label>
                            <div className="relative">
                                <div className="absolute left-5 inset-y-0 flex items-center pointer-events-none">
                                    <Mail className="w-5 h-5 text-slate-300" />
                                </div>
                                <input
                                    required
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={loading}
                                    placeholder="your@email.com"
                                    className="w-full pl-14 pr-6 py-3 rounded-2xl bg-white border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none text-slate-900 transition-all text-sm font-bold disabled:opacity-50"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-secondary hover:text-black transition-all flex items-center justify-center gap-3 shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Code'}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyOTP} className="space-y-4">
                        <div>
                            <label className={labelClass}>Verification Code</label>
                            <div className="relative">
                                <div className="absolute left-5 inset-y-0 flex items-center pointer-events-none">
                                    <ShieldCheck className="w-5 h-5 text-slate-300" />
                                </div>
                                <input
                                    required
                                    type="text"
                                    name="otp"
                                    maxLength="6"
                                    value={formData.otp}
                                    onChange={handleChange}
                                    disabled={loading}
                                    placeholder="Enter 6-digit code"
                                    className="w-full pl-14 pr-6 py-3 rounded-2xl bg-white border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none text-slate-900 transition-all text-sm font-bold disabled:opacity-50"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-secondary hover:text-black transition-all flex items-center justify-center gap-3 shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Code'}
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div>
                            <label className={labelClass}>New Password</label>
                            <div className="relative">
                                <div className="absolute left-5 inset-y-0 flex items-center pointer-events-none">
                                    <Lock className="w-5 h-5 text-slate-300" />
                                </div>
                                <input
                                    required
                                    type={showNewPassword ? "text" : "password"}
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    disabled={loading}
                                    placeholder="••••••••"
                                    className="w-full pl-14 pr-12 py-3 rounded-2xl bg-white border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none text-slate-900 transition-all text-sm font-bold disabled:opacity-50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors p-1"
                                >
                                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Confirm Password</label>
                            <div className="relative">
                                <div className="absolute left-5 inset-y-0 flex items-center pointer-events-none">
                                    <Lock className="w-5 h-5 text-slate-300" />
                                </div>
                                <input
                                    required
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    disabled={loading}
                                    placeholder="••••••••"
                                    className="w-full pl-14 pr-12 py-3 rounded-2xl bg-white border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none text-slate-900 transition-all text-sm font-bold disabled:opacity-50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors p-1"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-secondary hover:text-black transition-all flex items-center justify-center gap-3 shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
