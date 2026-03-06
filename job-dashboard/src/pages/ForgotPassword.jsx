import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Mail, Lock, ShieldCheck, Loader2, ArrowLeft, CheckCircle2, Briefcase, Eye, EyeOff } from 'lucide-react';
import { allService } from '../services/api';

const ForgotPassword = () => {
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
            await allService.makeRequest({
                action: 'send_otp',
                data: { email: formData.email, type: 'reset' }
            });
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
            await allService.makeRequest({
                action: 'verify_otp',
                data: { email: formData.email, otp: formData.otp, type: 'reset' }
            });
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

    const inputClass = "w-full pl-12 pr-12 py-4 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none text-slate-900 transition-all font-bold disabled:opacity-50";
    const labelClass = "text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block";

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent)]">
            <div className="max-w-md w-full">
                <button
                    onClick={() => step === 1 ? navigate('/login') : setStep(step - 1)}
                    className="mb-8 flex items-center gap-2 text-slate-400 hover:text-primary transition-colors text-xs font-black uppercase tracking-widest"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{step === 1 ? 'Back to Login' : 'Back'}</span>
                </button>

                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-primary/20">
                        {step === 3 ? <CheckCircle2 className="w-10 h-10 text-primary" /> : <Briefcase className="w-10 h-10 text-primary" />}
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase">
                        {step === 1 ? 'Recovery' : step === 2 ? 'Verification' : 'New Security'}
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">
                        {step === 1 ? 'Password Reset System' : step === 2 ? 'Check your registered email' : 'Set your new password'}
                    </p>
                </div>

                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl space-y-8">
                    {step === 1 && (
                        <form onSubmit={handleSendOTP} className="space-y-6">
                            <div className="relative">
                                <label className={labelClass}>Email Address</label>
                                <Mail className="absolute left-4 top-[3.2rem] w-5 h-5 text-slate-300" />
                                <input
                                    required
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={loading}
                                    placeholder="your@email.com"
                                    className={inputClass}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary transition-all flex items-center justify-center gap-4 shadow-xl disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Code'}
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleVerifyOTP} className="space-y-6">
                            <div className="relative">
                                <label className={labelClass}>Verification Code</label>
                                <ShieldCheck className="absolute left-4 top-[3.2rem] w-5 h-5 text-slate-300" />
                                <input
                                    required
                                    type="text"
                                    name="otp"
                                    maxLength="6"
                                    value={formData.otp}
                                    onChange={handleChange}
                                    disabled={loading}
                                    placeholder="6-digit code"
                                    className={inputClass}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary transition-all flex items-center justify-center gap-4 shadow-xl disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Code'}
                            </button>
                        </form>
                    )}

                    {step === 3 && (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div className="relative">
                                <label className={labelClass}>New Password</label>
                                <Lock className="absolute left-4 top-[3.2rem] w-5 h-5 text-slate-300" />
                                <input
                                    required
                                    type={showNewPassword ? "text" : "password"}
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    disabled={loading}
                                    placeholder="••••••••"
                                    className={inputClass}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-4 top-[3.2rem] text-slate-400 hover:text-primary transition-colors p-1"
                                >
                                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <div className="relative">
                                <label className={labelClass}>Confirm Password</label>
                                <Lock className="absolute left-4 top-[3.2rem] w-5 h-5 text-slate-300" />
                                <input
                                    required
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    disabled={loading}
                                    placeholder="••••••••"
                                    className={inputClass}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-[3.2rem] text-slate-400 hover:text-primary transition-colors p-1"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary transition-all flex items-center justify-center gap-4 shadow-xl disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Security'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
