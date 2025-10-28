import React, { useState, FormEvent } from 'react';

interface NameModalProps {
  isOpen: boolean;
  onConfirm: (name: string) => void;
  onClose: () => void;
}

const NameModal: React.FC<NameModalProps> = ({ isOpen, onConfirm, onClose }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-sm m-4 text-white transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Customer Name</h2>
        <p className="text-gray-400 mb-6 text-center">Please enter the customer's name to begin.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter full name"
            required
            autoFocus
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors duration-300 disabled:opacity-50"
            disabled={!name.trim()}
          >
            Start Conversation
          </button>
        </form>
      </div>
    </div>
  );
};

export default NameModal;
