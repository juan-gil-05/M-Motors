/* eslint-disable no-unused-vars */
import { useState } from 'react';
import { Upload, Info, Sliders, FileText } from 'lucide-react';
import api from '../api/api';

const AddVehiclePage = () => {
  // Form input state
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: '2024',
    mileage: '0',
    transmission: 'manuel',
    fuel_type: 'essence',
    contract_type: 'location', // Default 'location' matching mockup
    price: '',
    lease_duration_months: '12',
    annual_included_mileage: '10000',
    final_purchase_price: '',
  });

  // Photo management states
  const [photos, setPhotos] = useState([]);
  const [coverIndex, setCoverIndex] = useState(0);

  // Status feedback states
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Universal input change handler
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Handle file selections for vehicle photos
   */
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newPhotoObjects = files.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      setPhotos((prev) => [...prev, ...newPhotoObjects]);
    }
  };

  /**
   * Form submit handler
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (photos.length === 0) {
      setErrorMessage('Veuillez ajouter au moins une photo du véhicule.');
      return;
    }

    setIsSubmitting(true);

    // Prepare multipart form data payload
    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });

    photos.forEach((photoObj) => {
      data.append('uploaded_photos', photoObj.file);
    });

    data.append('cover_photo_index', coverIndex);

    try {
      const response = await api.post('/vehicles/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Display required success notification criteria
      setSuccessMessage('Le véhicule a bien été ajouté');
      
      // Reset form on success
      setFormData({
        brand: '',
        model: '',
        year: '2024',
        mileage: '0',
        transmission: 'manuel',
        fuel_type: 'essence',
        contract_type: 'location',
        price: '',
        lease_duration_months: '12',
        annual_included_mileage: '10000',
        final_purchase_price: '',
      });
      setPhotos([]);
      setCoverIndex(0);
    } catch (err) {
      if (err.response?.data) {
        setErrorMessage('Veuillez vérifier les champs renseignés.');
      } else {
        setErrorMessage('Une erreur est survenue lors de l\'ajout du véhicule.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Title */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Nouveau véhicule</h1>
          <p className="text-slate-500 text-sm mt-1">Ajoutez un nouveau véhicule au catalogue.</p>
        </div>

        {/* Feedback Alerts */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Left Columns: Form Inputs */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Section 1: Information Générale */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg">
                <Info className="w-5 h-5 text-blue-600" />
                <h2>Information générale</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Marque</label>
                  <input
                    type="text"
                    name="brand"
                    required
                    value={formData.brand}
                    onChange={handleInputChange}
                    placeholder="Sélectionner la marque"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Modèle</label>
                  <input
                    type="text"
                    name="model"
                    required
                    value={formData.model}
                    onChange={handleInputChange}
                    placeholder="Sélectionner le modèle"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Année</label>
                  <input
                    type="number"
                    name="year"
                    required
                    value={formData.year}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kilométrage</label>
                  <input
                    type="number"
                    name="mileage"
                    required
                    value={formData.mileage}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Spécifications Techniques */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg">
                <Sliders className="w-5 h-5 text-blue-600" />
                <h2>Spécifications Techniques</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Boîte de vitesses</label>
                  <select
                    name="transmission"
                    value={formData.transmission}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600"
                  >
                    <option value="manuel">Manuel</option>
                    <option value="automatique">Automatique</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Énergie</label>
                  <select
                    name="fuel_type"
                    value={formData.fuel_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600"
                  >
                    <option value="essence">Essence</option>
                    <option value="gasoil">Gasoil</option>
                    <option value="electrique">Électrique</option>
                    <option value="gaz_naturel">Gaz naturel</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Type de contrat */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2>Type de contrat</h2>
              </div>

              {/* Radio options */}
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="contract_type"
                    value="vente"
                    checked={formData.contract_type === 'vente'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-800">Vente directe</span>
                </label>

                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="contract_type"
                    value="location"
                    checked={formData.contract_type === 'location'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-800">Location avec option d'achat</span>
                </label>
              </div>

              {/* Dynamic Inputs based on Contract Type */}
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {formData.contract_type === 'location' ? 'Loyer mensuel (€/Mois)' : 'Prix de vente (€)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    required
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>

                {formData.contract_type === 'location' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Durée du contrat (Mois)
                        </label>
                        <select
                          name="lease_duration_months"
                          value={formData.lease_duration_months}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600"
                        >
                          <option value="12">12 mois</option>
                          <option value="24">24 mois</option>
                          <option value="36">36 mois</option>
                          <option value="48">48 mois</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Kilométrage annuel inclus (km/an)
                        </label>
                        <select
                          name="annual_included_mileage"
                          value={formData.annual_included_mileage}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600"
                        >
                          <option value="10000">10 000 km</option>
                          <option value="15000">15 000 km</option>
                          <option value="20000">20 000 km</option>
                          <option value="25000">25 000 km</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Option d'achat finale (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="final_purchase_price"
                        required
                        value={formData.final_purchase_price}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Photos & Action Buttons */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-semibold text-slate-900">Photos</h2>

              {/* Upload Dropzone */}
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/60 cursor-pointer transition-colors text-center">
                <Upload className="w-8 h-8 text-blue-600 mb-2" />
                <span className="text-xs font-medium text-slate-700">
                  Glissez vos photos ici ou parcourez vos fichiers
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  JPG ou PNG haute résolution (Max 10MB)
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/png, image/jpeg"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              {/* Photos Grid & Cover Selection */}
              <div className="grid grid-cols-2 gap-3">
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    onClick={() => setCoverIndex(index)}
                    className={`relative rounded-lg overflow-hidden border-2 cursor-pointer aspect-video bg-slate-100 ${
                      coverIndex === index ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-slate-200'
                    }`}
                  >
                    <img
                      src={photo.previewUrl}
                      alt={`Aperçu ${index}`}
                      className="w-full h-full object-cover"
                    />
                    {coverIndex === index && (
                      <span className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                        Couverture
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons matching Mockup */}
            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg text-sm transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Publication...' : 'Publier le véhicule'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVehiclePage;