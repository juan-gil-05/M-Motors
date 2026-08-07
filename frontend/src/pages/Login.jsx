/* eslint-disable no-unused-vars */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChartNoAxesColumnIcon, CodeSquare, Eye, EyeOff } from 'lucide-react';
import api from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner';
import {ACCESS_TOKEN, REFRESH_TOKEN} from "../constants"
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext';


const LoginPage = () => {
    const navigate = useNavigate();
    const {login} = useAuth() // login function from authContext


    // Form input states
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    // UI & Validation states
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [errors, setErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [captchaValue, setCaptchaValue] = useState('');
    const [captchaError, setCaptchaError] = useState('');

    /**
     * Handle universal input state updates
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (errorMessage) setErrorMessage('');
    };

    /**
    * Validate all form fields
    */
    const validateForm = () => {
        const newErrors = {};

        if (!formData.email.trim()) newErrors.email = 'Ce champ est requis.';
        if (!formData.password.trim()) newErrors.password = 'Ce champ est requis.';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * Handle login form submission
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setCaptchaError('');

        if (!validateForm()) return;

        // Trigger CAPTCHA check if failed attempts is reached (5 attempts)
        if (failedAttempts >= 5 && captchaValue.trim() !== 'MmOtORS7') {
            setCaptchaError('Veuillez valider le CAPTCHA correctement.');
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await api.post("/api/token/", {
                username: formData.email,
                password: formData.password,
            })

            if (res.status === 200) {
                const {access, refresh} = res.data
                login(access, refresh) // send tokens to login function form AuthContext

                // Reset failed attempts counter on success
                setFailedAttempts(0);

                // Redirect user to homepage
                navigate('/');
                toast.success('Connexion reussi!')
            }

        } catch (err) {
            setFailedAttempts((prev) => prev + 1);
            console.log(failedAttempts)
            // Generic error message
            const statusError = err.response.status
            if (statusError === 401) {
                setErrorMessage("E-mail ou mot de passe incorrect.")
            } else {
                setErrorMessage('Une erreur réseau est survenue. Veuillez réessayer.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100/60 flex flex-col justify-between font-sans">

            {/* Centered Login Card Container */}
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden relative">

                    {/* Top Blue Accent Bar (Matching Mockup) */}
                    <div className="h-1.5 bg-blue-600 w-full" />

                    <div className="p-8 sm:p-10 space-y-6">

                        {/* Header Section */}
                        <div className="text-center space-y-2">
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                                Se connecter
                            </h1>
                            <p className="text-slate-500 text-sm">
                                Bienvenue à nouveau sur M-Motors
                            </p>
                        </div>

                        {/* Error Message */}
                        {errorMessage && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md text-center">
                                {errorMessage}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5" noValidate>

                            {/* Email Input */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700 tracking-wider uppercase">
                                    E-MAIL
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="john.doe@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                                    required
                                />
                                {errors.email && (
                                    <span className="text-xs text-red-500 mt-1 block">{errors.email}</span>
                                )}
                            </div>

                            {/* Password Input with Visibility Toggle */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700 tracking-wider uppercase">
                                    MOT DE PASSE
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors pr-10"
                                        required
                                    />
                                    {errors.password && (
                                        <span className="text-xs text-red-500 mt-1 block">{errors.password}</span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none"
                                        aria-label="Toggle password visibility"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* CAPTCHA validation (Activated after 5 failed attempts) */}
                            {failedAttempts >= 5 && (
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                                    <label className="block text-xs font-semibold text-slate-700">
                                        Vérification de sécurité (Saisissez : MmOtORS7)
                                    </label>
                                    <input
                                        type="text"
                                        value={captchaValue}
                                        onChange={(e) => setCaptchaValue(e.target.value)}
                                        placeholder="Recopiez le code"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-600"
                                    />
                                    {captchaError && (
                                        <span className="text-xs text-red-500 block">{captchaError}</span>
                                    )}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors shadow-sm focus:outline-none disabled:opacity-50"
                            >
                                {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
                            </button>
                        </form>

                        {/* Link to Register page */}
                        <div className="text-center text-sm text-slate-600 pt-2">
                            Nouveau ici?{' '}
                            <Link to="/inscription" className="text-blue-600 hover:underline font-medium">
                                Créer un compte
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;