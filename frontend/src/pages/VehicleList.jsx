/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Filter, RotateCcw, SlidersHorizontal } from 'lucide-react';
import api from '../api/api';
import CarDefaultImg from '../assets/car_default.webp';

const PAGE_SIZE = 6;
const PRICE_LIMIT = 500000;

const initialFilters = {
  maker: '',
  min_price: 0,
  max_price: PRICE_LIMIT,
  max_kilometres: '',
  year: '',
  fuel: '',
  gearbox: '',
  types: [],
};

const getList = (data) => data?.results || data || [];
const formatPrice = (price) => Number(price).toLocaleString('fr-FR', { maximumFractionDigits: 0 });

// Function to manage filter section
function FilterFields({ filters, setFilters, options }) {
  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const toggleType = (type) => update('types', filters.types.includes(type)
    ? filters.types.filter((selected) => selected !== type)
    : [...filters.types, type]);

  return (
    <div className="grid gap-5 lg:grid-cols-4 lg:gap-8">
      {/* Maker and year */}
      <fieldset className="space-y-3">
        <legend className="mb-3 text-sm font-bold uppercase text-slate-700">Détails du véhicule</legend>
        <label className="sr-only" htmlFor="catalog-maker">Sélectionner une marque</label>
        <select id="catalog-maker" value={filters.maker} onChange={(event) => update('maker', event.target.value)} className="w-full rounded-lg border-0 bg-white px-3 py-3 text-sm text-slate-600 focus:ring-2 focus:ring-blue-500">
          <option value="">Sélectionner une marque</option>
          {options.makers.map((maker) => <option key={maker.id} value={maker.id}>{maker.name}</option>)}
        </select>
        <label className="sr-only" htmlFor="catalog-year">Année du modèle</label>
        <select id="catalog-year" value={filters.year} onChange={(event) => update('year', event.target.value)} className="w-full rounded-lg border-0 bg-white px-3 py-3 text-sm text-slate-600 focus:ring-2 focus:ring-blue-500">
          <option value="">Année du modèle</option>
          {options.years.map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
      </fieldset>

      {/* Price and kilometers */}
      <fieldset className="space-y-3">
        <legend className="mb-3 text-sm font-bold uppercase text-slate-700">Budget</legend>
        <div className="flex items-center justify-between text-xs text-slate-500"><label htmlFor="catalog-min-price">Prix min.</label><span>{formatPrice(filters.min_price)} €</span></div>
        <input id="catalog-min-price" type="range" min="0" max={PRICE_LIMIT} step="1000" value={filters.min_price} onChange={(event) => update('min_price', Math.min(Number(event.target.value), Number(filters.max_price)))} className="w-full accent-blue-600" />
        <div className="flex items-center justify-between text-xs text-slate-500"><label htmlFor="catalog-max-price">Prix max.</label><span>{formatPrice(filters.max_price)} €</span></div>
        <input id="catalog-max-price" type="range" min="0" max={PRICE_LIMIT} step="1000" value={filters.max_price} onChange={(event) => update('max_price', Math.max(Number(event.target.value), Number(filters.min_price)))} className="w-full accent-blue-600" />
        <label className="sr-only" htmlFor="catalog-kilometres">Kilométrage maximum</label>
        <input id="catalog-kilometres" type="number" min="0" placeholder="Kilométrage maximum" value={filters.max_kilometres} onChange={(event) => update('max_kilometres', event.target.value)} className="w-full rounded-lg border-0 bg-white px-3 py-3 text-sm placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500" />
      </fieldset>

      {/* Fuel and gearbox */}
      <fieldset className="space-y-3">
        <legend className="mb-3 text-sm font-bold uppercase text-slate-700">Motorisation & boîte</legend>
        <label className="sr-only" htmlFor="catalog-fuel">Énergie</label>
        <select id="catalog-fuel" value={filters.fuel} onChange={(event) => update('fuel', event.target.value)} className="w-full rounded-lg border-0 bg-white px-3 py-3 text-sm text-slate-600 focus:ring-2 focus:ring-blue-500">
          <option value="">Énergie</option>
          {options.fuels.map((fuel) => <option key={fuel.id} value={fuel.id}>{fuel.name}</option>)}
        </select>
        <label className="sr-only" htmlFor="catalog-gearbox">Boîte de vitesses</label>
        <select id="catalog-gearbox" value={filters.gearbox} onChange={(event) => update('gearbox', event.target.value)} className="w-full rounded-lg border-0 bg-white px-3 py-3 text-sm text-slate-600 focus:ring-2 focus:ring-blue-500">
          <option value="">Boîte de vitesses</option>
          {options.gearboxes.map((gearbox) => <option key={gearbox.id} value={gearbox.id}>{gearbox.name}</option>)}
        </select>
      </fieldset>

      {/* Contract type */}
      <fieldset>
        <legend className="mb-3 text-sm font-bold uppercase text-slate-700">Type de contrat</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={filters.types.includes('achat')} onChange={() => toggleType('achat')} className="h-4 w-4 accent-blue-600" />Achat</label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={filters.types.includes('location')} onChange={() => toggleType('location')} className="h-4 w-4 accent-blue-600" />Location</label>
        </div>
      </fieldset>
    </div>
  );
}

export default function VehicleListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryType = searchParams.get('type');

  // States
  const [filters, setFilters] = useState(() => ({
    ...initialFilters,
    types: queryType === 'achat' || queryType === 'location' ? [queryType] : [],
  }));
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [options, setOptions] = useState({ makers: [], fuels: [], gearboxes: [], contracts: [], years: [] });
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [ordering, setOrdering] = useState('-price');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Get all the makers, fuels, gearboxes and contract types
  useEffect(() => {
    let active = true;
    Promise.all([
      api.get('/vehicle_api/makers/'),
      api.get('/vehicle_api/fuels/'),
      api.get('/vehicle_api/gearboxes/'),
      api.get('/vehicle_api/contractType/'),
    ]).then(([makers, fuels, gearboxes, contracts]) => {
      if (!active) return;
      const availableYears = Array.from({ length: 50 }, (_, index) => new Date().getFullYear() - index);
      setOptions({ makers: getList(makers.data), fuels: getList(fuels.data), gearboxes: getList(gearboxes.data), contracts: getList(contracts.data), years: availableYears });
      setOptionsLoaded(true);
    }).catch(() => {
      if (active) {
        setError(true);
        setOptionsLoaded(true);
      }
    });
    return () => { active = false; };
  }, []);

  // Get all the vehicles passing the filter params 
  const fetchVehicles = useCallback(async () => {
    if (!optionsLoaded) return;
    setLoading(true);
    setError(false);
    const contractIds = appliedFilters.types.map((type) => options.contracts.find((contract) => contract.name.toLowerCase() === (type === 'achat' ? 'vente' : 'location'))?.id).filter(Boolean);
    const params = {
      page,
      ordering,
      maker: appliedFilters.maker || undefined,
      min_price: appliedFilters.min_price > 0 ? appliedFilters.min_price : undefined,
      max_price: appliedFilters.max_price < PRICE_LIMIT ? appliedFilters.max_price : undefined,
      max_kilometres: appliedFilters.max_kilometres || undefined,
      year: appliedFilters.year || undefined,
      fuel: appliedFilters.fuel || undefined,
      gearbox: appliedFilters.gearbox || undefined,
      contract_type: contractIds.length ? contractIds.join(',') : undefined,
    };
    try {
      const { data } = await api.get('/vehicle_api/catalog/vehicles/', { params });
      setVehicles(getList(data));
      setCount(data.count ?? getList(data).length);
    } catch {
      setError(true);
      setVehicles([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, options.contracts, optionsLoaded, ordering, page]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  // Paginatio data
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const visiblePages = useMemo(() => Array.from({ length: totalPages }, (_, index) => index + 1).filter((number) => number === 1 || number === totalPages || Math.abs(number - page) <= 1), [page, totalPages]);

  const applyFilters = () => {
    setAppliedFilters(filters);
    setPage(1);
    setMobileFiltersOpen(false);
    setSearchParams(filters.types.length === 1 ? { type: filters.types[0] } : {});
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setPage(1);
    setOrdering('-price');
    setSearchParams({});
  };

  return (
    <main className="min-h-screen bg-[#f7f9fc] pb-16 text-slate-800">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
        <header className="mb-6 sm:mb-7">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Notre Collection</h1>
          <p className="mt-3 hidden max-w-3xl text-sm leading-snug text-slate-600 sm:block sm:text-base">Découvrez une sélection rigoureuse de véhicules d’occasion certifiés.<br />L'excellence et la fiabilité M-Motors, au service des passionnés les plus exigeants.</p>
        </header>

        <div className="mb-4 flex items-center justify-between sm:hidden">
          <span className="text-sm text-slate-600">{count} véhicules disponibles</span>
          <button type="button" onClick={() => setMobileFiltersOpen((open) => !open)} className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white"><SlidersHorizontal size={16} />Filtrer</button>
        </div>

        <section className={`${mobileFiltersOpen ? 'block' : 'hidden'} mb-12 rounded-xl bg-slate-200/70 p-5 sm:block sm:p-6`} aria-label="Filtres de recherche">
          <FilterFields filters={filters} setFilters={setFilters} options={options} />
          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={resetFilters} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-slate-800"><RotateCcw size={15} />Réinitialiser</button>
            <button type="button" onClick={applyFilters} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-7 py-3 text-sm font-semibold text-white shadow hover:bg-blue-800"><Filter size={15} />Appliquer</button>
          </div>
        </section>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-7">
          <h2 className="text-base font-bold text-slate-700 sm:text-lg">{count} véhicules disponibles</h2>
          <label className="flex items-center gap-2 text-xs text-slate-600 sm:text-sm">Trier par :
            <select value={ordering} onChange={(event) => { setOrdering(event.target.value); setPage(1); }} className="cursor-pointer bg-transparent font-semibold text-slate-700 focus:outline-none">
              <option value="-price">Prix (Décroissant)</option>
              <option value="price">Prix (Croissant)</option>
            </select>
          </label>
        </div>

        {error ? <div className="rounded-xl bg-white p-10 text-center text-slate-600">Impossible de charger les véhicules. Vérifiez votre connexion puis réessayez.</div> : loading ? <div className="rounded-xl bg-white p-10 text-center text-slate-600" role="status">Chargement des véhicules…</div> : vehicles.length === 0 ? (
          <div className="rounded-xl bg-white px-6 py-14 text-center shadow-sm">
            <h3 className="text-lg font-bold text-slate-800">Aucun véhicule ne correspond à vos critères.</h3>
            <p className="mt-2 text-sm text-slate-500">Modifiez ou réinitialisez les filtres pour voir d’autres véhicules disponibles.</p>
            <button type="button" onClick={resetFilters} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"><RotateCcw size={15} />Réinitialiser les filtres</button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {vehicles.map((vehicle) => {
              const photo = vehicle.images?.find((image) => image.is_main)?.image_url || vehicle.images?.[0]?.image_url || CarDefaultImg;
              const isLease = vehicle.contract_type?.name?.toLowerCase() === 'location';
              return (
                <article key={vehicle.id} className="overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md">
                  <img src={photo} alt={`${vehicle.model?.maker?.name} ${vehicle.model?.name}`} className="aspect-5/1 w-full object-cover sm:aspect-[1.56/1]" />
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div><p className="text-xs font-medium text-slate-500">{vehicle.model?.maker?.name}</p><h3 className="font-bold leading-tight text-slate-900">{vehicle.model?.name}</h3></div>
                      <p className="shrink-0 font-extrabold text-blue-600">{formatPrice(vehicle.price)} €{isLease && <span className="text-xs font-normal"> / mois</span>}</p>
                    </div>
                    <p className="text-sm text-slate-500">{vehicle.model?.year} • {Number(vehicle.kilometres).toLocaleString('fr-FR')} Kilomètres</p>
                    <button type="button" onClick={() => navigate(`/vehicule/${vehicle.id}`)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">Voir le détail <ArrowRight size={16} /></button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && !error && totalPages > 1 && <nav aria-label="Pagination des véhicules" className="mt-12 flex items-center justify-center gap-2">
          <button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)} aria-label="Page précédente" className="rounded-full border border-slate-200 p-2 text-slate-600 disabled:opacity-40"><ArrowLeft size={17} />
          </button>
          {visiblePages.map((number, index) =>
            <span key={number} className="contents">{index > 0 && number - visiblePages[index - 1] > 1 && <span className="px-1 text-slate-500">…</span>}
              <button type="button" onClick={() => setPage(number)} aria-current={page === number ? 'page' : undefined} className={`h-10 w-10 rounded-full text-sm font-semibold ${page === number ? 'bg-blue-700 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'}`}>{number}
              </button>
            </span>)}
          <button type="button" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)} aria-label="Page suivante" className="rounded-full border border-slate-200 p-2 text-slate-600 disabled:opacity-40"><ArrowRight size={17} />
          </button>
        </nav>}
      </div>
    </main>
  );
}
