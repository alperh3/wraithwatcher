'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { createSighting, uploadImage } from '../utils/database';

// Dynamically import the map component to avoid SSR issues
const LocationMap = dynamic(() => import('../components/LocationMap'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
});

export default function PostSighting() {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    type: '',
    notes: '',
    location: '',
    lat: 0,
    lng: 0
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocationSelect = (location: string, lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      location,
      lat,
      lng
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let imageUrl: string | undefined;
      
      // Upload image if provided
      if (selectedImage) {
        const uploadResult = await uploadImage(selectedImage);
        if (!uploadResult.success) {
          alert(`Error uploading image: ${uploadResult.error}`);
          setIsSubmitting(false);
          return;
        }
        imageUrl = uploadResult.url;
      }
      
      // Create sighting data
      const sightingData = {
        date: formData.date,
        time: formData.time,
        type: formData.type,
        notes: formData.notes,
        location: formData.location,
        lat: formData.lat,
        lng: formData.lng,
        image: imageUrl,
      };
      
      // Save to database
      const result = await createSighting(sightingData);
      
      if (!result.success) {
        alert(`Error saving sighting: ${result.error}`);
        setIsSubmitting(false);
        return;
      }
      
      setIsSubmitting(false);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting sighting:', error);
      setIsSubmitting(false);
      alert('Error submitting sighting. Please try again.');
    }
  };

  if (submitted) {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-black text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-black text-lg">👻</span>
            </div>
            <h1 className="text-xl font-bold">WraithWatchers</h1>
          </div>
          <nav className="flex space-x-4">
            <a
              href="/"
              className="px-4 py-2 rounded hover:bg-gray-800"
            >
              Sightings Map
            </a>
            <button
              className="px-4 py-2 rounded bg-orange-500 text-white"
            >
              Post a Sighting
            </button>
          </nav>
        </div>
      </header>

        {/* Confirmation Content */}
        <main className="max-w-4xl mx-auto p-6">
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-4xl font-bold mb-4 text-white">Thank You!</h1>
            <p className="text-xl text-gray-300 mb-8">May you be clear of scary spirits!</p>
            
            <div className="flex justify-center mb-8">
              <div className="w-64 h-64 bg-gray-700 rounded-lg flex items-center justify-center">
                <div className="text-6xl">🕯️</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <a
                href="/"
                className="inline-block bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
              >
                View All Sightings
              </a>
              <div>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      date: '',
                      time: '',
                      type: '',
                      notes: '',
                      location: '',
                      lat: 0,
                      lng: 0
                    });
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                  className="text-orange-400 hover:text-orange-300 underline"
                >
                  Post Another Sighting
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-black text-white p-4 mt-8">
          <div className="max-w-7xl mx-auto text-center">
            <p>© 2024 WraithWatchers. All rights reserved.</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-black text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-black text-lg">👻</span>
            </div>
            <h1 className="text-xl font-bold">WraithWatchers</h1>
          </div>
          <nav className="flex space-x-4">
            <a
              href="/"
              className="px-4 py-2 rounded hover:bg-gray-800"
            >
              Sightings Map
            </a>
            <button
              className="px-4 py-2 rounded bg-orange-500 text-white"
            >
              Post a Sighting
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-2 text-white">Post a Sighting</h1>
          <p className="text-gray-300 mb-8">
            Did you spot a spirit? Post information below so that our community can stand vigilant!
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium mb-2 text-gray-300">
                  Date of Sighting
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="time" className="block text-sm font-medium mb-2 text-gray-300">
                  Time of Sighting
                </label>
                <select
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select time of day</option>
                  <option value="Dawn">Dawn</option>
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                  <option value="Night">Night</option>
                  <option value="Midnight">Midnight</option>
                </select>
              </div>
            </div>

            {/* Sighting Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium mb-2 text-gray-300">
                Type of Sighting
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Select sighting type</option>
                <option value="Headless Spirit">Headless Spirit</option>
                <option value="Shadow Figure">Shadow Figure</option>
                <option value="Poltergeist">Poltergeist</option>
                <option value="White Lady">White Lady</option>
                <option value="Orbs">Orbs</option>
                <option value="Phantom Sounds">Phantom Sounds</option>
                <option value="Apparition">Apparition</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Location Map */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Where Were You Exactly? (Place a Pin) *
              </label>
              <LocationMap onLocationSelect={handleLocationSelect} />
              {formData.location ? (
                <p className="mt-2 text-sm text-green-400">
                  ✓ Selected: {formData.location}
                </p>
              ) : (
                <p className="mt-2 text-sm text-red-400">
                  ⚠ Please click on the map to select a location
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-2 text-gray-300">
                Sighting Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                required
                rows={4}
                placeholder="Describe what you saw, heard, or experienced..."
                className="w-full p-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-gray-400"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Upload Image (Optional)
              </label>
              <div className="space-y-4">
                {!imagePreview ? (
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      <div className="text-4xl">📷</div>
                      <div className="text-gray-300">
                        <span className="text-orange-500 hover:text-orange-400">Click to upload</span> or drag and drop
                      </div>
                      <div className="text-sm text-gray-400">
                        PNG, JPG, GIF up to 5MB
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-lg border border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                    <div className="text-sm text-gray-300">
                      <p><strong>File:</strong> {selectedImage?.name}</p>
                      <p><strong>Size:</strong> {(selectedImage?.size! / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting || !formData.lat || !formData.lng}
                className="w-full bg-orange-500 text-white py-4 px-6 rounded-lg text-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Posting Your Sighting...' : 'Post Your Sighting'}
              </button>
              {(!formData.lat || !formData.lng) && (
                <p className="mt-2 text-sm text-red-400 text-center">
                  Please select a location on the map to enable submission
                </p>
              )}
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black text-white p-4 mt-8">
        <div className="max-w-7xl mx-auto text-center">
          <p>© 2024 WraithWatchers. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
