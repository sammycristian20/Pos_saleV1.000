import React, { useState } from 'react';
import { Settings, FileText } from 'lucide-react';
import FiscalSequences from './FiscalSequences';
import CompanySettings from './CompanySettings';

const Configuracion: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'fiscal'>('general');

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Configuración</h1>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'general'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="inline-block mr-2" size={20} />
              Configuración General
            </button>
            <button
              onClick={() => setActiveTab('fiscal')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'fiscal'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="inline-block mr-2" size={20} />
              Secuencias Fiscales
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'general' ? <CompanySettings /> : <FiscalSequences />}
    </div>
  );
};

export default Configuracion;