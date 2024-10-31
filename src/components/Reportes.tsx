import React, { useState, useEffect } from 'react';
import { BarChart as BarChartIcon, Calendar, FileText, Download, Filter } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency } from '../utils/format';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface SalesSummary {
  totalSales: number;
  totalRevenue: number;
  averageTicket: number;
  topProducts: {
    product_name: string;
    total_quantity: number;
    total_revenue: number;
  }[];
  salesByDate: {
    date: string;
    total: number;
    count: number;
  }[];
}

const Reportes: React.FC = () => {
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SalesSummary>({
    totalSales: 0,
    totalRevenue: 0,
    averageTicket: 0,
    topProducts: [],
    salesByDate: []
  });

  useEffect(() => {
    fetchSalesData();
  }, [startDate, endDate, reportType]);

  const fetchSalesData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch sales summary
      const { data: salesData, error: salesError } = await supabase
        .from('invoices')
        .select(`
          id,
          created_at,
          total_amount,
          items:invoice_items (
            quantity,
            total,
            product:products (
              name
            )
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('status', 'PAID');

      if (salesError) throw salesError;

      // Process sales data
      const processedData = processSalesData(salesData || []);
      setSummary(processedData);
    } catch (err) {
      console.error('Error fetching sales data:', err);
      setError('Error al cargar los datos de ventas');
    } finally {
      setLoading(false);
    }
  };

  const processSalesData = (salesData: any[]): SalesSummary => {
    const totalRevenue = salesData.reduce((sum, sale) => sum + sale.total_amount, 0);
    const totalSales = salesData.length;
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Process products
    const productSales: { [key: string]: { quantity: number; revenue: number } } = {};
    salesData.forEach(sale => {
      sale.items.forEach((item: any) => {
        const productName = item.product.name;
        if (!productSales[productName]) {
          productSales[productName] = { quantity: 0, revenue: 0 };
        }
        productSales[productName].quantity += item.quantity;
        productSales[productName].revenue += item.total;
      });
    });

    // Get top products
    const topProducts = Object.entries(productSales)
      .map(([product_name, data]) => ({
        product_name,
        total_quantity: data.quantity,
        total_revenue: data.revenue
      }))
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 5);

    // Process sales by date
    const salesByDate = processSalesByDate(salesData, reportType);

    return {
      totalSales,
      totalRevenue,
      averageTicket,
      topProducts,
      salesByDate
    };
  };

  const processSalesByDate = (salesData: any[], type: string) => {
    const salesByDate: { [key: string]: { total: number; count: number } } = {};

    salesData.forEach(sale => {
      let dateKey = new Date(sale.created_at).toISOString().split('T')[0];

      if (type === 'weekly') {
        const date = new Date(sale.created_at);
        date.setDate(date.getDate() - date.getDay());
        dateKey = date.toISOString().split('T')[0];
      } else if (type === 'monthly') {
        dateKey = new Date(sale.created_at).toISOString().slice(0, 7);
      }

      if (!salesByDate[dateKey]) {
        salesByDate[dateKey] = { total: 0, count: 0 };
      }
      salesByDate[dateKey].total += sale.total_amount;
      salesByDate[dateKey].count += 1;
    });

    return Object.entries(salesByDate)
      .map(([date, data]) => ({
        date,
        total: data.total,
        count: data.count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Reporte de Ventas', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Período: ${startDate} al ${endDate}`, 20, 25);
    doc.text(`Tipo de reporte: ${reportType}`, 20, 32);

    // Summary
    doc.setFontSize(14);
    doc.text('Resumen', 20, 45);
    
    doc.setFontSize(12);
    doc.text(`Total de ventas: ${summary.totalSales}`, 20, 55);
    doc.text(`Ingresos totales: ${formatCurrency(summary.totalRevenue)}`, 20, 62);
    doc.text(`Ticket promedio: ${formatCurrency(summary.averageTicket)}`, 20, 69);

    // Top Products
    doc.setFontSize(14);
    doc.text('Productos más vendidos', 20, 85);

    const productColumns = ['Producto', 'Cantidad', 'Total'];
    const productRows = summary.topProducts.map(product => [
      product.product_name,
      product.total_quantity.toString(),
      formatCurrency(product.total_revenue)
    ]);

    (doc as any).autoTable({
      startY: 90,
      head: [productColumns],
      body: productRows,
    });

    // Sales Chart
    doc.setFontSize(14);
    doc.text('Ventas por período', 20, (doc as any).lastAutoTable.finalY + 20);

    const salesColumns = ['Fecha', 'Ventas', 'Total'];
    const salesRows = summary.salesByDate.map(sale => [
      sale.date,
      sale.count.toString(),
      formatCurrency(sale.total)
    ]);

    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 25,
      head: [salesColumns],
      body: salesRows,
    });

    doc.save(`reporte_ventas_${reportType}_${startDate}_${endDate}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reportes de Ventas</h1>
        <button
          onClick={generatePDF}
          className="bg-blue-500 text-white px-4 py-2 rounded flex items-center"
          disabled={loading}
        >
          <Download size={20} className="mr-2" />
          Exportar PDF
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agrupar por
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full p-2 border rounded"
            >
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p>{error}</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Ventas</p>
                  <p className="text-2xl font-bold">{summary.totalSales}</p>
                </div>
                <BarChartIcon className="text-blue-500" size={24} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ingresos Totales</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</p>
                </div>
                <FileText className="text-green-500" size={24} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ticket Promedio</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary.averageTicket)}</p>
                </div>
                <Calendar className="text-purple-500" size={24} />
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-4">Productos Más Vendidos</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-left">Producto</th>
                    <th className="p-3 text-right">Cantidad</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.topProducts.map((product, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">{product.product_name}</td>
                      <td className="p-3 text-right">{product.total_quantity}</td>
                      <td className="p-3 text-right">{formatCurrency(product.total_revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sales Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-4">Ventas por Período</h2>
            <div className="h-64">
              {/* Here you would integrate a chart library like Chart.js or Recharts */}
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                Gráfico de ventas (representación visual)
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reportes;