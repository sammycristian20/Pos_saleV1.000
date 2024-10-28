import React, { useState } from 'react';

interface ConfiguracionEmpresa {
  nombreEmpresa: string;
  rnc: string;
  direccion: string;
  telefono: string;
  email: string;
}

const Configuracion: React.FC = () => {
  const [configuracion, setConfiguracion] = useState<ConfiguracionEmpresa>({
    nombreEmpresa: 'Mi Empresa',
    rnc: '123456789',
    direccion: 'Calle Principal #123, Ciudad',
    telefono: '809-555-1234',
    email: 'info@miempresa.com',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfiguracion({ ...configuracion, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para guardar la configuración
    alert('Configuración guardada');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Configuración</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2">Nombre de la Empresa</label>
            <input
              type="text"
              name="nombreEmpresa"
              value={configuracion.nombreEmpresa}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-2">RNC</label>
            <input
              type="text"
              name="rnc"
              value={configuracion.rnc}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-2">Dirección</label>
            <input
              type="text"
              name="direccion"
              value={configuracion.direccion}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-2">Teléfono</label>
            <input
              type="tel"
              name="telefono"
              value={configuracion.telefono}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={configuracion.email}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>
        <button type="submit" className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
          Guardar Configuración
        </button>
      </form>
    </div>
  );
};

export default Configuracion;