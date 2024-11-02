import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from './AuthContext';
import type { CashRegisterSummary } from '../components/CashRegister/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface CashRegisterContextType {
  register: CashRegisterSummary | null;
  loading: boolean;
  error: string | null;
  refreshRegister: () => Promise<void>;
}

const CashRegisterContext = createContext<CashRegisterContextType | undefined>(undefined);

export function CashRegisterProvider({ children }: { children: React.ReactNode }) {
  const [register, setRegister] = useState<CashRegisterSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchRegisterStatus = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase.rpc('get_user_cash_register', {
        p_user_id: user.id
      });

      if (fetchError) throw fetchError;
      setRegister(data[0] || null);
    } catch (err) {
      console.error('Error fetching register status:', err);
      setError('Error al verificar el estado de la caja');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRegisterStatus();
    }
  }, [user]);

  const value = {
    register,
    loading,
    error,
    refreshRegister: fetchRegisterStatus
  };

  return (
    <CashRegisterContext.Provider value={value}>
      {children}
    </CashRegisterContext.Provider>
  );
}

export function useCashRegister() {
  const context = useContext(CashRegisterContext);
  if (context === undefined) {
    throw new Error('useCashRegister must be used within a CashRegisterProvider');
  }
  return context;
}