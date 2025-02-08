import { useState } from 'react';

export default function ImageUpload({ onUpload, disabled }) {
  const [loading, setLoading] = useState(false);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Please upload an image smaller than 5MB');
      return;
    }

    try {
      setLoading(true);
      await onUpload(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to process image');
    } finally {
      setLoading(false);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        disabled={disabled || loading}
        className="hidden"
        id="image-upload"
      />
      <label
        htmlFor="image-upload"
        className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer 
          ${disabled || loading ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700'} 
          text-white transition-colors`}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
            <span>Upload Image</span>
          </>
        )}
      </label>
    </div>
  );
} 