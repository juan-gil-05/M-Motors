import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../api/api';
import AddOrModifyVehicle from '../pages/AddOrModifyVehicle';
import toast from 'react-hot-toast';

vi.mock('../api/api', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

// Supply stable dropdown data so the form tests do not depend on a running API.
function renderForm() {
  api.get.mockImplementation((url) => {
    if (url.includes('makers')) return Promise.resolve({ data: { results: [{ id: 1, name: 'Audi' }] } });
    if (url.includes('models')) return Promise.resolve({ data: { results: [{ id: 2, name: 'A4', year: 2023 }] } });
    if (url.includes('gearboxes')) return Promise.resolve({ data: { results: [{ id: 3, name: 'Automatique' }] } });
    if (url.includes('fuels')) return Promise.resolve({ data: { results: [{ id: 4, name: 'Hybride' }] } });
    return Promise.resolve({ data: { results: [{ id: 1, name: 'Vente' }, { id: 2, name: 'Location' }] } });
  });
  return render(<MemoryRouter initialEntries={['/vehicule']}><Routes>
    <Route path="/vehicule" element={<AddOrModifyVehicle />} />
    <Route path="/admin/vehicules" element={<span>inventory</span>} />
  </Routes></MemoryRouter>);
}

describe('vehicle publication form', () => {
  beforeEach(() => { api.get.mockReset(); api.post.mockReset(); api.put.mockReset(); });

  it('loads form options and requires at least one vehicle photo', async () => {
    renderForm();
    expect(await screen.findByRole('option', { name: 'Audi' })).toBeInTheDocument();
    fireEvent.submit(document.querySelector('form'));
    expect(await screen.findByText('Veuillez ajouter au moins une photo du véhicule.')).toBeInTheDocument();
  });

  it('uploads a leasing vehicle with its contract terms and navigates after success', async () => {
    api.post.mockResolvedValue({ status: 201 });
    // jsdom does not create browser blob URLs, so provide deterministic test URLs.
    const NativeURL = globalThis.URL;
    class TestURL extends NativeURL {}
    let photoUrl = 0;
    TestURL.createObjectURL = vi.fn(() => `blob:vehicle-photo-${++photoUrl}`);
    TestURL.revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', TestURL);
    renderForm();
    await screen.findByRole('option', { name: 'Audi' });
    fireEvent.change(document.querySelector('select[name="make"]'), { target: { value: '1' } });
    fireEvent.change(document.querySelector('select[name="model"]'), { target: { value: '2' } });
    fireEvent.change(document.querySelector('select[name="gearbox"]'), { target: { value: '3' } });
    fireEvent.change(document.querySelector('select[name="fuel"]'), { target: { value: '4' } });
    fireEvent.click(screen.getByLabelText('Location'));
    fireEvent.change(document.querySelector('input[name="price"]'), { target: { value: '500' } });
    fireEvent.change(document.querySelector('select[name="commitment_time"]'), { target: { value: '36' } });
    fireEvent.change(document.querySelector('select[name="kilometres_per_year"]'), { target: { value: '15000' } });
    fireEvent.change(document.querySelector('input[name="final_purchase_price"]'), { target: { value: '12000' } });
    const photo = new File(['photo'], 'car.jpg', { type: 'image/jpeg' });
    const alternatePhoto = new File(['alternate'], 'alternate.jpg', { type: 'image/jpeg' });
    fireEvent.change(document.querySelector('input[type="file"][multiple]'), { target: { files: [photo, alternatePhoto] } });
    fireEvent.click(screen.getByRole('button', { name: 'Définir la photo 2 comme couverture' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Supprimer cette photo' })[0]);
    fireEvent.submit(document.querySelector('form'));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/vehicle_api/vehicles/', expect.any(FormData), expect.any(Object)));
    await screen.findByText('inventory');
    expect(toast.success).toHaveBeenCalledWith('Le véhicule a bien été ajouté');
    vi.unstubAllGlobals();
  });
});
