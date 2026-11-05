import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import api from '../api/api';
import LoginPage from '../pages/Login';
import RegisterPage from '../pages/RegisterPage';
import { AuthProvider } from '../context/AuthContext';
import toast from 'react-hot-toast';

vi.mock('../api/api', () => ({ default: { post: vi.fn() } }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

// Keep navigation and authentication state available without starting the full app.
const renderAuthPage = (page) => render(<AuthProvider><MemoryRouter>{page}</MemoryRouter></AuthProvider>);

describe('login and registration forms', () => {
  it('validates required login fields before sending a request', async () => {
    renderAuthPage(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(await screen.findAllByText('Ce champ est requis.')).toHaveLength(2);
    expect(api.post).not.toHaveBeenCalled();
  });

  it('submits valid login details and handles wrong credentials', async () => {
    api.post.mockRejectedValueOnce({ response: { status: 401, data: { captcha_required: true } } });
    renderAuthPage(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText('john.doe@example.com'), { target: { value: 'a@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(await screen.findByText('E-mail ou mot de passe incorrect.')).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith('/api/token/', { username: 'a@example.com', password: 'secret' });
  });

  it('stores tokens and redirects after successful login', async () => {
    api.post.mockResolvedValue({ status: 200, data: { access: 'access-token', refresh: 'refresh-token', is_staff: false } });
    render(<AuthProvider><MemoryRouter initialEntries={['/connexion']}><LoginPage /></MemoryRouter></AuthProvider>);
    fireEvent.change(screen.getByPlaceholderText('john.doe@example.com'), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'Strong123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Toggle password visibility' }));
    expect(screen.getByPlaceholderText('••••••••')).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
    await waitFor(() => expect(localStorage.getItem('access')).toBe('access-token'));
    expect(localStorage.getItem('refresh')).toBe('refresh-token');
    expect(toast.success).toHaveBeenCalledWith('Connexion reussi!');
  });

  it('validates registration fields and reports a successful account creation', async () => {
    api.post.mockResolvedValue({ status: 201 });
    renderAuthPage(<RegisterPage />);
    fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }));
    expect(await screen.findAllByText('Ce champ est requis.')).toHaveLength(4);
    fireEvent.change(screen.getByPlaceholderText('John'), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByPlaceholderText('Doe'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText('john.doe@example.com'), { target: { value: 'jane@example.com' } });
    fireEvent.change(document.querySelector('input[name="password"]'), { target: { value: 'Strong123!' } });
    fireEvent.change(document.querySelector('input[name="confirmPassword"]'), { target: { value: 'Strong123!' } });
    fireEvent.click(screen.getByLabelText(/j'accepte les/i));
    fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }));
    expect(await screen.findByText(/inscription réussie/i)).toBeInTheDocument();
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/user_api/users/', expect.objectContaining({ email: 'jane@example.com' })));
  });

  it('shows server registration errors and supports password visibility toggle', async () => {
    api.post.mockRejectedValue({ response: { data: { email: 'Adresse déjà utilisée.' } } });
    renderAuthPage(<RegisterPage />);
    fireEvent.change(screen.getByPlaceholderText('John'), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByPlaceholderText('Doe'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText('john.doe@example.com'), { target: { value: 'jane@example.com' } });
    fireEvent.change(document.querySelector('input[name="password"]'), { target: { value: 'Strong123!' } });
    fireEvent.change(document.querySelector('input[name="confirmPassword"]'), { target: { value: 'Strong123!' } });
    fireEvent.click(screen.getByLabelText(/j'accepte les/i));
    fireEvent.click(screen.getByRole('button', { name: /toggle password visibility/i }));
    expect(document.querySelector('input[name="password"]')).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }));
    expect(await screen.findByText('Adresse déjà utilisée.')).toBeInTheDocument();
  });
});
