import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../api/api';
import AdminApplications from '../pages/AdminApplications';
import toast from 'react-hot-toast';

vi.mock('../api/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

// Reuse one representative pending application across the review scenarios.
const entry = {
  id: 31, created_at: '2025-02-02', user: { first_name: 'Jhon', last_name: 'Lovelace', email: 'jhon@example.com' },
  vehicle: { id: 8, contract_type: { name: 'Vente' }, model: { maker: { name: 'Volvo' }, name: 'XC60' } },
  status: { name: 'Déposé' }, documents: [
    { id: 3, document_type: 'identity', file_extension: '.pdf' },
    { id: 4, document_type: 'driving_license' },
  ],
};

function renderAdmin() {
  api.get.mockImplementation((url) => Promise.resolve({ data: url.endsWith('/31/') ? entry : { results: [entry], count: 1 } }));
  return render(<MemoryRouter><AdminApplications /></MemoryRouter>);
}

describe('admin application review', () => {
  beforeEach(() => { api.get.mockReset(); api.post.mockReset(); });

  it('filters the queue and opens a dossier detail with both document types', async () => {
    renderAdmin();
    expect(await screen.findByRole('link', { name: 'Volvo XC60' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Location' }));
    await waitFor(() => expect(api.get).toHaveBeenLastCalledWith('/application_api/application/', expect.objectContaining({ params: expect.objectContaining({ type: 'location' }) })));
    fireEvent.click(screen.getByRole('button', { name: 'Jhon Lovelace' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Pièce d’identité')).toBeInTheDocument();
    expect(screen.getByText('Permis de conduire')).toBeInTheDocument();
  });

  it('rejects a pending application with a reason and reloads the queue', async () => {
    api.post.mockResolvedValue({ data: { ...entry, status: { name: 'Refusé' }, reject_justification: 'Document illisible' } });
    renderAdmin();
    await screen.findByRole('link', { name: 'Volvo XC60' });
    fireEvent.click(screen.getByRole('button', { name: 'Jhon Lovelace' }));
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: /refuser le dossier/i }));
    fireEvent.change(screen.getByPlaceholderText('Ex. : document illisible'), { target: { value: 'Document illisible' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer le refus' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/application_api/application/31/reject/', { reject_justification: 'Document illisible' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Le dossier a été refusé.'));
  });

  it('approves a pending application without a rejection reason', async () => {
    api.post.mockResolvedValue({ data: { ...entry, status: { name: 'Validé' } } });
    renderAdmin();
    await screen.findByRole('link', { name: 'Volvo XC60' });
    fireEvent.click(screen.getByText('31'));
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: /valider le dossier/i }));
    expect(await screen.findByRole('alertdialog')).toHaveTextContent(/confirmez-vous la validation/i);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la validation' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/application_api/application/31/approve/', {}));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Le dossier a été validé.'));
  });

  it('downloads both document types with fallback filenames when the response has no filename', async () => {
    // Capture the download attribute instead of asking jsdom to navigate to a blob URL.
    const NativeURL = globalThis.URL;
    class TestURL extends NativeURL {}
    TestURL.createObjectURL = vi.fn(() => 'blob:admin-document');
    TestURL.revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', TestURL);
    const filenames = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function captureFilename() { filenames.push(this.download); });
    renderAdmin();
    api.get.mockImplementation((url = '') => Promise.resolve({
      data: url.endsWith('/31/') ? entry : new Blob(['document']),
      headers: {},
    }));
    await screen.findByRole('link', { name: 'Volvo XC60' });
    fireEvent.click(screen.getByRole('button', { name: 'Jhon Lovelace' }));
    await screen.findByRole('dialog');
    fireEvent.click(screen.getAllByRole('button', { name: 'Télécharger' })[0]);
    await waitFor(() => expect(filenames).toContain('piece-identite.pdf'));
    fireEvent.click(screen.getAllByRole('button', { name: 'Télécharger' })[1]);
    await waitFor(() => expect(filenames).toContain('permis-de-conduire'));
    vi.unstubAllGlobals();
  });
});
