import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from '../App';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Layout from '../components/Layout';
import { AuthProvider } from '../context/AuthContext';
import { ACCESS_TOKEN, IS_ADMIN } from '../constants';

// Seed local storage before mounting the provider to represent each account type.
function renderNavbar({ authenticated = false, admin = false } = {}) {
  if (authenticated) localStorage.setItem(ACCESS_TOKEN, 'token');
  if (admin) localStorage.setItem(IS_ADMIN, 'true');
  return render(<AuthProvider><MemoryRouter><Navbar /></MemoryRouter></AuthProvider>);
}

describe('application shell and navigation', () => {
  it('shows public navigation, toggles the mobile menu, and signs out', async () => {
    renderNavbar({ authenticated: true });
    expect(await screen.findByRole('link', { name: 'Acheter' })).toHaveAttribute('href', '/vehicules?type=achat');
    expect(screen.getByRole('link', { name: 'Mes dossiers' })).toBeInTheDocument();
    fireEvent.click(document.querySelector('nav button'));
    expect(screen.getAllByRole('link', { name: 'Louer' }).length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole('button', { name: 'Se déconnecter' })[0]);
    expect(localStorage.getItem(ACCESS_TOKEN)).toBeNull();
  });

  it('shows admin navigation and hides public purchase links', async () => {
    renderNavbar({ authenticated: true, admin: true });
    expect((await screen.findAllByText(/Administrateur/)).length).toBe(2);
    expect(screen.getByRole('link', { name: 'Dossiers' })).toHaveAttribute('href', '/admin/dossiers');
    expect(screen.queryByRole('link', { name: 'Acheter' })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Se déconnecter' })[0]);
  });

  it('renders the footer and layout wrapper', () => {
    const { unmount } = render(<MemoryRouter><Footer /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Mentions légales' })).toHaveAttribute('href', '/mentions-legales');
    unmount();
    render(<AuthProvider><MemoryRouter><Layout><span>page content</span></Layout></MemoryRouter></AuthProvider>);
    expect(screen.getByText('page content')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('mounts the application route tree on its public home page', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: /excellence en mouvement/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'M-MOTORS' })).toHaveAttribute('href', '/');
  });
});
