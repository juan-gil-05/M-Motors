import React from 'react';
import { Copyright } from 'lucide-react'

export default function LegalMentions() {
    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-10">

            {/* Title */}
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 pb-2 border-b-4 border-slate-800 inline-block">
                    Mentions Légales & RGPD
                </h1>
            </div>

            {/* Bloc Author */}
            <div className="bg-slate-100/90 rounded-2xl p-6 md:p-8 space-y-4">
                <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide">ÉDITEUR DU SITE</h2>
                <p className="text-sm text-gray-600">Le site M-Motors est édité par la société M-Motors SAS.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-700 font-medium pt-2">
                    <div>
                        <p className="text-slate-900 font-bold uppercase">SIÈGE SOCIAL</p>
                        <p>15 Avenue de l'Automobile, 69000 Lyon, France</p>
                        <p className="mt-3 text-slate-900 font-bold uppercase">SIRET</p>
                        <p>701 421 212 00018</p>
                    </div>
                    <div>
                        <p className="text-slate-900 font-bold uppercase">DIRECTEUR DE LA PUBLICATION</p>
                        <p>Juan Gil</p>
                        <p className="mt-3 text-slate-900 font-bold uppercase">HÉBERGEMENT</p>
                        <p>Render</p>
                    </div>
                </div>
            </div>

            {/* Section RGPD */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 text-slate-900">
                    <Copyright />
                    <h2 className="text-xl md:text-2xl font-bold">Protection des Données Personnelles</h2>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 text-sm text-gray-600">
                    Dans le cadre d'un dépôt de dossier d'achat ou de location, M-Motors collecte des documents sensibles (pièces d'identité, permis de conduire).
                </div>

                {/* Guarantee Grid 2x2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-gray-100 space-y-1 shadow-sm">
                        <span className="text-blue-600 text-sm font-semibold flex items-center gap-2">✓ Finalité</span>
                        <p className="text-xs text-gray-600">Étude de solvabilité et constitution du contrat de location ou de vente.</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-100 space-y-1 shadow-sm">
                        <span className="text-blue-600 text-sm font-semibold flex items-center gap-2">✓ Destinataires</span>
                        <p className="text-xs text-gray-600">Vos données sont transmises exclusivement à nos partenaires financiers agréés pour l'examen de votre demande.</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-100 space-y-1 shadow-sm">
                        <span className="text-blue-600 text-sm font-semibold flex items-center gap-2">✓ Conservation</span>
                        <p className="text-xs text-gray-600">Les pièces justificatives sont supprimées automatiquement si le dossier n'aboutit pas, ou conservées pendant la durée légale.</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-100 space-y-1 shadow-sm">
                        <span className="text-blue-600 text-sm font-semibold flex items-center gap-2">✓ Accès restreint</span>
                        <p className="text-xs text-gray-600">Seuls les agents habilités de M-Motors et les analystes de nos partenaires financiers peuvent consulter vos pièces.</p>
                    </div>
                </div>

                {/* Acces data right */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 space-y-2 shadow-sm">
                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">👁️</div>
                        <h3 className="font-bold text-slate-900 text-sm">Droit d'accès</h3>
                        <p className="text-xs text-gray-600">Vous avez le droit de demander l'accès aux données personnelles que nous détenons à votre sujet à tout moment.</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-100 space-y-2 shadow-sm">
                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">🗑️</div>
                        <h3 className="font-bold text-slate-900 text-sm">Droit à l'effacement</h3>
                        <p className="text-xs text-gray-600">Vous pouvez exiger la suppression définitive de vos données personnelles de nos systèmes de stockage sécurisés.</p>
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className="space-y-2 pt-4">
                <h2 className="text-xl font-bold text-slate-900">Propriété Intellectuelle</h2>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                    L'ensemble des éléments présents sur le site (logos, textes, photographies des véhicules) est la propriété exclusive de M-Motors. Toute reproduction, même partielle, est strictement interdite sans autorisation préalable.
                </p>
            </div>

        </div>
    );
}