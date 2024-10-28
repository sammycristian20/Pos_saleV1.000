import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, UserPlus, X } from 'lucide-react';
import { Client } from './types';
import { usePOS } from '../../contexts/POSContext';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ClientSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { selectedClient, setSelectedClient } = usePOS();

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const delayDebounceFn = setTimeout(() => {
        searchClients();
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    } else {
      setClients([]);
      setShowResults(false);
    }
  }, [searchTerm]);

  const searchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: searchError } = await supabase
        .from('customers')
        .select('id, name, document, document_type, email, phone')
        .or(`name.ilike.%${searchTerm}%,document.ilike.%${searchTerm}%`)
        .limit(10);

      if (searchError) throw searchError;

      setClients(data || []);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching clients:', error);
      setError('Error al buscar clientes');
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setSearchTerm('');
    setShowResults(false);
    setError(null);
  };

  const handleClearSelection = () => {
    setSelectedClient(null);
    setSearchTerm('');
    setShowResults(false);
    setError(null);
  };

  return (
    <div className="relative">
      {error && (
        <div className="mb-2 p-2 text-sm text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      {selectedClient ? (
        <div className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center">
          <div>
            <p className="font-medium">{selectedClient.name}</p>
            <p className="text-sm text-gray-500">
              {selectedClient.document_type}: {selectedClient.document}
            </p>
          </div>
          <button
            onClick={handleClearSelection}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Remover cliente seleccionado"
          >
            <X size={20} />
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center bg-white rounded-lg shadow-sm">
            <Search className="ml-3 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Buscar cliente por nombre o documento..."
              disabled={loading}
            />
          </div>

          {showResults && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2">Buscando...</p>
                </div>
              ) : clients.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {clients.map((client) => (
                    <li
                      key={client.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleClientSelect(client)}
                    >
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-gray-500">
                        {client.document_type}: {client.document}
                      </p>
                      {client.phone && (
                        <p className="text-sm text-gray-500">
                          Tel: {client.phone}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <p className="mb-2">No se encontraron clientes</p>
                  <button
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                    onClick={() => {/* TODO: Implement new client creation */}}
                  >
                    <UserPlus size={16} className="mr-1" />
                    Crear nuevo cliente
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ClientSearch;