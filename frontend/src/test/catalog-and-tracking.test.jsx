import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../api/api';
import VehicleListPage from '../pages/VehicleList';
import ApplicationTracking from '../pages/ApplicationTracking';

vi.mock('../api/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

// Match endpoint paths to return the option lists and vehicle results the catalog expects.
const contractOptions = [{ id: 1, name: 'Vente' }, { id: 2, name: 'Location' }];
const setupCatalog = (vehicles = []) => {
  api.get.mockImplementation((url = '') => {
    if (url.includes('catalog/vehicles')) return Promise.resolve({ data: { count: vehicles.length, results: vehicles } });
    if (url.includes('contractType')) return Promise.resolve({ data: contractOptions });
    return Promise.resolve({ data: [] });
  });
};

describe('vehicle catalog and application tracking', () => {
  beforeEach(() => api.get.mockReset());

  it('loads vehicles, exposes filters, applies a contract filter, and resets it', async () => {
    setupCatalog([{ id: 7, price: 24500, kilometres: 12000, contract_type: { name: 'Location' }, model: { name: 'A4', year: 2022, maker: { name: 'Audi' } }, images: [] }]);
    render(<MemoryRouter initialEntries={['/vehicules?type=location']}><VehicleListPage /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'A4' })).toBeInTheDocument();
    expect(screen.getByText(/\/ mois/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer' }));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/vehicle_api/catalog/vehicles/', expect.objectContaining({ params: expect.objectContaining({ contract_type: '2' }) })));
    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser' }));
    await waitFor(() => expect(api.get).toHaveBeenLastCalledWith('/vehicle_api/catalog/vehicles/', expect.objectContaining({ params: expect.objectContaining({ ordering: '-price', contract_type: undefined }) })));
  });

  it('shows the empty and error states when catalog requests finish', async () => {
    setupCatalog();
    const { unmount } = render(<MemoryRouter><VehicleListPage /></MemoryRouter>);
    expect(await screen.findByText(/aucun véhicule ne correspond/i)).toBeInTheDocument();
    unmount();
    api.get.mockImplementation((url = '') => url.includes('catalog/vehicles')
      ? Promise.reject(new Error('offline'))
      : Promise.resolve({ data: [] }));
    render(<MemoryRouter><VehicleListPage /></MemoryRouter>);
    expect(await screen.findByText(/impossible de charger les véhicules/i)).toBeInTheDocument();
  });

  it('paginates a larger catalog, sorts it, and submits updated filter selections', async () => {
    const results = Array.from({ length: 13 }, (_, index) => ({ id: index + 1, price: 10000 + index, kilometres: 5000, model: { name: `Model ${index + 1}`, year: 2024, maker: { name: 'Audi' } }, images: [] }));
    setupCatalog(results);
    render(<MemoryRouter><VehicleListPage /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Model 1' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Page suivante' }));
    await waitFor(() => expect(api.get).toHaveBeenLastCalledWith('/vehicle_api/catalog/vehicles/', expect.objectContaining({ params: expect.objectContaining({ page: 2 }) })));
    fireEvent.change(screen.getByLabelText('Trier par :'), { target: { value: 'price' } });
    await waitFor(() => expect(api.get).toHaveBeenLastCalledWith('/vehicle_api/catalog/vehicles/', expect.objectContaining({ params: expect.objectContaining({ ordering: 'price', page: 1 }) })));
    fireEvent.click(screen.getByRole('button', { name: 'Filtrer' }));
    expect(screen.getByRole('button', { name: 'Appliquer' })).toBeVisible();
  });

  it('renders the approved dossier decision and document list', async () => {
    api.get.mockResolvedValue({ data: {
      id: 4, status: { name: 'Validé' }, created_at: '2025-01-02',
      vehicle: { model: { maker: { name: 'BMW' }, name: 'X3' }, images: [] },
      documents: [{ id: 9, document_type: 'identity', file_extension: '.pdf', original_filename: 'id.pdf' }],
    } });
    render(<MemoryRouter initialEntries={['/espace-personnel/dossiers/4']}><Routes><Route path="/espace-personnel/dossiers/:id" element={<ApplicationTracking />} /></Routes></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: /MM-2025-004/i })).toBeInTheDocument();
    expect(screen.getByText('Validé')).toBeInTheDocument();
    expect(screen.getByText('Pièce d’identité')).toBeInTheDocument();
  });

  it('shows a not-found state when the dossier does not exist', async () => {
    api.get.mockResolvedValue({ data: null });
    render(<MemoryRouter initialEntries={['/dossier/9']}><Routes><Route path="/dossier/:id" element={<ApplicationTracking />} /></Routes></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Dossier introuvable' })).toBeInTheDocument();
  });

  it('downloads a dossier document using its server-provided filename', async () => {
    api.get.mockImplementation((url = '') => url.includes('/content/')
      ? Promise.resolve({ data: new Blob(['pdf']), headers: { 'content-disposition': "attachment; filename=\"identity-copy.pdf\"" } })
      : Promise.resolve({ data: { id: 4, created_at: '2025-01-02', status: { name: 'Refusé' }, reject_justification: 'Pièce expirée', documents: [{ id: 9, document_type: 'identity', file_extension: '.pdf' }], vehicle: {} } }));
    const NativeURL = globalThis.URL;
    class TestURL extends NativeURL {}
    TestURL.createObjectURL = vi.fn(() => 'blob:document');
    TestURL.revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', TestURL);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<MemoryRouter initialEntries={['/espace-personnel/dossiers/4']}><Routes><Route path="/espace-personnel/dossiers/:id" element={<ApplicationTracking />} /></Routes></MemoryRouter>);
    expect(await screen.findByRole('alert')).toHaveTextContent('Pièce expirée');
    fireEvent.click(screen.getByRole('button', { name: /pièce d’identité/i }));
    await waitFor(() => expect(api.get).toHaveBeenLastCalledWith('/application_api/application/4/documents/9/content/?download=true', { responseType: 'blob' }));
    expect(click).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
