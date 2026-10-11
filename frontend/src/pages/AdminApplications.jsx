/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowDownUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleX,
  Download,
  ExternalLink,
  FileText,
  LoaderCircle,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/api';

const PAGE_SIZE = 10;

const STATUS_FILTERS = [
  { label: 'En attente', value: 'Déposé' },
  { label: 'Validé', value: 'Validé' },
  { label: 'Refusé', value: 'Refusé' },
];

const TYPE_FILTERS = [
  { label: 'Achat', value: 'achat' },
  { label: 'Location', value: 'location' },
];

const getUserName = (user) =>
  [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || 'Client';

const getVehicleName = (vehicle) =>
  [vehicle?.model?.maker?.name, vehicle?.model?.name].filter(Boolean).join(' ') || 'Véhicule';

const getContractLabel = (contractType) => {
  const name = contractType?.name?.toLowerCase();
  return name === 'location' ? 'Location' : 'Achat';
};

const getStatusLabel = (status) =>
  status?.name?.toLowerCase() === 'déposé' ? 'En attente' : status?.name || 'Inconnu';

const getDocumentLabel = (documentType) => {
  if (documentType === 'identity') return 'Pièce d’identité';
  if (documentType === 'driving_license') return 'Permis de conduire';
  return 'Document déposé';
};

const formatDate = (value) => new Intl.DateTimeFormat('fr-FR').format(new Date(value));

const AdminApplications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState('Déposé');
  const [selectedType, setSelectedType] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [decision, setDecision] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [savingDecision, setSavingDecision] = useState(false);
  const [documentLoadingId, setDocumentLoadingId] = useState(null);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  // Fetch the administrator's application page using the active status and contract filters.
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/application_api/application/', {
        params: { page, status: selectedStatus, type: selectedType },
      });
      setApplications(data.results || data);
      setCount(data.count ?? data.length ?? 0);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Impossible de charger les dossiers.');
    } finally {
      setLoading(false);
    }
  }, [page, selectedStatus, selectedType]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Load the full application before opening its review dialog.
  const openApplication = async (applicationId) => {
    setSelectedApplication(null);
    setLoadingDetails(true);
    try {
      const { data } = await api.get(`/application_api/application/${applicationId}/`);
      setSelectedApplication(data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Impossible de charger ce dossier.');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Retrieve sensitive files through the admin-only API and open or download the returned blob.
  const accessDocument = async (document, mode) => {
    const previewWindow = mode === 'preview' ? window.open('', '_blank') : null;
    if (previewWindow) previewWindow.opener = null;
    setDocumentLoadingId(document.id);
    try {
      const { data, headers } = await api.get(
        `/application_api/application/${selectedApplication.id}/documents/${document.id}/content/`,
        { responseType: 'blob' },
      );
      const objectUrl = URL.createObjectURL(data);
      if (mode === 'preview' && previewWindow) {
        previewWindow.location.href = objectUrl;
      } else if (mode === 'download') {
        const link = window.document.createElement('a');
        link.href = objectUrl;
        const responseFilename = headers['content-disposition']?.match(/filename="?([^";]+)"?/i)?.[1];
        const fallbackName = document.document_type === 'identity' ? 'piece-identite' : 'permis-de-conduire';
        link.download = responseFilename || `${fallbackName}${document.file_extension || ''}`;
        link.click();
        previewWindow?.close();
      } else {
        previewWindow?.close();
        toast.error('Le navigateur a bloqué la fenêtre de prévisualisation.');
      }
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      previewWindow?.close();
      toast.error(error.response?.data?.detail || 'Impossible d’ouvrir ce document.');
    } finally {
      setDocumentLoadingId(null);
    }
  };

  // Ask for confirmation before changing a dossier's review status.
  const requestDecision = (action) => {
    setRejectionReason('');
    setDecision(action);
  };

  const confirmDecision = async () => {
    if (!decision || !selectedApplication) return;
    setSavingDecision(true);
    try {
      const endpoint = decision === 'approve' ? 'approve' : 'reject';
      const payload = decision === 'reject' ? { reject_justification: rejectionReason } : {};
      const { data } = await api.post(
        `/application_api/application/${selectedApplication.id}/${endpoint}/`,
        payload,
      );
      setSelectedApplication(data);
      setDecision(null);
      toast.success(decision === 'approve' ? 'Le dossier a été validé.' : 'Le dossier a été refusé.');
      fetchApplications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'La mise à jour du dossier a échoué.');
    } finally {
      setSavingDecision(false);
    }
  };

  const isPending = selectedApplication?.status?.name?.toLowerCase() === 'déposé';
  const firstEntry = count === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastEntry = Math.min(page * PAGE_SIZE, count);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <h1 className="text-3xl font-bold text-slate-800">Gestion des dossiers</h1>

        <section aria-label="Filtres des dossiers" className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-2xl bg-white px-6 py-5 shadow-sm">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <SlidersHorizontal className="h-5 w-5" />
            <span>Filtrer par :</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-bold uppercase text-slate-700">Type :</span>
            {TYPE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                aria-pressed={selectedType === filter.value}
                onClick={() => {
                  setSelectedType(selectedType === filter.value ? '' : filter.value);
                  setPage(1);
                }}
                className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${selectedType === filter.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-bold uppercase text-slate-700">Statut :</span>
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                aria-pressed={selectedStatus === filter.value}
                onClick={() => {
                  setSelectedStatus(selectedStatus === filter.value ? '' : filter.value);
                  setPage(1);
                }}
                className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${selectedStatus === filter.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          {(selectedType || selectedStatus) && (
            <button
              type="button"
              onClick={() => {
                setSelectedType('');
                setSelectedStatus('');
                setPage(1);
              }}
              className="text-sm font-semibold text-blue-700 underline underline-offset-2"
            >
              Réinitialiser
            </button>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm" aria-label="Liste des dossiers">
          <div className="overflow-x-auto">
            <table className="w-full min-w-850px border-collapse text-left">
              <thead className="bg-slate-200/80 text-sm font-semibold uppercase tracking-wide text-slate-700">
                <tr>
                  <th scope="col" className="px-6 py-6">ID</th>
                  <th scope="col" className="px-6 py-6">Client</th>
                  <th scope="col" className="px-6 py-6">Véhicule</th>
                  <th scope="col" className="px-6 py-6">Type</th>
                  <th scope="col" className="px-6 py-6">
                    <span className="inline-flex items-center gap-2">Date <ArrowDownUp className="h-4 w-4" /></span>
                  </th>
                  <th scope="col" className="px-6 py-6">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="6" className="py-16 text-center text-slate-500">Chargement des dossiers…</td></tr>
                ) : applications.length === 0 ? (
                  <tr><td colSpan="6" className="py-16 text-center text-slate-500">Aucun dossier ne correspond à ces filtres.</td></tr>
                ) : applications.map((application) => (
                  <tr key={application.id} className="text-slate-700 hover:bg-slate-50">
                    <td className="px-6 py-8">
                      <button type="button" onClick={() => openApplication(application.id)} className="font-semibold text-blue-700 hover:underline">
                        {application.id}
                      </button>
                    </td>
                    <td className="px-6 py-8 font-semibold text-slate-800">
                      <button type="button" onClick={() => openApplication(application.id)} className="text-left hover:text-blue-700">
                        {getUserName(application.user)}
                      </button>
                    </td>
                    <td className="px-6 py-8">
                      <Link to={`/vehicule/${application.vehicle.id}`} className="font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900">
                        {getVehicleName(application.vehicle)}
                      </Link>
                    </td>
                    <td className="px-6 py-8">{getContractLabel(application.vehicle.contract_type)}</td>
                    <td className="px-6 py-8">{formatDate(application.created_at)}</td>
                    <td className="px-6 py-8">
                      <span className={`inline-flex min-w-28 justify-center rounded-full px-3 py-2 text-xs font-bold uppercase text-white ${application.status.name.toLowerCase() === 'validé' ? 'bg-green-600' : application.status.name.toLowerCase() === 'refusé' ? 'bg-red-700' : 'bg-slate-700'}`}>
                        {getStatusLabel(application.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 bg-slate-200/70 px-6 py-5 text-sm text-slate-600 sm:flex-row">
            <p>Affichage de {firstEntry} à {lastEntry} sur {count} entrées</p>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} aria-label="Page précédente" className="rounded-lg bg-white p-2.5 disabled:cursor-not-allowed disabled:opacity-40">
                <ChevronLeft className="h-5 w-5" />
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).slice(Math.max(0, page - 2), page + 2).map((pageNumber) => (
                <button key={pageNumber} type="button" onClick={() => setPage(pageNumber)} aria-current={pageNumber === page ? 'page' : undefined} className={`min-w-11 rounded-lg px-3 py-2.5 font-semibold ${pageNumber === page ? 'bg-blue-600 text-white' : 'bg-white text-slate-800 hover:bg-slate-100'}`}>
                  {pageNumber}
                </button>
              ))}
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} aria-label="Page suivante" className="rounded-lg bg-white p-2.5 disabled:cursor-not-allowed disabled:opacity-40">
                <ChevronRight className="h-5 w-5" />
              </button>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage(totalPages)} className="rounded-lg bg-white px-4 py-2.5 disabled:cursor-not-allowed disabled:opacity-40">Dernière</button>
            </div>
          </div>
        </section>
      </div>

      {loadingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="status">
          <LoaderCircle className="h-10 w-10 animate-spin text-white" />
          <span className="sr-only">Chargement du dossier</span>
        </div>
      )}

      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 sm:p-8">
          <section role="dialog" aria-modal="true" aria-labelledby="application-detail-title" className="relative my-auto w-full max-w-4xl space-y-7 rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <button type="button" onClick={() => setSelectedApplication(null)} aria-label="Fermer le détail du dossier" className="absolute right-6 top-6 rounded-lg p-2 text-slate-600 hover:bg-slate-100">
              <X className="h-6 w-6" />
            </button>
            <header className="pr-12">
              <p className="text-sm font-medium uppercase tracking-wide text-slate-600">Dossier # {selectedApplication.id}</p>
              <h2 id="application-detail-title" className="mt-1 text-2xl font-bold text-slate-800 sm:text-3xl">{getUserName(selectedApplication.user)}</h2>
            </header>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <h3 className="font-semibold uppercase text-slate-800">E-mail</h3>
                <span className="mt-1 inline-block text-slate-600 hover:text-blue-700">
                  {selectedApplication.user.email}
                </span>
              </div>
              <div>
                <h3 className="font-semibold uppercase text-slate-800">Véhicule concerné</h3>
                <button type="button" onClick={() => navigate(`/vehicule/${selectedApplication.vehicle.id}`)} className="mt-1 text-left font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900">
                  {getVehicleName(selectedApplication.vehicle)}
                </button>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-semibold uppercase text-slate-700">Documents déposés</h3>
                <span className="text-sm text-slate-500">{selectedApplication.documents.length} document(s)</span>
              </div>
              <ul className="space-y-3">
                {selectedApplication.documents.map((document) => (
                  <li key={document.id} className="flex flex-col gap-3 rounded-lg bg-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="rounded-md bg-white p-2 text-blue-600"><FileText className="h-5 w-5" /></span>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800">{getDocumentLabel(document.document_type)}</p>
                        <p className="truncate text-xs uppercase text-slate-500">
                          {document.file_extension ? `Format ${document.file_extension.slice(1)}` : 'Format détecté à l’ouverture'}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button type="button" disabled={documentLoadingId === document.id} onClick={() => accessDocument(document, 'preview')} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-blue-500 hover:text-blue-700 disabled:opacity-50">
                        <ExternalLink className="h-4 w-4" /> Voir
                      </button>
                      <button type="button" disabled={documentLoadingId === document.id} onClick={() => accessDocument(document, 'download')} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-blue-500 hover:text-blue-700 disabled:opacity-50">
                        <Download className="h-4 w-4" /> Télécharger
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {selectedApplication.reject_justification && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                Motif du refus : {selectedApplication.reject_justification}
              </p>
            )}

            {isPending && (
              <div className="space-y-3 pt-1">
                <button type="button" onClick={() => requestDecision('approve')} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-4 font-semibold text-white shadow-md hover:bg-blue-700">
                  <CheckCircle2 className="h-5 w-5" /> Valider le dossier
                </button>
                <button type="button" onClick={() => requestDecision('reject')} className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-100 px-5 py-4 font-semibold text-red-700 hover:bg-red-200">
                  <CircleX className="h-5 w-5" /> Refuser le dossier
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {decision && selectedApplication && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 p-4">
          <section role="alertdialog" aria-modal="true" aria-labelledby="decision-title" className="w-full max-w-lg space-y-5 rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <h2 id="decision-title" className="text-xl font-bold text-slate-800">
              {decision === 'approve' ? 'Confirmer la validation' : 'Confirmer le refus'}
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              {decision === 'approve'
                ? `Confirmez-vous la validation du dossier de ${getUserName(selectedApplication.user)} ?`
                : `Confirmez-vous le refus du dossier de ${getUserName(selectedApplication.user)} ?`}
            </p>
            {decision === 'reject' && (
              <label className="block text-sm font-medium text-slate-700">
                Motif du refus <span className="font-normal text-slate-500">(facultatif)</span>
                <textarea
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Ex. : document illisible"
                  className="mt-2 w-full resize-y rounded-lg border border-slate-300 p-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            )}
            <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <button type="button" disabled={savingDecision} onClick={() => setDecision(null)} className="rounded-lg bg-slate-100 px-5 py-3 font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50">Annuler</button>
              <button type="button" disabled={savingDecision} onClick={confirmDecision} className={`rounded-lg px-5 py-3 font-semibold text-white disabled:opacity-50 ${decision === 'approve' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-700 hover:bg-red-800'}`}>
                {savingDecision ? 'Mise à jour…' : decision === 'approve' ? 'Confirmer la validation' : 'Confirmer le refus'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminApplications;
