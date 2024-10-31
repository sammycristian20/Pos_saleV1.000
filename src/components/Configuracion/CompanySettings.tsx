import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { AlertCircle } from 'lucide-react';
import type { CompanySettings, CompanySettingsFormData } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CompanySettings: React.FC = () => {
  const [settings, setSettings] = useState<CompanySettingsFormData>({
    name: '',
    rnc: '',
    address: '',
    phone: '',
    email: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          name: data.name,
          rnc: data.rnc,
          address: data.address,
          phone: data.phone,
          email: data.email
        });
      }
    } catch (err) {
      console.error('Error fetching company settings:', err);
      setError('Error al cargar la configuración de la empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const validateRNC = (rnc: string): boolean => {
    return /^\d{9}$/.test(rnc);
  };

  const validatePhone = (phone: string): boolean => {
    return /^\d{3}-\d{3}-\d{4}$/.test(phone);
  };

  const validateForm = (): boolean => {
    if (!validateRNC(settings.rnc)) {
      setError('El RNC debe tener 9 dígitos');
      return false;
    }

    if (!validatePhone(settings.phone)) {
      setError('El teléfono debe tener el formato: 809-555-5555');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setError(null);

    try {
      const { data: existingSettings } = await supabase
        .from('company_settings')
        .select('id')
        .single();

      if (existingSettings) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from('company_settings')
          .update(settings)
          .eq('id', existingSettings.id);

        if (updateError) throw updateError;
      } else {
        // Insert new settings
        const { error: insertError } = await supabase
          .from('company_settings')
          .insert([settings]);

        if (insertError) throw insertError;
      }

      alert('Configuración guardada exitosamente');
    } catch (err) {
      console.error('Error saving company settings:', err);
      setError('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      {error && (
        <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <div className="flex items-center">
            <AlertCircle className="mr-2" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 font-medium text-gray-700">
            Nombre de la Empresa
          </label>
          <input
            type="text"
            name="name"
            value={settings.name}
            onChange={handleInputChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={saving}
          />
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-700">
            RNC
          </label>
          <input
            type="text"
            name="rnc"
            value={settings.rnc}
            onChange={handleInputChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            pattern="\d{9}"
            title="El RNC debe tener 9 dígitos"
            placeholder="123456789"
            disabled={saving}
          />
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-700">
            Dirección
          </label>
          <input
            type="text"
            name="address"
            value={settings.address}
            onChange={handleInputChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={saving}
          />
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-700">
            Teléfono
          </label>
          <input
            type="tel"
            name="phone"
            value={settings.phone}
            onChange={handleInputChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            pattern="\d{3}-\d{3}-\d{4}"
            title="Formato: 809-555-5555"
            placeholder="809-555-5555"
            disabled={saving}
          />
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={settings.email}
            onChange={handleInputChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={saving}
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-6 w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
        disabled={saving}
      >
        {saving ? (
          <span className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Guardando...
          </span>
        ) : (
          'Guardar Configuración'
        )}
      </button>
    </form>
  );
};

export default CompanySettings;