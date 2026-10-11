import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  Banknote, 
  CalendarDays, 
  CheckCircle2, 
  Fuel, 
  Gauge, 
  Phone, 
  RefreshCw, 
  ChevronLeft,
  ChevronRight,
  X,
  IdCard,
  Upload,
  ShieldCheck, 
  Wrench, 
  CarFront, 
  ArrowLeft,
  Settings2
} from 'lucide-react';
import api from '../api/api';
import CarDefaultImg from '../assets/car_default.webp';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Included services for leasing grid 
const includedServices = [
  { 
    title: 'Assurance Tous Risques', 
    description: 'Protection complète pour vous et votre véhicule en toutes circonstances.', 
    Icon: ShieldCheck 
  },
  { 
    title: 'Assistance Dépannage', 
    description: 'Disponible 24h/24 et 7j/7, partout en Europe pour une sérénité totale.', 
    Icon: CarFront 
  },
  { 
    title: 'Entretien & SAV', 
    description: 'Maintenance préventive et curative incluse dans votre contrat.', 
    Icon: Wrench 
  },
  { 
    title: 'Contrôle Technique', 
    description: 'Nous prenons en charge toutes les étapes réglementaires de suivi.', 
    Icon: CheckCircle2 
  },
];

const formatPrice = (price) => Number(price).toLocaleString('fr-FR', { maximumFractionDigits: 0 });

