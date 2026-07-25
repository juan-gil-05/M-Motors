import React from 'react';
import { Link } from 'react-router-dom';
// Icons SVG
import {Search, ShoppingBag, KeySquare} from "lucide-react"

export default function Home() {
    return (
        <div className="space-y-16 pb-16">

            {/* HERO SECTION */}
            <section className="relative h-120 md:h-135.5 bg-slate-900 flex items-center justify-start overflow-hidden">
                <img
                    src="../src/assets/home_hero.webp"
                    alt="Voiture M-Motors"
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                    fetchPriority="high"
                />
                <div className="absolute inset-0 bg-linear-to-r from-slate-950/80 via-slate-900/40 to-transparent"></div>

                <div className="relative max-w-7xl mx-auto px-6 sm:px-8 text-white space-y-6">
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight uppercase max-w-xl">
                        L'excellence en mouvement.
                    </h1>
                    <p className="text-sm md:text-base text-gray-200 max-w-md font-light">
                        Le spécialiste de la vente de véhicules d'occasion de qualité, au service de votre satisfaction depuis 1987.
                    </p>
                    <div>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg border-2 border-blue-400 shadow-lg transition"
                        >
                            {/* search icon */}
                            <Search/>
                            Voir tous les véhicules
                        </Link>
                    </div>
                </div>
            </section>

            {/* SECTION PROJETS (Buying / Leasing) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="mb-8">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Voitures en parfait état mécanique</span>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
                        TROUVER VOTRE PROCHAIN VÉHICULE DE CONFIANCE.
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Buy card */}
                    <div className="bg-slate-100/80 p-8 rounded-2xl flex flex-col justify-between space-y-6 hover:shadow-md transition border border-slate-200/60">
                        <div className="space-y-4">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                                <ShoppingBag/>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Votre Projet d'Achat</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Trouvez le véhicule idéal parmi une large gamme de marques, modèles, motorisations et prix pour tous les budgets. Nous vous offrons : Essai routier, Solutions de financement sur-mesure et Reprise d'ancien véhicule.
                            </p>
                        </div>
                        <Link to="/vehicules?type=achat" className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800">
                            Voir les voitures à acheter &rarr;
                        </Link>
                    </div>

                    {/* Lease card */}
                    <div className="bg-slate-100/80 p-8 rounded-2xl flex flex-col justify-between space-y-6 hover:shadow-md transition border border-slate-200/60">
                        <div className="space-y-4">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                                <KeySquare/>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Votre projet de location</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Découvrez notre service de location longue durée avec option d'achat. Nous vous accompagnons pour trouver la solution la plus adaptée à votre situation.
                            </p>
                        </div>
                        <Link to="/vehicules?type=location" className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800">
                            Voir les voitures à louer &rarr;
                        </Link>
                    </div>
                </div>
            </section>

            {/* SECTION ABOUT */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="rounded-2xl overflow-hidden shadow-xl">
                        <img
                            src="../src/assets/about.webp"
                            alt="Remise de clés M-Motors"
                            className="w-full h-87.5 object-cover"
                        />
                    </div>
                    <div className="space-y-6">
                        <h2 className="text-3xl font-extrabold text-slate-900">Découvrez M-Motors</h2>
                        <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                            Fondée en 1987, M-Motors est devenue l'une des 10 premières entreprises nationales, grâce à un million de clients satisfaits et l'expertise de nos 800 employés.
                        </p>
                        <div className="grid grid-cols-2 gap-6 pt-4">
                            <div>
                                <span className="block text-2xl md:text-3xl font-black text-blue-600">30+ ANS</span>
                                <span className="text-xs md:text-sm font-bold text-blue-800 tracking-wider uppercase">D'EXPÉRIENCE</span>
                            </div>
                            <div>
                                <span className="block text-2xl md:text-3xl font-black text-blue-600">1 MILLION</span>
                                <span className="text-xs md:text-sm font-bold text-blue-800 tracking-wider uppercase">CLIENTS SATISFAITS</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
}