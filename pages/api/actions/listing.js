import mongoose from 'mongoose';

// Create Listing model if it doesn't exist
const ListingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  tokenPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'sold', 'cancelled'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Listing = mongoose.models.Listing || mongoose.model('Listing', ListingSchema);

export async function createListing(userId, listingData) {
  try {
    const listing = new Listing({
      userId,
      title: listingData.title,
      tokenPrice: listingData.tokenPrice
    });

    await listing.save();
    
    return {
      success: true,
      message: `Successfully created listing "${listingData.title}" for ${listingData.tokenPrice} tokens.`
    };
  } catch (error) {
    console.error('Error creating listing:', error);
    return {
      success: false,
      message: 'Error creating listing',
      error: error.message
    };
  }
}

export async function getListings(userId) {
  try {
    const listings = await Listing.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    if (listings.length === 0) {
      return {
        success: true,
        message: "No active listings found."
      };
    }

    const listingText = listings
      .map(l => `• "${l.title}" for ${l.tokenPrice} tokens`)
      .join('\n');

    return {
      success: true,
      message: `Current listings:\n${listingText}`
    };
  } catch (error) {
    console.error('Error fetching listings:', error);
    return {
      success: false,
      message: 'Error fetching listings',
      error: error.message
    };
  }
} 