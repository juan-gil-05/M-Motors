import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminProtectedRoute from '../components/AdminProtectedRoute';
import LoadingSpinner from '../components/LoadingSpinner';
import Home from '../pages/Home';
import Unauthorized from '../pages/Unauthorized';
import LegalMentions from '../pages/LegalMentions';
import PersonalSpace from '../pages/PersonalSpace';
import api from '../api/api';

vi.mock('../api/api', () => ({ default: { get: vi.fn() } }));

// Expose context state and actions through a tiny component for direct assertions.
function AuthControls() {
  const auth = useAuth();
  return <div><span>{auth.isAuthenticated ? 'signed in' : 'signed out'}</span><button onClick={() => auth.login('access', 'refresh', true)}>login</button><button onClick={auth.logout}>logout</button></div>;
}

const renderRoute = (path, element) => render(
  <AuthProvider><MemoryRouter initialEntries={[path]}>{element}</MemoryRouter></AuthProvider>,
);

describe('shared pages and authentication helpers', () => {
  it('stores and clears the session through the auth context', async () => {
    render(<AuthProvider><AuthControls /></AuthProvider>);
    await screen.findByText('signed out');
    fireEvent.click(screen.getByText('login'));
    expect(await screen.findByText('signed in')).toBeInTheDocument();
    expect(localStorage.getItem('access')).toBe('access');
    fireEvent.click(screen.getByText('logout'));
    expect(await screen.findByText('signed out')).toBeInTheDocument();
  });

  it('throws a useful error when the auth hook is used outside its provider', () => {
    function InvalidConsumer() { useAuth(); return null; }
    expect(() => render(<InvalidConsumer />)).toThrow('useAuth doit être utilisé dans un AuthProvider');
  });

  it('renders the loading spinner variants and optional text', () => {
    const { rerender, container } = render(<LoadingSpinner size="xl" text="Wait" fullPage />);
    expect(screen.getByText('Wait')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('fixed');
    rerender(<LoadingSpinner size="unknown" />);
    expect(container.querySelector('svg')).toHaveClass('w-8');
  });

  it('renders the home calls to action and legal links', () => {
    renderRoute('/', <Home />);
    expect(screen.getByRole('heading', { name: /excellence en mouvement/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /voitures à louer/i })).toHaveAttribute('href', '/vehicules?type=location');
  });

  it('renders legal and unauthorized information with navigation options', () => {
    const { unmount } = render(<LegalMentions />);
    expect(screen.getByRole('heading', { name: /mentions légales/i })).toBeInTheDocument();
    unmount();
    render(<Unauthorized />);
    expect(screen.getByText('Erreur 403')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /retour à l'accueil/i })).toHaveAttribute('href', '/');
  });

  it('redirects anonymous and non-admin users from protected routes', async () => {
    const protectedView = <Routes><Route element={<ProtectedRoute />}><Route path="/private" element={<span>private page</span>} /></Route><Route path="/connexion" element={<span>login page</span>} /></Routes>;
    renderRoute('/private', protectedView);
    expect(await screen.findByText('login page')).toBeInTheDocument();
  });

  it('shows an empty personal space and reloads when a filter changes', async () => {
    api.get.mockResolvedValue({ data: { results: [], count: 0 } });
    renderRoute('/espace-personnel', <PersonalSpace />);
    expect(await screen.findByText(/vous n’avez pas encore déposé/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Statut'), { target: { value: 'Validé' } });
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
  });

  it('renders an application summary and fallback vehicle name', async () => {
    api.get.mockResolvedValue({ data: [{ id: 12, created_at: '2025-02-01', status: { name: 'Validé' }, vehicle: {} }] });
    renderRoute('/espace-personnel', <PersonalSpace />);
    expect(await screen.findByText('Véhicule')).toBeInTheDocument();
    expect(screen.getByText('VALIDÉ')).toBeInTheDocument();
  });

  it('keeps the admin route closed for a normal user', async () => {
    render(<AuthProvider><MemoryRouter initialEntries={['/admin']}><Routes><Route element={<AdminProtectedRoute />}><Route path="/admin" element={<span>admin page</span>} /></Route><Route path="/non-autorise" element={<span>forbidden page</span>} /></Routes></MemoryRouter></AuthProvider>);
    expect(await screen.findByText('forbidden page')).toBeInTheDocument();
  });
});
