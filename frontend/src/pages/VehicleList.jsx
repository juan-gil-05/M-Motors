/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Eye, 
  Pencil, 
  Trash2, 
  AlertTriangle 
} from 'lucide-react';
import api from '../api/api';
import CarDefaultImg from "../assets/car_default.webp"
import toast from 'react-hot-toast'


const VehicleListPage = () => {
  const navigate = useNavigate();

  // Data and Loading states
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalEntries, setTotalEntries] = useState(0);

  // Filter and Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState(''); // 'vente', 'location' or ''
  const [selectedStatus, setSelectedStatus] = useState(''); // 'disponible', 'vendue', 'louee' or ''
  const [ordering, setOrdering] = useState(''); // 'price', '-price' or ''

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Deletion modal states
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Fetch vehicles list from backend API with active filters, ordering, and pagination
   */
  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        search: searchQuery,
        contract_type: selectedType,
        status: selectedStatus,
        ordering: ordering,
      };

      const response = await api.get('/vehicle_api/vehicles/', { params });
      
      setVehicles(response.data.results || response.data);
      setTotalEntries(response.data.count || response.data.length);
      setTotalPages(Math.ceil((response.data.count || response.data.length) / pageSize));
    } catch (error) {
      console.error('Error fetching vehicles list:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, selectedType, selectedStatus, ordering]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  /**
   * Toggle sort order by price (ascending / descending)
   */
  const handlePriceSort = () => {
    if (ordering === 'price') {
      setOrdering('-price');
    } else if (ordering === '-price') {
      setOrdering('');
    } else {
      setOrdering('price');
    }
    setCurrentPage(1);
  };

  /**
   * Confirm and execute vehicle deletion
   */
  const handleDeleteConfirm = async () => {
    if (!vehicleToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/vehicle_api/vehicles/${vehicleToDelete.id}/`);
      setVehicleToDelete(null);
      fetchVehicles();
      // Display success message
      toast.success('Le véhicule a été supprimé avec succès.')
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Render status badge
   */
  const renderStatusBadge = (status) => {
    switch (status.name?.toLowerCase()) {
      case 'disponible':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 uppercase tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Disponible
          </span>
        );
      case 'louee':
      case 'loué':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 uppercase tracking-wide">
            <span className="w-2 h-2 rounded-full bg-slate-800"></span>
            Louée
          </span>
        );
      case 'vendue':
      case 'vendu':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 uppercase tracking-wide">
            <span className="w-2 h-2 rounded-full bg-slate-800"></span>
            Vendue
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{status}</span>;
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Search Bar & Add Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Chercher par marque, ou modèle."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 shadow-sm focus:outline-none focus:border-blue-600"
            />
          </div>

          <button
            onClick={() => navigate('/nouveau-vehicule')}
            className="w-full sm:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Ajouter un véhicule
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-6"> 
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtrer par :</span>
          </div>

          {/* Filter Group: TYPE */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 uppercase">TYPE :</span>
            <button
              onClick={() => {
                setSelectedType(selectedType === 'vente' ? '' : '1');
                setCurrentPage(1);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedType === '1'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Vente
            </button>
            <button
              onClick={() => {
                setSelectedType(selectedType === 'location' ? '' : '2');
                setCurrentPage(1);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedType === '2'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Location
            </button>
          </div>

          {/* Filter Group: STATUT */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 uppercase">STATUT :</span>
            <button
              onClick={() => {
                setSelectedStatus(selectedStatus === 'disponible' ? '' : '1');
                setCurrentPage(1);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedStatus === '1'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Disponible
            </button>
            <button
              onClick={() => {
                setSelectedStatus(selectedStatus === 'vendue' ? '' : '2');
                setCurrentPage(1);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedStatus === '2'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Vendue
            </button>
            <button
              onClick={() => {
                setSelectedStatus(selectedStatus === 'louee' ? '' : '3');
                setCurrentPage(1);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedStatus === '3'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Louée
            </button>
          </div>
        </div>

        {/* Vehicles Table Data */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-4 px-6 w-16">ID</th>
                  <th className="py-4 px-6">VÉHICULE</th>
                  <th className="py-4 px-6">TYPE</th>
                  <th className="py-4 px-6">
                    <button
                      onClick={handlePriceSort}
                      className="flex items-center gap-1 hover:text-slate-900 font-bold"
                    >
                      PRIX
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </th>
                  <th className="py-4 px-6">STATUT</th>
                  <th className="py-4 px-6 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">
                      Chargement des véhicules...
                    </td>
                  </tr>
                ) : vehicles.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">
                      Aucun véhicule ne correspond aux critères de recherche.
                    </td>
                  </tr>
                ) : (
                  vehicles.map((vehicle) => {
                    const coverPhoto =
                      vehicle.images?.find((p) => p.is_main)?.image_url ||
                      vehicle.images?.[0]?.image_url ||
                      CarDefaultImg;

                    return (
                      <tr key={vehicle.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 font-medium text-slate-500">{vehicle.id}</td>
                        <td className="py-4 px-6">
                          <div
                            onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                            className="flex items-center gap-4 cursor-pointer group"
                          >
                            <img
                              src={coverPhoto}
                              alt={`Marque: ${vehicle.model.maker.name} - modèle: ${vehicle.model.name}`}
                              className="w-20 h-12 object-cover rounded-lg border border-slate-200 bg-slate-100"
                            />
                            <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              Marque: {vehicle.model.maker.name} - modèle: {vehicle.model.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 capitalize text-slate-700 font-medium">
                          {vehicle.contract_type.name === 'Vente' ? 'Vente' : 'Location'}
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-800">
                          {Number(vehicle.price).toLocaleString('fr-FR')} €
                          {vehicle.contract_type.name === 'Location' && <span className="text-xs font-normal text-slate-500">/mois</span>}
                        </td>
                        <td className="py-4 px-6">{renderStatusBadge(vehicle.status || 'disponible')}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                              title="Voir les détails"
                              className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/vehicles/${vehicle.id}/edit`)}
                              title="Modifier"
                              className="text-blue-500 hover:text-blue-700 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setVehicleToDelete(vehicle)}
                              title="Supprimer"
                              className="text-rose-500 hover:text-rose-700 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-600">
            <div>
              Affichage de {vehicles.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} à{' '}
              {Math.min(currentPage * pageSize, totalEntries)} sur {totalEntries} entrées
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => currentPage === totalPages ? setCurrentPage((prev) => prev - 1) : setCurrentPage((prev) => prev + 1) }
                className="px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700"
              >
              {currentPage === totalPages ? "Précédente" : "Suivante"}  
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(totalPages)}
                className="px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700"
              >
                Dernière
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Vehicle Deletion */}
      {vehicleToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-900">Confirmer la suppression</h3>
            </div>
            <p className="text-sm text-slate-600">
              Êtes-vous sûr de vouloir supprimer le véhicule{' '}
              <span className="font-semibold text-slate-800">
                {vehicleToDelete.model.maker.name} {vehicleToDelete.model.name}
              </span>{' '}
              ? Cette action est irrreversible.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setVehicleToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleListPage;