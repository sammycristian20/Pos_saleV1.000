import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  BarElement
} from 'chart.js';
import { DollarSign, Users, Package, ArrowRight, ShoppingBag, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  BarElement
);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface TopProduct {
  name: string;
  total_quantity: number;
  total_revenue: number;
}

interface TopCustomer {
  name: string;
  total_purchases: number;
}

interface DashboardStats {
  totalSales: number;
  totalCustomers: number;
  totalProducts: number;
  inventoryValue: number;
  monthlySales: Array<{
    month: string;
    total: number;
  }>;
  topProducts: TopProduct[];
  topCustomers: TopCustomer[];
}

const initialStats: DashboardStats = {
  totalSales: 0,
  totalCustomers: 0,
  totalProducts: 0,
  inventoryValue: 0,
  monthlySales: [],
  topProducts: [],
  topCustomers: []
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get total customers
      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      // Get products stats
      const { data: products } = await supabase
        .from('products')
        .select('price, stock');

      const totalProducts = products?.length || 0;
      const inventoryValue = products?.reduce((sum, product) => 
        sum + (product.price * product.stock), 0) || 0;

      // Get monthly sales for the current year
      const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString();
      const { data: salesData } = await supabase
        .from('invoices')
        .select('total_amount, created_at')
        .gte('created_at', startOfYear)
        .eq('status', 'PAID');

      // Get top selling products
      const { data: topProductsData } = await supabase
        .from('invoice_items')
        .select(`
          quantity,
          total,
          product:products (
            name
          )
        `)
        .order('quantity', { ascending: false })
        .limit(5);

      const topProducts = processTopProducts(topProductsData || []);

      // Get top customers
      const { data: topCustomersData } = await supabase
        .from('invoices')
        .select(`
          total_amount,
          customer:customers (
            name
          )
        `)
        .eq('status', 'PAID')
        .order('total_amount', { ascending: false })
        .limit(5);

      const topCustomers = processTopCustomers(topCustomersData || []);

      const monthlySales = processMonthlyData(salesData || []);
      const totalSales = salesData?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;

      setStats({
        totalSales,
        totalCustomers: customersCount || 0,
        totalProducts,
        inventoryValue,
        monthlySales,
        topProducts,
        topCustomers
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const processTopProducts = (items: any[]): TopProduct[] => {
    const productMap = new Map<string, { quantity: number; revenue: number }>();
    
    items.forEach(item => {
      const productName = item.product?.name || 'Desconocido';
      const current = productMap.get(productName) || { quantity: 0, revenue: 0 };
      
      productMap.set(productName, {
        quantity: current.quantity + item.quantity,
        revenue: current.revenue + item.total
      });
    });

    return Array.from(productMap.entries())
      .map(([name, data]) => ({
        name,
        total_quantity: data.quantity,
        total_revenue: data.revenue
      }))
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 5);
  };

  const processTopCustomers = (sales: any[]): TopCustomer[] => {
    const customerMap = new Map<string, number>();
    
    sales.forEach(sale => {
      const customerName = sale.customer?.name || 'Cliente General';
      customerMap.set(
        customerName,
        (customerMap.get(customerName) || 0) + sale.total_amount
      );
    });

    return Array.from(customerMap.entries())
      .map(([name, total]) => ({
        name,
        total_purchases: total
      }))
      .sort((a, b) => b.total_purchases - a.total_purchases)
      .slice(0, 5);
  };

  const processMonthlyData = (sales: any[]) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const monthlyTotals = new Array(12).fill(0);

    sales.forEach(sale => {
      const month = new Date(sale.created_at).getMonth();
      monthlyTotals[month] += sale.total_amount;
    });

    return months.map((month, index) => ({
      month,
      total: monthlyTotals[index]
    }));
  };

  const salesChartData = {
    labels: stats.monthlySales.map(sale => sale.month),
    datasets: [
      {
        label: 'Ventas',
        data: stats.monthlySales.map(sale => sale.total),
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const topProductsChartData = {
    labels: stats.topProducts.map(product => product.name),
    datasets: [
      {
        data: stats.topProducts.map(product => product.total_revenue),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const topCustomersChartData = {
    labels: stats.topCustomers.map(customer => customer.name),
    datasets: [
      {
        label: 'Total de Compras',
        data: stats.topCustomers.map(customer => customer.total_purchases),
        backgroundColor: 'rgba(79, 70, 229, 0.8)',
        borderColor: 'rgb(79, 70, 229)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${formatCurrency(context.raw)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => formatCurrency(value)
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${formatCurrency(context.raw)}`
        }
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${formatCurrency(context.raw)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => formatCurrency(value)
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* POS Button */}
      <div className="flex justify-end">
        <Link
          to="/pos"
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg flex items-center hover:bg-indigo-700 transition-colors shadow-lg"
        >
          <ShoppingCart className="mr-2" size={20} />
          Ir al Punto de Venta
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Sales */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Ventas Totales</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSales)}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-full">
              <DollarSign className="text-indigo-600" size={24} />
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Clientes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Productos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        {/* Inventory Value */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Valor Inventario</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.inventoryValue)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <ShoppingBag className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Ventas Mensuales</h2>
              <Link
                to="/reportes"
                className="text-indigo-600 hover:text-indigo-700 flex items-center text-sm font-medium"
              >
                Ver reporte completo
                <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>
            <div className="h-[400px]">
              <Line data={salesChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Top Products Chart */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Productos Más Vendidos</h2>
              <Link
                to="/reportes"
                className="text-indigo-600 hover:text-indigo-700 flex items-center text-sm font-medium"
              >
                Ver más
                <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>
            <div className="h-[400px]">
              <Doughnut data={topProductsChartData} options={doughnutOptions} />
            </div>
          </div>
        </div>

        {/* Top Customers Chart */}
        <div className="bg-white rounded-lg shadow-sm lg:col-span-2">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Mejores Clientes</h2>
              <Link
                to="/reportes"
                className="text-indigo-600 hover:text-indigo-700 flex items-center text-sm font-medium"
              >
                Ver más
                <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>
            <div className="h-[300px]">
              <Bar data={topCustomersChartData} options={barOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;