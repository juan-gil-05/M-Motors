import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-gray-100 py-8 text-center text-xs text-gray-500">
      <div className="max-w-7xl mx-auto px-4 space-y-3">
        <p className="font-bold text-slate-800 tracking-wider text-sm">M-MOTORS</p>
        <div className="flex justify-center space-x-6 text-slate-600 font-medium">
          <Link to="/mentions-legales" className="hover:underline">Mentions légales</Link>
          <Link to="/contact" className="hover:underline">Contact</Link>
        </div>
        <p className="text-gray-400">© 2026 M-motors. Tous droits réservés.</p>
      </div>
    </footer>
  );
}