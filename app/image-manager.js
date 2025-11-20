'use client';

import { useState, useEffect } from 'react';
import { Upload, Trash2, Check } from 'lucide-react';

export default function ImageManager({ isbn, token, onImageUploadSuccess }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [altText, setAltText] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch existing images
  useEffect(() => {
    fetchImages();
  }, [isbn]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/books/${isbn}/images`);
      if (!response.ok) throw new Error('Failed to fetch images');
      const data = await response.json();
      setImages(data);
    } catch (err) {
      console.error('Error fetching images:', err);
      setError('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, WebP, and GIF allowed');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum 10MB');
      return;
    }

    setSelectedFile(file);
    setError('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setError('Please select an image');
      return;
    }

    if (!token) {
      setError('Authentication required');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('altText', altText);
      formData.append('isPrimary', isPrimary);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/books/${isbn}/images`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.details || errorData.error || 'Upload failed';
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setSuccess('Image uploaded successfully!');
      setSelectedFile(null);
      setAltText('');
      setIsPrimary(false);
      document.getElementById('image-input').value = '';

      // Refresh images
      await fetchImages();
      if (onImageUploadSuccess) {
        onImageUploadSuccess(result.image);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!confirm('Delete this image?')) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/books/${isbn}/images/${imageId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      setSuccess('Image deleted successfully!');
      await fetchImages();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete image');
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold">Book Images</h2>

      {/* Upload Form */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-semibold">Upload New Image</h3>

        <form onSubmit={handleUpload} className="space-y-4">
          {/* File Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Image (JPEG, PNG, WebP, GIF - Max 10MB)
            </label>
            <input
              id="image-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="block w-full text-sm border border-gray-300 rounded-lg p-2
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {selectedFile && (
              <p className="text-sm text-green-600 mt-1">
                ✓ {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
              </p>
            )}
          </div>

          {/* Alt Text */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Image Description (Alt Text)
            </label>
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="e.g., The Great Gatsby book cover"
              disabled={uploading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Primary Image Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="primary-checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              disabled={uploading}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="primary-checkbox" className="ml-2 text-sm font-medium">
              Set as primary image (displayed on product page)
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
              <Check size={16} />
              {success}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!selectedFile || uploading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium
                       hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                       transition flex items-center justify-center gap-2"
          >
            <Upload size={18} />
            {uploading ? 'Uploading...' : 'Upload Image'}
          </button>
        </form>
      </div>

      {/* Images List */}
      <div className="space-y-4">
        <h3 className="font-semibold">
          Uploaded Images ({images.length})
        </h3>

        {loading ? (
          <p className="text-gray-500">Loading images...</p>
        ) : images.length === 0 ? (
          <p className="text-gray-500">No images uploaded yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition"
              >
                {/* Image Preview */}
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  <img
                    src={image.scaleway_url}
                    alt={image.alt_text || 'Book image'}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Image Info */}
                <div className="p-3 space-y-2 bg-white">
                  {/* Primary Badge */}
                  {image.is_primary && (
                    <div className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">
                      Primary Image
                    </div>
                  )}

                  {/* Alt Text */}
                  {image.alt_text && (
                    <p className="text-sm text-gray-600 truncate">
                      {image.alt_text}
                    </p>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteImage(image.id)}
                    className="w-full bg-red-50 text-red-600 py-2 rounded-lg text-sm font-medium
                               hover:bg-red-100 transition flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Instructions */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm space-y-2">
        <p className="font-semibold">📋 Tips:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Images are stored on Scaleway Object Storage (EU-based)</li>
          <li>Maximum file size: 10MB per image</li>
          <li>Supported formats: JPEG, PNG, WebP, GIF</li>
          <li>Recommended dimensions: 400x600px for book covers</li>
          <li>Set one image as primary to display on product page</li>
        </ul>
      </div>
    </div>
  );
}
