import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
  ShieldCheck, 
  Wrench, 
  CarFront, 
  ArrowLeft,
  Settings2
} from 'lucide-react';
import api from '../api/api';
import CarDefaultImg from '../assets/car_default.webp';

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

  // States
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

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
    if (!galleryOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setGalleryOpen(false);
      if (event.key === 'ArrowRight') {
        setActivePhotoIndex((current) => (current + 1) % (vehicle?.images?.length || 1));
      }
      if (event.key === 'ArrowLeft') {
        setActivePhotoIndex((current) => (current - 1 + (vehicle?.images?.length || 1)) % (vehicle?.images?.length || 1));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [galleryOpen, vehicle]);

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
            <Link
              to="/connexion"
              className="mt-8 flex w-full items-center justify-center rounded-xl bg-blue-600 py-3.5 px-4 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Déposer un dossier
            </Link>
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

      </main>
    </div>
  );
}
