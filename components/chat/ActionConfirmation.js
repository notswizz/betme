export default function ActionConfirmation({ action, onConfirm, onCancel }) {
  const getActionDescription = (action) => {
    if (action.name === 'add_tokens') {
      return `Add ${action.amount} tokens to your balance`;
    }
    if (action.name === 'create_listing') {
      return `Create listing "${action.listingTitle}" for ${action.listingPrice} tokens`;
    }
    return action.description || 'Unknown action';
  };

  return (
    <div className="border rounded-lg p-4 mb-4 bg-yellow-50">
      <p className="text-sm mb-3">
        Confirm action: {getActionDescription(action)}
      </p>
      <div className="flex space-x-2">
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
        >
          Confirm
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
} 