import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '../api/api'

const RegisterPage = () => {
    const navigate = useNavigate();

    // Form input states
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        rgpdConsent: false,
    });

    // UI and Validation states
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Regex patterns for email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Strong password: at least 8 chars, 1 uppercase, 1 digit, 1 special character
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

    /**
     * Handle input field value changes
     */
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        // Clear field-specific error on change
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    /**
     * Validate all form fields against acceptance criteria
     */
    const validateForm = () => {
        const newErrors = {};

        if (!formData.firstName.trim()) newErrors.firstName = 'Ce champ est requis.';
        if (!formData.lastName.trim()) newErrors.lastName = 'Ce champ est requis.';

        if (!formData.email.trim()) {
            newErrors.email = "Ce champ est requis.";
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address.';
        }

        if (!formData.password) {
            newErrors.password = 'Ce champ est requis.';
        } else if (!passwordRegex.test(formData.password)) {
            newErrors.password =
                'Au moins 8 caractères, une majuscule, un chiffre et un caractère spécial';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Confirmez votre mot de passe.';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Les mots de passe saisis ne sont pas identiques.';
        }

        if (!formData.rgpdConsent) {
            newErrors.rgpdConsent = "Vous debez accepter les conditions générales d'utilisation.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * Handle registration form submission
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');
        setSuccessMessage('');

        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            console.log(formData)
            const res = await api.post("user_api/users/", {
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                password: formData.password
            })
            if (res.status == 201) {
                setSuccessMessage('Inscription réussie ! Redirection vers la page de connexion...');
                // Redirect to login page after 2 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        } catch (err) {
            // Handle server-side errors (email already exists, ...)
            const emailError = err.response.data.email
            console.log(emailError)
            if (emailError) {
                setApiError(emailError);
            } else {
                setApiError('Impossible de se connecter au serveur. Veuillez réessayer plus tard.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const isEmailValid = emailRegex.test(formData.email);

    return (
        <div className="min-h-screen flex flex-col justify-between bg-slate-50 font-sans">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:flex-row">

                {/* Left Hero Section (Desktop Only) */}
                <div className="hidden md:flex md:w-1/2 bg-linear-to-tl from-slate-800 via-cyan-900 to-mist-700 text-white p-12 flex-col justify-center relative overflow-hidden">
                    <div className="max-w-lg mx-auto z-10">
                        <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                            Commencez votre voyage vers votre prochain véhicule.
                        </h1>
                        <p className="text-slate-300 text-lg">
                            Rejoignez la communauté la plus sélective de passionnés d'automobile et trouvez votre prochain chef-d'œuvre.
                        </p>
                    </div>
                </div>

                {/* Right Form Section */}
                <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12">
                    <div className="w-full max-w-md space-y-6">

                        {/* Form Title */}
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Créer un compte</h2>
                            <p className="text-sm text-slate-500 mt-1">
                                Saisissez vos informations pour créer votre profil.
                            </p>
                        </div>

                        {/* Global API Feedback Messages */}
                        {apiError && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
                                {apiError}
                            </div>
                        )}
                        {successMessage && (
                            <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md">
                                {successMessage}
                            </div>
                        )}

                        {/* Registration Form */}
                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

                            {/* First Name & Last Name Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 tracking-wider uppercase mb-1">
                                        PRÉNOM
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        placeholder="John"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-blue-600 bg-white"
                                    />
                                    {errors.firstName && (
                                        <span className="text-xs text-red-500 mt-1 block">{errors.firstName}</span>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 tracking-wider uppercase mb-1">
                                        NOM
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        placeholder="Doe"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-blue-600 bg-white"
                                    />
                                    {errors.lastName && (
                                        <span className="text-xs text-red-500 mt-1 block">{errors.lastName}</span>
                                    )}
                                </div>
                            </div>

                            {/* Email Input with Success Icon */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 tracking-wider uppercase mb-1">
                                    E-MAIL
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="john.doe@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-blue-600 bg-white"
                                    />
                                    {isEmailValid && (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />
                                    )}
                                </div>
                                {errors.email && (
                                    <span className="text-xs text-red-500 mt-1 block">{errors.email}</span>
                                )}
                            </div>

                            {/* Password Input with Icon */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 tracking-wider uppercase mb-1">
                                    MOT DE PASSE
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        placeholder="••••••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-blue-600 bg-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        aria-label="Toggle password visibility"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <span className="text-xs text-red-500 mt-1 block">{errors.password}</span>
                                )}
                            </div>

                            {/* Confirm Password Input */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 tracking-wider uppercase mb-1">
                                    CONFIRMATION DU MOT DE PASSE
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="••••••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-blue-600 bg-white"
                                />
                                {errors.confirmPassword && (
                                    <span className="text-xs text-red-500 mt-1 block">{errors.confirmPassword}</span>
                                )}
                            </div>

                            {/* RGPD Consent Checkbox */}
                            <div>
                                <div className="flex items-start gap-2 mt-2">
                                    <input
                                        type="checkbox"
                                        id="rgpdConsent"
                                        name="rgpdConsent"
                                        checked={formData.rgpdConsent}
                                        onChange={handleChange}
                                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="rgpdConsent" className="text-xs text-slate-600">
                                        J'accepte les{' '}
                                        <Link to="/mentions-legales" className="text-blue-600 underline">
                                            Conditions d'utilisation
                                        </Link>{' '}
                                        et reconnais avoir lu la{' '}
                                        <Link to="/mentions-legales" className="text-blue-600 underline">
                                            politique de confidentialité
                                        </Link>
                                        .
                                    </label>
                                </div>
                                {errors.rgpdConsent && (
                                    <span className="text-xs text-red-500 mt-1 block">{errors.rgpdConsent}</span>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                            >
                                <span>Créer mon compte</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>

                        {/* Login Link */}
                        <div className="text-center text-sm text-slate-600 pt-2">
                            Vous avez déjà un compte ?{' '}
                            <Link to="/login" className="text-blue-600 hover:underline font-medium">
                                Se connecter
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;