export default function VehicleDetails() {
  const { id } = useParams(); // Vehicle ID sent in the URL
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // States
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [identityDocument, setIdentityDocument] = useState(null);
  const [drivingLicense, setDrivingLicense] = useState(null);
  const [dataConsent, setDataConsent] = useState(false);
  const [applicationError, setApplicationError] = useState('');
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  // Get vehicle details and set states
  useEffect(() => {
    let active = true;
    api.get(`/vehicle_api/vehicles/${id}/`)
      .then(({ data }) => {
        if (active) {
          setVehicle(data);
          setSelectedImage(data.images?.find((image) => image.is_main)?.image_url || data.images?.[0]?.image_url || CarDefaultImg);
        }
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  // UseEffect to handle the image gallery
  useEffect(() => {
    if (!galleryOpen && !applicationOpen && !confirmSubmitOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (confirmSubmitOpen) {
          setConfirmSubmitOpen(false);
        } else {
          setGalleryOpen(false);
          setApplicationOpen(false);
        }
      }
      if (galleryOpen && event.key === 'ArrowRight') {
        setActivePhotoIndex((current) => (current + 1) % (vehicle?.images?.length || 1));
      }
      if (galleryOpen && event.key === 'ArrowLeft') {
        setActivePhotoIndex((current) => (current - 1 + (vehicle?.images?.length || 1)) % (vehicle?.images?.length || 1));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [applicationOpen, confirmSubmitOpen, galleryOpen, vehicle]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-24 text-center text-slate-600" role="status">
        Chargement du véhicule…
      </div>
    );
  }

  // If vehicle not found
  if (error || !vehicle) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Véhicule introuvable</h1>
        <p className="mt-3 text-slate-600">Ce véhicule n’est plus disponible ou n’existe pas.</p>
        <Link to="/" className="mt-6 inline-flex items-center gap-2 text-blue-600 font-medium hover:underline">
          <ArrowLeft size={18} /> Retour à l’accueil
        </Link>
      </section>
    );
  }

  // Organize vehicle details to render
  const { model, contract_type: contractType, lease_details: lease, images = [], fuel, gearbox } = vehicle;
  const isLease = contractType?.name?.toLowerCase() === 'location' || vehicle.contract_type === 'location';
  const gallery = images.map((image) => image.image_url).filter(Boolean);
  if (!gallery.length) gallery.push(CarDefaultImg);
  const shownImage = selectedImage || gallery[0];
  const title = `${model?.maker?.name || ''} ${model?.name || vehicle.model || 'Véhicule'}`.trim();

  const openApplicationForm = () => {
    if (!isAuthenticated) {
      toast('Connectez-vous pour déposer votre dossier.');
      navigate('/connexion', { state: { from: `/vehicule/${id}` } });
      return;
    }
    setApplicationError('');
    setApplicationOpen(true);
  };

  const closeApplicationForm = () => {
    if (submittingApplication) return;
    setApplicationOpen(false);
    setConfirmSubmitOpen(false);
    setApplicationError('');
    setIdentityDocument(null);
    setDrivingLicense(null);
    setDataConsent(false);
  };

  const requestApplicationConfirmation = (event) => {
    event.preventDefault();
    setApplicationError('');

    if (!identityDocument || !drivingLicense) {
      setApplicationError('Veuillez joindre votre pièce d’identité et votre permis de conduire.');
      return;
    }
    if (!dataConsent) {
      setApplicationError('Votre consentement au traitement des données est obligatoire.');
      return;
    }
    setConfirmSubmitOpen(true);
  };

  const submitConfirmedApplication = async () => {
    // Send both required files and the consent explicitly as multipart data.
    const formData = new FormData();
    formData.append('vehicle', id);
    formData.append('identity_document', identityDocument);
    formData.append('driving_license', drivingLicense);
    formData.append('data_processing_consent', 'true');

    setSubmittingApplication(true);
    try {
      await api.post('/application_api/application/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setApplicationOpen(false);
      setConfirmSubmitOpen(false);
      setIdentityDocument(null);
      setDrivingLicense(null);
      setDataConsent(false);
      toast.success('Votre dossier a bien été déposé.');
    } catch (submissionError) {
      setConfirmSubmitOpen(false);
      const responseData = submissionError.response?.data;
      const message = responseData?.detail
        || responseData?.vehicle?.[0]
        || responseData?.identity_document?.[0]
        || responseData?.driving_license?.[0]
        || responseData?.data_processing_consent?.[0]
        || responseData?.non_field_errors?.[0];
      setApplicationError(message || 'Le dépôt du dossier a échoué. Veuillez réessayer.');
    } finally {
      setSubmittingApplication(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-16">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Upper Details Section */}
        <div className="grid items-start gap-8 lg:grid-cols-3">
          
          {/* Left Column: Image Gallery */}
          <section aria-label="Galerie photos" className="min-w-0 lg:col-span-2">
            <div className="aspect-video w-full overflow-hidden rounded-2xl bg-slate-200 shadow-sm">
              <img src={shownImage} alt={title} className="h-full w-full object-cover" />
            </div>

            {/* Thumbnails grid */}
            <div className="mt-4 grid grid-cols-4 gap-3">
              {gallery.slice(0, 4).map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  onClick={() => {
                    if (index === 3 && gallery.length > 4) {
                      setActivePhotoIndex(index);
                      setGalleryOpen(true);
                    } else {
                      setSelectedImage(image);
                    }
                  }}
                  aria-label={index === 3 && gallery.length > 4 ? `Voir les ${gallery.length} photos` : `Afficher la photo ${index + 1}`}
                  className={`relative h-20 sm:h-24 w-full overflow-hidden rounded-xl border-2 transition-all ${
                    shownImage === image ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-transparent opacity-90 hover:opacity-100'
                  }`}
                >
                  <img src={image} alt={`${title}, photo ${index + 1}`} className="h-full w-full object-cover" />
                  
                  {/* Open the full photo gallery from the remaining photos counter. */}
                  {index === 3 && gallery.length > 4 && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs sm:text-sm font-bold text-white backdrop-blur-[1px]">
                      +{gallery.length - 3} Photos
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Right Column: Vehicle Information Card */}
          <aside className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-slate-100">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl leading-tight">
              {title}
            </h1>

            {/* Price section */}
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-blue-600 tracking-tight">
                {formatPrice(vehicle.price)} €
              </span>
              {isLease && <span className="text-sm font-medium text-slate-500">/ mois</span>}
            </div>

            {isLease && (
              <p className="mt-1 text-xs font-semibold text-emerald-600">
                Sans apport initial
              </p>
            )}

            {/* Specifications Grid */}
            <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-slate-100 pt-6 text-sm">
              <div className="flex items-start gap-2.5">
                <Gauge size={18} className="mt-0.5 shrink-0 text-slate-500" />
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">KILOMÈTRES</dt>
                  <dd className="font-semibold text-slate-800">{Number(vehicle.kilometres || vehicle.mileage).toLocaleString('fr-FR')} Km</dd>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CalendarDays size={18} className="mt-0.5 shrink-0 text-slate-500" />
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ANNÉE</dt>
                  <dd className="font-semibold text-slate-800">{model?.year || vehicle.year}</dd>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Fuel size={18} className="mt-0.5 shrink-0 text-slate-500" />
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ÉNERGIE</dt>
                  <dd className="font-semibold text-slate-800 capitalize">{fuel?.name || vehicle.fuel_type}</dd>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Settings2 size={18} className="mt-0.5 shrink-0 text-slate-500" />
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">BOÎTE</dt>
                  <dd className="font-semibold text-slate-800 capitalize">{gearbox?.name || vehicle.transmission}</dd>
                </div>
              </div>
            </dl>

            {/* Lease Contract Details */}
            {isLease && (
              <dl className="mt-6 divide-y divide-slate-100 border-t border-slate-100 text-sm text-slate-600">
                <div className="flex justify-between py-3">
                  <dt>Engagement</dt>
                  <dd className="font-semibold text-slate-900">{lease?.commitment_time || vehicle.lease_duration_months} mois</dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt>Kilométrage annuel</dt>
                  <dd className="font-semibold text-slate-900">
                    {Number(lease?.kilometres_per_year || vehicle.annual_included_mileage).toLocaleString('fr-FR')} km/an
                  </dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt>Option d'achat finale</dt>
                  <dd className="font-semibold text-slate-900">
                    {formatPrice(lease?.final_purchase_price || vehicle.final_purchase_price)} €
                  </dd>
                </div>
              </dl>
            )}

            {/* Main Action Button */}
            <button
              type="button"
              onClick={openApplicationForm}
              className="mt-8 flex w-full items-center justify-center rounded-xl bg-blue-600 py-3.5 px-4 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Déposer un dossier
            </button>
          </aside>
        </div>

        {/* Image Gallery */}
        {galleryOpen && gallery.length > 4 && (
          <div
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label={`Galerie photos ${title}`}
            onClick={() => {
              setSelectedImage(gallery[activePhotoIndex]);
              setGalleryOpen(false);
            }}
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setSelectedImage(gallery[activePhotoIndex]);
                setGalleryOpen(false);
              }}
              className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              aria-label="Fermer la galerie"
            >
              <X size={24} />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setActivePhotoIndex((activePhotoIndex - 1 + gallery.length) % gallery.length);
              }}
              className="absolute left-3 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:left-8"
              aria-label="Photo précédente"
            >
              <ChevronLeft size={30} />
            </button>
            <figure className="flex max-h-full max-w-6xl flex-col items-center" onClick={(event) => event.stopPropagation()}>
              <img src={gallery[activePhotoIndex]} alt={`${title}, photo ${activePhotoIndex + 1}`} className="max-h-[75vh] max-w-full rounded-lg object-contain" />
              <figcaption className="mt-4 text-sm font-medium text-white">Photo {activePhotoIndex + 1} / {gallery.length}</figcaption>
              <div className="mt-4 flex max-w-full gap-2 overflow-x-auto pb-1">
                {gallery.map((image, index) => (
                  <button
                    type="button"
                    key={`${image}-${index}`}
                    onClick={() => setActivePhotoIndex(index)}
                    className={`h-14 w-20 shrink-0 overflow-hidden rounded border-2 ${activePhotoIndex === index ? 'border-blue-400' : 'border-transparent opacity-70'}`}
                    aria-label={`Afficher la photo ${index + 1}`}
                    aria-current={activePhotoIndex === index ? 'true' : undefined}
                  >
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </figure>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setActivePhotoIndex((activePhotoIndex + 1) % gallery.length);
              }}
              className="absolute right-3 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:right-8"
              aria-label="Photo suivante"
            >
              <ChevronRight size={30} />
            </button>
          </div>
        )}

        {/* Included Services Section */}
        {isLease && (
          <section className="mt-14">
            <h2 className="mb-6 text-2xl font-bold text-slate-900 tracking-tight">
              Services Inclus
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {includedServices.map(({ title: serviceTitle, description, Icon }) => (
                <article key={serviceTitle} className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                  <Icon className="mb-4 text-blue-600" size={26} />
                  <h3 className="font-bold text-slate-900 text-base">{serviceTitle}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">{description}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Financing and Trade-in Cards */}
        <section className="mt-12 grid gap-6 md:grid-cols-2">
          
          {/* Financing */}
          <article className="relative overflow-hidden rounded-2xl bg-white p-8 text-center shadow-sm border border-slate-100">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
            <h2 className="flex items-center justify-center gap-2 text-xl font-bold text-slate-900">
              <Banknote className="text-blue-600" size={22} />
              Solutions de Financement
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-slate-500 max-w-md mx-auto">
              M-Motors propose des solutions flexibles adaptées à votre budget, en partenariat avec des organismes financiers reconnus. Contactez un conseiller pour une étude personnalisée.
            </p>
          </article>

          {/* Trade-in */}
          <article className="relative overflow-hidden rounded-2xl bg-white p-8 text-center shadow-sm border border-slate-100">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
            <h2 className="flex items-center justify-center gap-2 text-xl font-bold text-slate-900">
              <RefreshCw className="text-blue-600" size={22} />
              Reprise
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-slate-500 max-w-md mx-auto">
              Reprise de votre ancien véhicule : Facilitez votre achat en nous confiant votre ancienne voiture pour une estimation immédiate.
            </p>
          </article>
        </section>

        {/* Test Drive Box */}
        <section className="mt-12 flex flex-col justify-between gap-6 rounded-2xl bg-[#3b4351] px-8 py-8 text-white sm:flex-row sm:items-center sm:px-10 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Envie d'essayer ce véhicule ?</h2>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-300">
              Nos conseillers sont disponibles pour organiser une séance de conduite exclusive dans notre Galerie Cinétique.
            </p>
          </div>
          <div
            className="inline-flex shrink-0 items-center justify-center gap-2.5 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-100"
          >
            <Phone size={16} /> +1 (800) M-MOTORS
          </div>
        </section>

        {applicationOpen && (
          <div
            className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm sm:p-8"
            role="presentation"
            onClick={closeApplicationForm}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="application-dialog-title"
              aria-describedby="application-dialog-description"
              className="relative my-auto w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl sm:p-10"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeApplicationForm}
                disabled={submittingApplication}
                aria-label="Fermer le formulaire"
                className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={22} />
              </button>
              <h2 id="application-dialog-title" className="pr-8 text-2xl font-bold text-slate-800 sm:text-3xl">Constitution de votre dossier</h2>
              <p id="application-dialog-description" className="mt-3 text-sm text-slate-600 sm:text-base">
                Veuillez joindre les documents nécessaires pour votre demande d'achat ou de location.
              </p>

              <form onSubmit={requestApplicationConfirmation} className="mt-7">
                <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                  <label className="relative flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-100 px-5 py-6 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(event) => setIdentityDocument(event.target.files?.[0] || null)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      aria-label="Ajouter une pièce d’identité"
                    />
                    <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm"><IdCard size={25} /></span>
                    <span className="font-semibold text-slate-800">Pièce d’identité</span>
                    <span className="text-sm text-slate-600">En cours de validité · Recto/Verso</span>
                    <span className="mt-5 text-sm text-slate-500">JPG, PNG, PDF · 10 Mo maximum</span>
                    <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-600"><Upload size={15} />{identityDocument?.name || 'Parcourir les fichiers'}</span>
                  </label>

                  <label className="relative flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-100 px-5 py-6 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(event) => setDrivingLicense(event.target.files?.[0] || null)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      aria-label="Ajouter le permis de conduire"
                    />
                    <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm"><CheckCircle2 size={25} /></span>
                    <span className="font-semibold text-slate-800">Permis de conduire</span>
                    <span className="mt-1 text-sm text-slate-600">Document en cours de validité</span>
                    <span className="mt-5 text-sm text-slate-500">JPG, PNG, PDF · 10 Mo maximum</span>
                    <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-600"><Upload size={15} />{drivingLicense?.name || 'Parcourir les fichiers'}</span>
                  </label>
                </div>

                <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700 sm:p-5">
                  <input
                    type="checkbox"
                    checked={dataConsent}
                    onChange={(event) => setDataConsent(event.target.checked)}
                    className="mt-1 h-5 w-5 shrink-0 accent-blue-600"
                  />
                  <span>J'accepte le traitement de mes données personnelles dans le cadre de l'étude de mon dossier (Conformité RGPD).</span>
                </label>

                {applicationError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{applicationError}</p>}

                <div className="mt-7 flex flex-col-reverse justify-end gap-3 sm:flex-row sm:gap-4">
                  <button type="button" onClick={closeApplicationForm} disabled={submittingApplication} className="rounded-lg bg-red-100 px-7 py-3.5 text-sm font-semibold text-red-700 transition hover:bg-red-200 disabled:opacity-50">Annuler</button>
                  <button type="submit" disabled={submittingApplication} className="rounded-lg bg-blue-700 px-7 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60">
                    {submittingApplication ? 'Envoi en cours…' : 'Valider le dépôt'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {confirmSubmitOpen && applicationOpen && (
          <div
            className="fixed inset-0 z-110 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm sm:p-6"
            role="presentation"
            onClick={() => !submittingApplication && setConfirmSubmitOpen(false)}
          >
            <section
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-application-title"
              aria-describedby="confirm-application-description"
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                <ShieldCheck size={28} />
              </div>
              <h2 id="confirm-application-title" className="mt-4 text-center text-xl font-bold text-slate-900 sm:text-2xl">Confirmer votre dépôt</h2>
              <p id="confirm-application-description" className="mt-2 text-center text-sm leading-relaxed text-slate-600">
                Vous allez transmettre votre dossier pour le véhicule <span className="font-semibold text-slate-800">{title}</span>. Vérifiez les documents avant de confirmer.
              </p>
              <div className="mt-5 space-y-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="flex items-center gap-2"><IdCard size={17} className="shrink-0 text-blue-600" /><span className="truncate">{identityDocument?.name}</span></p>
                <p className="flex items-center gap-2"><CheckCircle2 size={17} className="shrink-0 text-blue-600" /><span className="truncate">{drivingLicense?.name}</span></p>
                <p className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-500">Votre consentement au traitement des données est enregistré avec le dossier.</p>
              </div>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmSubmitOpen(false)}
                  disabled={submittingApplication}
                  className="rounded-lg bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
                >
                  Retour aux documents
                </button>
                <button
                  type="button"
                  onClick={submitConfirmedApplication}
                  disabled={submittingApplication}
                  className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60"
                >
                  {submittingApplication ? 'Envoi en cours…' : 'Confirmer le dépôt'}
                </button>
              </div>
            </section>
          </div>
        )}

      </main>
    </div>
  );
}
