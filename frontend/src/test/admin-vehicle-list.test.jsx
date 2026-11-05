import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../api/api';
import AdminVehicleList from '../pages/AdminVehicleList';
import toast from 'react-hot-toast';

vi.mock('../api/api', () => ({ default: { get: vi.fn(), delete: vi.fn() } }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

// Keep the inventory response small and predictable for filter and delete tests.
const vehicles = [{
  id: 5, price: 15000, contract_type: { name: 'Location' }, status: { name: 'Loué' },
  model: { name: 'Clio', maker: { name: 'Renault' } }, images: [],
}];
function renderList() {
  api.get.mockResolvedValue({ data: { results: vehicles, count: 1 } });
  return render(<MemoryRouter initialEntries={['/admin/vehicules']}><Routes>
    <Route path="/admin/vehicules" element={<AdminVehicleList />} />
    <Route path="/vehicule" element={<span>vehicle form</span>} />
    <Route path="/vehicule/:id" element={<span>vehicle detail</span>} />
  </Routes></MemoryRouter>);
}

describe('admin vehicle inventory', () => {
  beforeEach(() => { api.get.mockReset(); api.delete.mockReset(); });

  it('renders the inventory and updates search, filters, and sort order', async () => {
    renderList();
    expect(await screen.findByText(/Renault - modèle: Clio/)).toBeInTheDocument();
    expect(screen.getAllByText('Louée').length).toBeGreaterThan(0);
    fireEvent.change(screen.getByPlaceholderText('Chercher par marque, ou modèle.'), { target: { value: 'Clio' } });
    fireEvent.click(screen.getByRole('button', { name: 'Vente' }));
    await waitFor(() => expect(api.get).toHaveBeenLastCalledWith('/vehicle_api/vehicles/', expect.objectContaining({ params: expect.objectContaining({ search: 'Clio', contract_type: '1' }) })));
    fireEvent.click(screen.getByRole('button', { name: /prix/i }));
    await waitFor(() => expect(api.get).toHaveBeenLastCalledWith('/vehicle_api/vehicles/', expect.objectContaining({ params: expect.objectContaining({ ordering: 'price' }) })));
  });

  it('confirms deletion and retries with force after linked applications are reported', async () => {
    api.delete.mockRejectedValueOnce({ response: { status: 409, data: { message: 'Dossier lié.' } } }).mockResolvedValueOnce({});
    renderList();
    await screen.findByText(/Renault - modèle: Clio/);
    fireEvent.click(screen.getByTitle('Supprimer'));
    expect(await screen.findByRole('alertdialog')).toHaveTextContent('Confirmer la suppression');
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Supprimer' }));
    expect(await screen.findByText('Dossier lié.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /supprimer le véhicule et les dossiers/i }));
    await waitFor(() => expect(api.delete).toHaveBeenLastCalledWith('/vehicle_api/vehicles/5/', { params: { force: true } }));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });
});
