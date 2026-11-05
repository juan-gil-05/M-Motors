import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../api/api';
import VehicleDetails from '../pages/VehicleDetails';
import { AuthProvider } from '../context/AuthContext';
import { ACCESS_TOKEN } from '../constants';

vi.mock('../api/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('react-hot-toast', () => ({ default: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));
import toast from 'react-hot-toast';

// Model a lease vehicle with several photos to exercise the gallery and dossier form.
const vehicle = {
  id: 3, price: 32000, kilometres: 12000, contract_type: { name: 'Location' },
  lease_details: { commitment_time: 36, kilometres_per_year: 15000, final_purchase_price: 12000 },
  fuel: { name: 'Hybride' }, gearbox: { name: 'Automatique' },
  model: { name: 'A4', year: 2023, maker: { name: 'Audi' } },
  images: Array.from({ length: 6 }, (_, index) => ({ image_url: `/photo-${index + 1}.jpg`, is_main: index === 0 })),
};

function LocationText() { return <span data-testid="current-location">{useLocation().pathname}</span>; }

// Render the route with or without a stored access token to test both user states.
function renderDetails({ authenticated = false } = {}) {
  if (authenticated) localStorage.setItem(ACCESS_TOKEN, 'access-token');
  return render(<AuthProvider><MemoryRouter initialEntries={['/vehicule/3']}><Routes>
    <Route path="/vehicule/:id" element={<VehicleDetails />} />
    <Route path="/connexion" element={<><span>login page</span><LocationText /></>} />
  </Routes></MemoryRouter></AuthProvider>);
}

describe('vehicle details and application submission', () => {
  beforeEach(() => {
    api.get.mockReset();
    api.post.mockReset();
    api.get.mockResolvedValue({ data: vehicle });
  });

  it('renders lease specifications, opens the full gallery, and handles keyboard navigation', async () => {
    renderDetails();
    expect(await screen.findByRole('heading', { name: 'Audi A4' })).toBeInTheDocument();
    expect(screen.getByText('Sans apport initial')).toBeInTheDocument();
    expect(screen.getByText('Assurance Tous Risques')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Voir les 6 photos' }));
    expect(screen.getByText('Photo 4 / 6')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByText('Photo 5 / 6')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(screen.getByText('Photo 4 / 6')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Photo 4 / 6')).not.toBeInTheDocument();
  });

  it('asks anonymous visitors to sign in before opening the application form', async () => {
    renderDetails();
    await screen.findByRole('heading', { name: 'Audi A4' });
    fireEvent.click(screen.getByRole('button', { name: 'Déposer un dossier' }));
    expect(await screen.findByText('login page')).toBeInTheDocument();
    expect(screen.getByTestId('current-location')).toHaveTextContent('/connexion');
    expect(toast).toHaveBeenCalledWith('Connectez-vous pour déposer votre dossier.');
  });

  it('validates required documents and consent, then submits the confirmed application', async () => {
    api.post.mockResolvedValue({ status: 201 });
    renderDetails({ authenticated: true });
    await screen.findByRole('heading', { name: 'Audi A4' });
    fireEvent.click(screen.getByRole('button', { name: 'Déposer un dossier' }));
    fireEvent.click(screen.getByRole('button', { name: 'Valider le dépôt' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/joindre votre pièce/i);

    // Use in-memory files to verify the multipart submission without filesystem access.
    const identity = new File(['id'], 'identity.pdf', { type: 'application/pdf' });
    const license = new File(['license'], 'license.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Ajouter une pièce d’identité'), { target: { files: [identity] } });
    fireEvent.change(screen.getByLabelText('Ajouter le permis de conduire'), { target: { files: [license] } });
    fireEvent.click(screen.getByRole('button', { name: 'Valider le dépôt' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/consentement/i);
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Valider le dépôt' }));
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer le dépôt' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/application_api/application/', expect.any(FormData), expect.any(Object)));
    expect(await screen.findByRole('button', { name: 'Déposer un dossier' })).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalled();
  });

  it('shows the missing vehicle state when its request fails', async () => {
    api.get.mockRejectedValueOnce(new Error('offline'));
    const { container } = renderDetails();
    expect(await screen.findByRole('heading', { name: 'Véhicule introuvable' })).toBeInTheDocument();
    expect(container.querySelector('a[href="/"]')).toBeInTheDocument();
  });
});
