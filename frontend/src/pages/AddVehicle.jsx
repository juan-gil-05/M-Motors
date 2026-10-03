/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/immutability */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Info, Sliders, FileText } from 'lucide-react';
import api from '../api/api';
import toast from 'react-hot-toast'


const AddVehiclePage = () => {

  const navigate = useNavigate()

  // Form input state
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    kilometres: "",
    gearbox: "",
    fuel: "",
    contract_type: "",
    price: "",
    status: 1, // Disponible Status by default
    lease_details: {
      commitment_time: "",
      kilometres_per_year: "",
      final_purchase_price: "",
    },
    images: [
      {
        image: "",
        is_main: false
      }
    ]
  });


  // Photo management states
  const [photos, setPhotos] = useState([]);
  const [coverIndex, setCoverIndex] = useState(0);

  // Status feedback states
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // vehicle data states
  const [markerData, setMarkerData] = useState([])
  const [modelData, setModelData] = useState([])
  const [gearboxData, setGearboxData] = useState([])
  const [fuelData, setFuelData] = useState([])
  const [contractTypeData, setContractTypeData] = useState([])

  // functions to get and show the differents form options
  useEffect(() => {
    listVehicleMakers(),
      listVehicleModelsByMakerId()
  }, [formData.make])

  useEffect(() => {
    listVehicleGearboxes(),
      listVehicleFuels(),
      listVehicleContracTypes()
  }, [])


  // List all vehicle makers
  const listVehicleMakers = async () => {
    try {
      const res = await api.get(`/vehicle_api/makers`)
      setMarkerData(res.data)
    } catch (error) {
      setErrorMessage(error.message)
    }
  }
  // List vehicle models by the maker id
  const listVehicleModelsByMakerId = async () => {
    try {
      const makerId = formData.make ? formData.make : 0
      const res = await api.get(`/vehicle_api/models?maker_id=${makerId}`)
      setModelData(res.data)
    } catch (error) {
      setErrorMessage(error.message)
    }
  }
  // List all vehicle gearboxes
  const listVehicleGearboxes = async () => {
    try {
      const res = await api.get(`/vehicle_api/gearboxes`)
      setGearboxData(res.data)
    } catch (error) {
      setErrorMessage(error.message)
    }
  }
  //List all vehicle fuels
  const listVehicleFuels = async () => {
    try {
      const res = await api.get(`/vehicle_api/fuels`)
      setFuelData(res.data)
    } catch (error) {
      setErrorMessage(error.message)
    }
  }
  //List all vehicle contract types
  const listVehicleContracTypes = async () => {
    try {
      const res = await api.get(`/vehicle_api/contractType`)
      setContractTypeData(res.data)
    } catch (error) {
      setErrorMessage(error.message)
    }
  }



  // Universal input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Lease Details object input change handler
  const handleLeaseDetailsInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, lease_details: { ...formData.lease_details, [name]: value } });
  }


  //  Handle file selections for vehicle photos
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newPhotoObjects = files.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file), // to show a previsialization of the image
      }));
      setPhotos((prev) => [...prev, ...newPhotoObjects]);
    }
  };


  //  Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (photos.length === 0) {
      setErrorMessage('Veuillez ajouter au moins une photo du véhicule.');
      return;
    }

    setIsSubmitting(true);

    // Prepare form data payload
    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key !== 'lease_details' && key !== 'images') {
        data.append(key, formData[key]);
      }
    });

    // add lease details object to formdata payload only if contract type is location (id = 2)
    if (formData.lease_details && formData.contract_type == 2) {
      data.append('lease_details', JSON.stringify(formData.lease_details));
    }


    photos.forEach((photoObj) => {
      data.append('uploaded_photos', photoObj.file);
    });

    data.append('cover_photo_index', coverIndex);

    try {
      const response = await api.post('/vehicle_api/vehicles/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Reset form on success
      setFormData({
        make: "",
        model: "",
        kilometres: "",
        gearbox: "",
        fuel: "",
        contract_type: "",
        price: "",
        status: 1, // Disponible Status by default
        lease_details: {
          commitment_time: "",
          kilometres_per_year: "",
          final_purchase_price: "",
        },
        images: [
          {
            image: "",
            is_main: false
          }
        ]
      });
      setPhotos([]);
      setCoverIndex(0);
      navigate('/vehicules');
      // Display success message
      toast.success('Le véhicule a bien été ajouté')
    } catch (err) {
      setErrorMessage('Une erreur est survenue lors de l\'ajout du véhicule.');

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
                {/* Brand */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Marque</label>
                  <select name="make" required onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600">
                    <option value="">Sélectionner la marque</option>
                    {markerData.length > 0 && (
                      markerData.map((marker) => (
                        <option key={marker.id} value={marker.id}  >
                          {marker.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                {/* Model */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Modèle</label>
                  <select name="model" required onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600">
                    <option value="">Sélectionner le modèle</option>
                    {modelData.length > 0 && (
                      modelData.map((model) => (
                        <option key={model.id} value={model.id}  >
                          {model.name} (Anée: {model.year})
                        </option>
                      ))
                    )}
                  </select>
                  <p className='block text-xs font-liht text-slate-600 m-1 '>Veuillez choisir tout d'abord la marque</p>
                </div>
                {/* kilometers */}
                <div className='col-span-2'>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kilométrage</label>
                  <input
                    type="number" min={0}
                    name="kilometres"
                    required
                    value={formData.kilometres}
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
                {/* Gearboxes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Boîte de vitesses</label>
                  <select name="gearbox" required onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600">
                    <option value="">Sélectionner la boîte de vitesses</option>
                    {gearboxData.length > 0 && (
                      gearboxData.map((gearbox) => (
                        <option key={gearbox.id} value={gearbox.id}  >
                          {gearbox.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                {/* Fuel */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Énergie</label>
                  <select name="fuel" required onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600">
                    <option value="">Sélectionner l'énergie</option>
                    {fuelData.length > 0 && (
                      fuelData.map((fuel) => (
                        <option key={fuel.id} value={fuel.id}  >
                          {fuel.name}
                        </option>
                      ))
                    )}
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

                {contractTypeData.length > 0 && (
                  contractTypeData.map((contractType) => (
                    <>
                      <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50" key={contractType.id}>
                        <input type="radio" required
                          name="contract_type"
                          key={contractType.id}
                          value={contractType.id}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm font-medium text-slate-800">{contractType.name}</span>
                      </label>
                    </>
                  ))
                )}
              </div>

              {/* Dynamic Inputs based on Contract Type */}
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {/* {formData.contract_type === 'location' ? 'Loyer mensuel (€/Mois)' : 'Prix de vente (€)'} */}
                    {formData.contract_type === "2" ? 'Loyer mensuel (€/Mois)' : 'Prix de vente (€)'}
                  </label>
                  <input
                    type="number" min={0}
                    step="0.01"
                    name="price"
                    required
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
                {/* 1 = Vente, 2 = Location */}
                {formData.contract_type === "2" && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Durée du contrat (Mois)
                        </label>
                        <select
                          required
                          name="commitment_time" min={0}
                          value={formData.lease_details.commitment_time}
                          onChange={handleLeaseDetailsInputChange}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600"
                        >
                          <option value="">Sélectionner la durée du contrat</option>
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
                          required
                          name="kilometres_per_year"
                          value={formData.lease_details.kilometres_per_year}
                          onChange={handleLeaseDetailsInputChange}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600"
                        >
                          <option value="">Sélectionner le kilométrage</option>
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
                        type="number" min={0}
                        step="0.01"
                        name="final_purchase_price"
                        required
                        value={formData.lease_details.final_purchase_price}
                        onChange={handleLeaseDetailsInputChange}
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
                {/* upload icon */}
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
                    className={`relative rounded-lg overflow-hidden border-2 cursor-pointer aspect-video bg-slate-100 ${coverIndex === index ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-slate-200'
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

            {/* Action Buttons */}
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
      </div >
    </div >
  );
};

export default AddVehiclePage;