import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50/50">
      <Navbar />
      <main className="grow">{children}</main>
      <Footer />
    </div>
  );
}