/* eslint-disable no-unused-vars */
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Link, data } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../api/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth() // login function from authContext

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
    const [captchaToken, setCaptchaToken] = useState('');
    const [captchaError, setCaptchaError] = useState('');
    const [captchaRequired, setCaptchaRequired] = useState(false);
    const captchaContainer = useRef(null);
    const captchaWidgetId = useRef(null);
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

    // Recaptcha loading manage
    useEffect(() => {
        if (!captchaRequired) {
            // Google widgets are bound to their original DOM node. Clear the old id
            // when the CAPTCHA section is removed so the next challenge can render anew.
            if (captchaWidgetId.current !== null && window.grecaptcha?.reset) {
                window.grecaptcha.reset(captchaWidgetId.current);
            }
            captchaWidgetId.current = null;
            return;
        }
        if (!siteKey || !captchaContainer.current) return;

        const renderCaptcha = () => {
            // Avoid rendering twice while React or Google's script is still initializing.
            if (!window.grecaptcha || !captchaContainer.current || captchaWidgetId.current !== null) return;
            captchaWidgetId.current = window.grecaptcha.render(captchaContainer.current, {
                sitekey: siteKey,
                // Google calls these handlers when the user completes, expires, or cannot load the challenge.
                callback: (token) => { setCaptchaToken(token); setCaptchaError(''); },
                'expired-callback': () => setCaptchaToken(''),
                'error-callback': () => setCaptchaError('Impossible de charger la vérification. Réessayez.'),
            });
        };

        // Reuse Google's API if another page loaded it, otherwise load it on demand.
        if (window.grecaptcha?.render) {
            window.grecaptcha.ready(renderCaptcha);
        } else {
            const existingScript = document.querySelector('script[data-google-recaptcha]');
            const script = existingScript || document.createElement('script');
            if (!existingScript) {
                script.src = 'https://www.google.com/recaptcha/api.js?render=explicit&hl=fr';
                script.async = true;
                script.defer = true;
                script.dataset.googleRecaptcha = 'true';
                document.head.appendChild(script);
            }
            script.addEventListener('load', () => window.grecaptcha.ready(renderCaptcha), { once: true });
        }
    }, [captchaRequired, siteKey]);


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

        if (captchaRequired && !captchaToken) {
            setCaptchaError('Veuillez cocher la case de vérification.');
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                username: formData.email,
                password: formData.password,
            };
            // The backend verifies this token with Google before checking credentials.
            if (captchaToken) payload.captcha_token = captchaToken;
            const res = await api.post("/api/token/", payload)

            if (res.status === 200) {
                const { access, refresh, is_staff } = res.data
                login(access, refresh, is_staff) // send tokens to login function form AuthContext

                // Redirect user to homepage
                navigate(location.state?.from || '/');
                toast.success('Connexion reussi!')
            }

        } catch (err) {
            // Generic error message
            const statusError = err.response?.status
            if (statusError === 401) {
                // The backend returns these errors to synchronize the UI with its failure counter.
                if (err.response.data?.captcha_required) setCaptchaRequired(true);
                if (err.response.data?.captcha_passed) setCaptchaRequired(false);
                setCaptchaToken('');
                if (window.grecaptcha && captchaWidgetId.current !== null) {
                    window.grecaptcha.reset(captchaWidgetId.current);
                }
                setErrorMessage("E-mail ou mot de passe incorrect.")
            } else if (statusError === 428 && err.response.data?.captcha_required) {
                // The server requires a CAPTCHA, for example if the browser UI was out of sync.
                if (captchaWidgetId.current !== null) {
                    window.grecaptcha?.reset(captchaWidgetId.current);
                    captchaWidgetId.current = null;
                }
                setCaptchaRequired(true);
            } else if (statusError === 400 && captchaRequired) {
                setCaptchaToken('');
                setCaptchaError('La vérification a échoué. Cochez à nouveau la case.');
                if (window.grecaptcha && captchaWidgetId.current !== null) {
                    window.grecaptcha.reset(captchaWidgetId.current);
                }
            } else {
                console.log(err.response)
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

                            {/* Captcha section */}
                            {captchaRequired && (
                                <div className="space-y-2">
                                    {siteKey ? (
                                        <div ref={captchaContainer} />
                                    ) : (
                                        <p className="text-sm text-red-600">La vérification de sécurité n’est pas configurée.</p>
                                    )}
                                    {captchaError && (
                                        <span className="text-xs text-red-500 block">{captchaError}</span>
                                    )}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                // disabled={isSubmitting || (captchaRequired && !siteKey)}
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
