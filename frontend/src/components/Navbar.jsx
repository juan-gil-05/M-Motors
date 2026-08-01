import { useState } from 'react';
import { Link } from 'react-router-dom';
// Icons SVG
import { Menu, CircleUserRound } from "lucide-react"

export default function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
                        <Link to="/" className="hover:text-blue-600 transition-colors">Acheter</Link>
                        <Link to="/" className="hover:text-blue-600 transition-colors">Louer</Link>
                        <Link to="/" className="hover:text-blue-600 transition-colors">Mes dossiers</Link>
                    </div>

                    {/* Auth Buttons Desktop */}
                    <div className="hidden md:flex items-center space-x-3">
                        <Link to="/inscription" className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition">
                            S'inscrire
                        </Link>
                        <Link to="/login" className="bg-blue-700 text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-blue-800 transition">
                            Se connecter
                        </Link>
                    </div>

                    {/* Mobile Profile Icon */}
                    <div className="md:hidden">
                        <Link to="/login" className="text-slate-800">
                            <CircleUserRound/>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Burger menu Mobile */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-4 space-y-3">
                    <Link to="/" className="block text-slate-700 font-medium">Acheter</Link>
                    <Link to="/" className="block text-slate-700 font-medium">Louer</Link>
                    <Link to="/" className="block text-slate-700 font-medium">Mes dossiers</Link>
                    <div className="pt-2 flex flex-col gap-2">
                        <Link to="/inscription" className="w-full text-center bg-blue-600 text-white py-2 rounded-lg text-sm font-medium">S'inscrire</Link>
                        <Link to="/login" className="w-full text-center bg-blue-700 text-white py-2 rounded-lg text-sm font-medium">Se connecter</Link>
                    </div>
                </div>
            )}
        </nav>
    );
}