/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/api';
import carDefault from '../assets/car_default.webp';

const PAGE_SIZE = 10;

const getVehicleName = (vehicle) =>
  [vehicle?.model?.maker?.name, vehicle?.model?.name].filter(Boolean).join(' ') || 'Véhicule';

const getTypeLabel = (vehicle) =>
  vehicle?.contract_type?.name?.toLowerCase() === 'location' ? 'Location' : 'Achat';

const getStatusPresentation = (name = '') => {
  const status = name.toLowerCase();
  if (status === 'validé') return { label: 'VALIDÉ', className: 'bg-green-600 text-white' };
  if (status === 'refusé') return { label: 'REFUSÉ', className: 'bg-red-600 text-white' };
  return { label: 'EN ATTENTE', className: 'bg-orange-200 text-orange-700' };
};

const formatDate = (value) => new Intl.DateTimeFormat('fr-FR').format(new Date(value));

export default function PersonalSpace() {
  const [applications, setApplications] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/application_api/application/', {
        params: { page, page_size: PAGE_SIZE, status, type },
      });
      setApplications(data.results || data);
      setCount(data.count ?? data.length ?? 0);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Impossible de charger vos dossiers.');
    } finally {
      setLoading(false);
    }
  }, [page, status, type]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const changeFilter = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl">Mon Espace Personnel</h1>
          <p className="mt-2 text-slate-600">Gérez vos demandes de financement et de location en un seul endroit.</p>
        </header>

        {/* filter section */}
        <section aria-label="Filtres des dossiers" className="flex flex-wrap items-end justify-center gap-4 rounded-3xl bg-slate-200/70 px-6 py-5 sm:justify-start sm:px-10">
          <div className="mr-2 flex items-center gap-2 self-center font-semibold text-slate-700">
            <SlidersHorizontal className="h-5 w-5" /> Filtrer mes dossiers
          </div>
          <label className="grid gap-1.5 text-sm font-medium uppercase text-slate-700">
            Statut
            <select value={status} onChange={changeFilter(setStatus)} className="min-w-40 rounded-xl border-0 bg-white px-4 py-2.5 normal-case text-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tous</option>
              <option value="Déposé">En attente</option>
              <option value="Validé">Validé</option>
              <option value="Refusé">Refusé</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium uppercase text-slate-700">
            Type
            <select value={type} onChange={changeFilter(setType)} className="min-w-40 rounded-xl border-0 bg-white px-4 py-2.5 normal-case text-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tous</option>
              <option value="achat">Achat</option>
              <option value="location">Location</option>
            </select>
          </label>
        </section>

        {loading ? (
          <div className="rounded-3xl bg-white px-6 py-16 text-center text-slate-500">Chargement de vos dossiers…</div>
        ) : applications.length ? (
          <section aria-label="Mes dossiers" className="space-y-4">
            {applications.map((application) => {
              const vehicle = application.vehicle;
              const statusView = getStatusPresentation(application.status?.name);
              const image = vehicle?.images?.find((item) => item.is_main)?.image_url || vehicle?.images?.[0]?.image_url || carDefault;
              return (
                <Link
                  key={application.id}
                  to={`/espace-personnel/dossiers/${application.id}`}
                  className="group flex min-h-36 flex-col gap-4 rounded-3xl bg-slate-200/70 p-4 transition hover:bg-slate-200 hover:shadow-sm sm:flex-row sm:items-center sm:px-5"
                >
                  <img src={image} alt={getVehicleName(vehicle)} className="h-28 w-full rounded-2xl object-cover sm:w-48" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-800">{getVehicleName(vehicle)}</h2>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${getTypeLabel(vehicle) === 'Location' ? 'bg-slate-600 text-white' : 'bg-blue-100 text-blue-700'}`}>
                        {getTypeLabel(vehicle).toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">Déposé le : {formatDate(application.created_at)}</p>
                  </div>
                  <span className={`w-fit rounded-xl px-4 py-2 text-sm font-bold shadow-sm ${statusView.className}`}>
                    {statusView.label}
                  </span>
                  <ArrowRight aria-hidden="true" className="hidden h-5 w-5 text-slate-600 transition group-hover:translate-x-1 sm:block" />
                </Link>
              );
            })}
            {/* Pagination section */}
            {totalPages > 1 && (
              <nav aria-label="Pagination des dossiers" className="flex items-center justify-center gap-2 pt-4">
                <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg bg-white px-4 py-2 text-slate-700 disabled:opacity-40">Précédent</button>
                <span className="px-3 text-sm text-slate-600">{page} / {totalPages}</span>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-lg bg-white px-4 py-2 text-slate-700 disabled:opacity-40">Suivant</button>
              </nav>
            )}
          </section>
        ) : (
          <section className="rounded-3xl bg-white px-6 py-14 text-center shadow-sm">
            <FileText className="mx-auto h-12 w-12 text-blue-600" />
            <h2 className="mt-4 text-xl font-semibold text-slate-800">
              {status || type ? 'Aucun dossier ne correspond à ces filtres.' : 'Vous n’avez pas encore déposé de dossier.'}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-slate-600">Parcourez notre catalogue pour découvrir les véhicules disponibles à l’achat ou à la location.</p>
            <Link to="/vehicules" className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-blue-700">
              Voir les véhicules
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
