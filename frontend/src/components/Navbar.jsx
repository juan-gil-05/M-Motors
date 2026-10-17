import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Icons SVG
import { Menu, CircleUserRound } from "lucide-react"

export default function Navbar() {
    const { isAuthenticated, logout, isAdmin } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate()

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Logo & Burger Mobile */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden text-gray-700 focus:outline-none"
                        >
                            {/* Icon burger menu */}
                            <Menu />
                        </button>
                        <Link to="/" className="text-2xl font-black tracking-wider text-slate-900">
                            M-MOTORS
                        </Link>
                    </div>


                    {/* Nav Links Desktop */}
                    <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-700">
                        {!isAdmin && <Link to="/vehicules?type=achat" className="hover:text-blue-600 transition-colors">Acheter</Link>}
                        {!isAdmin && <Link to="/vehicules?type=location" className="hover:text-blue-600 transition-colors">Louer</Link>}
                        {isAuthenticated && !isAdmin ?
                            // Shown only when user is logged in
                            <Link to="/espace-personnel" className="hover:text-blue-600 transition-colors">Mes dossiers</Link>
                            :
                            <></>
                        }
                        {isAdmin ?
                            // Admin navigation includes vehicle inventory and submitted applications.
                            <>
                                <Link to="/vehicules" className="hover:text-blue-600 transition-colors">Catalogue</Link>
                                <Link to="/admin/vehicules" className="hover:text-blue-600 transition-colors">Véhicules</Link>
                                <Link to="/admin/dossiers" className="hover:text-blue-600 transition-colors">Dossiers</Link>
                            </>
                            :
                            <></>
                        }
                    </div>

                    {/* Auth Buttons Desktop */}
                    <div className="hidden md:flex items-center space-x-3">
                        {isAdmin ? (
                            <>
                                <div className="flex items-center gap-3 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800">
                                    <CircleUserRound className="h-5 w-5" /> Administrateur
                                </div>
                                <button onClick={handleLogout} className="bg-blue-700 text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-blue-800 transition cursor-pointer">
                                    Se déconnecter
                                </button>
                            </>
                        ) : isAuthenticated ?
                            <button onClick={handleLogout} className="bg-blue-700 text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-blue-800 transition cursor-pointer">
                                Se déconnecter
                            </button>
                            :
                            <>
                                <Link to="/connexion" className="bg-blue-700 text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-blue-800 transition">
                                    Se connecter
                                </Link>
                                <Link to="/inscription" className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition">
                                    S'inscrire
                                </Link>
                            </>
                        }
                    </div>

                    {/* Mobile Profile Icon */}
                    <div className="md:hidden">
                        {isAdmin ? (
                            <div className='flex gap-2'>
                                <div className="flex items-center gap-3 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800">
                                    <CircleUserRound className="h-5 w-5" /> Administrateur
                                </div>
                                <button onClick={handleLogout} className="bg-blue-700 text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-blue-800 transition cursor-pointer">
                                    Se déconnecter
                                </button>
                            </div>
                        ) : isAuthenticated ?
                            <button onClick={handleLogout} className="bg-blue-700 text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-blue-800 transition cursor-pointer">
                                Se déconnecter
                            </button>
                            :
                            <div className='flex gap-2'>
                                <Link to="/connexion" className="bg-blue-700 text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-blue-800 transition">
                                    Se connecter
                                </Link>
                                <Link to="/inscription" className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition">
                                    S'inscrire
                                </Link>
                            </div>
                        }
                    </div>
                </div>
            </div>

            {/* Burger menu Mobile */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-4 space-y-3">
                    {!isAdmin && <Link to="/vehicules?type=achat" className="block text-slate-700 font-medium">Acheter</Link>}
                    {!isAdmin && <Link to="/vehicules?type=location" className="block text-slate-700 font-medium">Louer</Link>}
                    {isAuthenticated && !isAdmin && <Link to="/espace-personnel" className="block text-slate-700 font-medium">Mes dossiers</Link>}
                    {isAdmin && <Link to="/admin/dossiers" className="block text-slate-700 font-medium">Dossiers</Link>}
                    {isAdmin && <Link to="/admin/vehicules" className="block text-slate-700 font-medium">Véhicules</Link>}
                </div>
            )}
        </nav>
    );
}
