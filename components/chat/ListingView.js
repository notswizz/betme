export default function ListingView({ listings }) {
  if (!Array.isArray(listings)) {
    return null;
  }

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex space-x-4 px-2 min-w-full">
        {listings.map((listing) => (
          <div 
            key={listing._id} 
            className="flex-none w-72 bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            <div className="h-40 bg-gray-200 flex items-center justify-center">
              {/* Placeholder image - you can add real images later */}
              <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{listing.title}</h3>
              <div className="flex justify-between items-center">
                <span className="text-blue-600 font-bold">{listing.tokenPrice} tokens</span>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  View Details
                </button>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Listed {new Date(listing.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 