/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, Check, CheckCircle2, ChevronLeft, Download, FileBadge, Flag, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/api';
import carDefault from '../assets/car_default.webp';

const formatDate = (value, includeTime = false) => {
  if (!value) return 'Date indisponible';
  return new Intl.DateTimeFormat('fr-FR', includeTime
    ? { dateStyle: 'long', timeStyle: 'short' }
    : { dateStyle: 'long' }).format(new Date(value));
};

const vehicleName = (vehicle) =>
  [vehicle?.model?.maker?.name, vehicle?.model?.name].filter(Boolean).join(' ') || 'Véhicule';

const documentLabel = (type) => type === 'identity' ? 'Pièce d’identité' : 'Permis de conduire';

const getDocumentFilename = (headers, document) => {
  const disposition = headers['content-disposition'] || '';
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) return decodeURIComponent(encoded);
  const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1];
  if (filename) return filename;
  const base = document.document_type === 'identity' ? 'piece-identite' : 'permis-de-conduire';
  return `${base}${document.file_extension || ''}`;
};

export default function ApplicationTracking() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get(`/application_api/application/${id}/`)
      .then(({ data }) => { if (active) setApplication(data); })
      .catch((error) => toast.error(error.response?.data?.detail || 'Impossible de charger le suivi du dossier.'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const downloadDocument = async (document) => {
    setDownloadingId(document.id);
    try {
      const { data, headers } = await api.get(
        `/application_api/application/${id}/documents/${document.id}/content/?download=true`,
        { responseType: 'blob' },
      );
      const objectUrl = URL.createObjectURL(data);
      const link = window.document.createElement('a');
      link.href = objectUrl;
      link.download = getDocumentFilename(headers, document);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Impossible de télécharger ce document.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) return <div className="min-h-[60vh] bg-slate-50 px-4 py-16 text-center text-slate-500">Chargement du dossier…</div>;
  if (!application) return (
    <div className="min-h-[60vh] bg-slate-50 px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-slate-800">Dossier introuvable</h1>
      <Link to="/espace-personnel" className="mt-4 inline-block text-blue-700 underline">Retour à mes dossiers</Link>
    </div>
  );

  const statusName = application.status?.name || 'Déposé';
  const normalizedStatus = statusName.toLowerCase();
  const rejected = normalizedStatus === 'refusé';
  const approved = normalizedStatus === 'validé';
  const finalDecision = rejected || approved;
  const image = application.vehicle?.images?.find((item) => item.is_main)?.image_url || application.vehicle?.images?.[0]?.image_url || carDefault;
  const documents = application.documents || [];
  const trackingId = `MM-${new Date(application.created_at).getFullYear()}-${String(application.id).padStart(3, '0')}`;
  const steps = [
    { title: 'Dossier déposé', icon: Check, complete: true },
    { title: "En cours d’étude", icon: Search, complete: finalDecision, current: !finalDecision },
    { title: 'Décision finale', icon: Flag, complete: finalDecision, current: finalDecision },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <Link to="/espace-personnel" className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline">
          <ChevronLeft className="h-4 w-4" /> Retour à mes dossiers
        </Link>

        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl">Suivi du Dossier #{trackingId}</h1>
            <p className="mt-2 text-slate-600">Dernière mise à jour : {formatDate(application.updated_at || application.created_at)}</p>
          </div>
          <span className={`w-fit rounded-lg border px-5 py-2 text-xl font-semibold ${rejected ? 'border-red-300 bg-red-50 text-red-700' : approved ? 'border-green-300 bg-green-50 text-green-700' : 'border-orange-300 bg-orange-50 text-orange-700'}`}>
            {rejected ? 'Refusé' : approved ? 'Validé' : 'En attente'}
          </span>
        </header>

        <section aria-label="Étapes du dossier" className="relative grid grid-cols-3 gap-2 px-2 py-6 sm:px-10">
          <div className="absolute left-[17%] right-[17%] top-9 h-0.5 bg-blue-600" />
          {steps.map(({ title, icon: Icon, complete, current }, index) => (
            <div key={title} className="relative flex flex-col items-center gap-3 text-center">
              <span className={`z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 ${complete ? (rejected && index === 2 ? 'border-red-100 bg-red-600 text-white' : 'border-blue-100 bg-blue-600 text-white') : current ? 'border-blue-100 bg-white text-blue-600' : 'border-slate-200 bg-white text-slate-400'}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className={`text-sm font-medium sm:text-base ${current ? 'text-blue-700' : 'text-slate-700'}`}>{title}</span>
            </div>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
          <div className="space-y-6">
            {rejected && application.reject_justification && (
              <section role="alert" className="flex gap-4 rounded-2xl border-l-4 border-red-600 bg-red-50 p-5 text-red-800">
                <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0" />
                <p><strong>Motif du refus :</strong> {application.reject_justification}</p>
              </section>
            )}

            <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-slate-800">Mes documents</h2>
                <span className="text-sm font-medium text-blue-600">{documents.length} {documents.length === 1 ? 'FICHIER' : 'FICHIERS'}</span>
              </div>
              {documents.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {documents.map((document) => (
                    <button
                      key={document.id}
                      type="button"
                      onClick={() => downloadDocument(document)}
                      disabled={downloadingId === document.id}
                      className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50 disabled:opacity-60"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm"><FileBadge className="h-6 w-6" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-slate-800">{documentLabel(document.document_type)}</span>
                        <span className="block truncate text-xs uppercase text-slate-500">{(document.file_extension || 'document').replace('.', '')}</span>
                      </span>
                      {downloadingId === document.id ? <span className="text-xs text-slate-500">Téléchargement…</span> : <Download className="h-5 w-5 shrink-0 text-blue-600" />}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl bg-slate-50 p-5 text-slate-600">Aucun document n’est associé à ce dossier.</p>
              )}
            </section>
          </div>

          <aside className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="relative">
              <img src={image} alt={vehicleName(application.vehicle)} className="h-56 w-full object-cover" />
              <span className="absolute bottom-3 left-4 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">Véhicule sélectionné</span>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">{vehicleName(application.vehicle)}</h2>
                <p className="text-slate-600">Modèle {application.vehicle?.model?.year || ''}</p>
              </div>
              <div className="space-y-3 border-t border-slate-100 pt-4 text-sm">
                <div className="flex justify-between gap-3"><span className="font-medium uppercase text-slate-700">{getContractLabel(application.vehicle)}{application.vehicle?.contract_type?.name?.toLowerCase() === 'location' ? ' mensuel' : ''}</span><span className="text-right text-slate-700">{application.vehicle?.price} €{application.vehicle?.contract_type?.name?.toLowerCase() === 'location' ? ' /mois' : ''}</span></div>
                {application.vehicle?.lease_details?.commitment_time && <div className="flex justify-between gap-3"><span className="font-medium uppercase text-slate-700">Durée</span><span className="text-slate-700">{application.vehicle.lease_details.commitment_time} mois</span></div>}
              </div>
              <Link to={`/vehicule/${application.vehicle?.id}`} className="inline-flex items-center gap-2 font-semibold text-blue-700 hover:underline">
                Voir le véhicule <CheckCircle2 className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}


function getContractLabel(vehicle) {
  return vehicle?.contract_type?.name?.toLowerCase() === 'location' ? 'Loyer' : 'Prix';
}
