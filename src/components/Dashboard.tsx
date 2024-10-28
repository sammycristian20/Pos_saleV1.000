import React, { useState, useEffect } from 'react';
import { BarChart, DollarSign, ShoppingBag, Users } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { formatCurrency } from '../utils/format';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Get total customers
      const { count: customersCount, error: customersError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      if (customersError) throw customersError;

      // Get sales statistics
      const { data: salesData, error: salesError } = await supabase
        .from('invoices')
        .select('total_amount, status')
        .eq('status', 'PAID');

      if (salesError) throw salesError;

      // Calculate totals
      const totalRevenue = salesData?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
      const totalOrders = salesData?.length || 0;

      setStats({
        totalSales: totalRevenue,
        totalOrders,
        totalCustomers: customersCount || 0,
        totalRevenue: totalRevenue
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard 
          icon={<DollarSign size={24} />} 
          title="Ventas Totales" 
          value={formatCurrency(stats.totalSales)}
          description="Total de ventas realizadas"
        />
        <DashboardCard 
          icon={<ShoppingBag size={24} />} 
          title="Pedidos" 
          value={stats.totalOrders.toString()}
          description="Número total de pedidos"
        />
        <DashboardCard 
          icon={<Users size={24} />} 
          title="Clientes" 
          value={stats.totalCustomers.toString()}
          description="Total de clientes registrados"
        />
        <DashboardCard 
          icon={<BarChart size={24} />} 
          title="Ingresos" 
          value={formatCurrency(stats.totalRevenue)}
          description="Ingresos totales"
        />
      </div>

      {/* Aquí podríamos agregar más secciones como:
          - Gráfico de ventas por mes
          - Productos más vendidos
          - Últimas ventas
          - etc. */}
    </div>
  );
};

interface DashboardCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ icon, title, value, description }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="text-blue-500">{icon}</div>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <h3 className="text-gray-600 font-medium">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
  );
};

export default Dashboard;