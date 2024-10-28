import React, { useState } from 'react';
import { BarChart, Calendar, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface Sale {
  id: string;
  date: string;
  total: number;
}

const Reportes: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Datos de ejemplo (en una aplicación real, estos datos vendrían de una API o base de datos)
  const sampleSales: Sale[] = [
    { id: 'INV-001', date: '2024-03-01', total: 100.50 },
    { id: 'INV-002', date: '2024-03-02', total: 200.75 },
    { id: 'INV-003', date: '2024-03-03', total: 150.25 },
    // ... más datos de ventas
  ];

  const filterSales = () => {
    return sampleSales.filter(sale => {
      const saleDate = new Date(sale.date);
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();
      return saleDate >= start && saleDate <= end;
    });
  };

  const generateReport = () => {
    const filteredSales = filterSales();
    let reportData: { date: string; total: number }[] = [];

    if (reportType === 'daily') {
      reportData = filteredSales.map(sale => ({
        date: sale.date,
        total: sale.total
      }));
    } else if (reportType === 'weekly') {
      const weeklyData: { [key: string]: number } = {};
      filteredSales.forEach(sale => {
        const date = new Date(sale.date);
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
        const weekKey = weekStart.toISOString().split('T')[0];
        weeklyData[weekKey] = (weeklyData[weekKey] || 0) + sale.total;
      });
      reportData = Object.entries(weeklyData).map(([date, total]) => ({ date, total }));
    } else if (reportType === 'monthly') {
      const monthlyData: { [key: string]: number } = {};
      filteredSales.forEach(sale => {
        const monthKey = sale.date.substring(0, 7); // YYYY-MM
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + sale.total;
      });
      reportData = Object.entries(monthlyData).map(([date, total]) => ({ date, total }));
    }

    generatePDF(reportData);
  };

  const generatePDF = (data: { date: string; total: number }[]) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Reporte de Ventas (${reportType})`, 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Desde: ${startDate || 'Inicio'}`, 20, 30);
    doc.text(`Hasta: ${endDate || 'Fin'}`, 20, 40);

    const tableColumn = ["Fecha", "Total"];
    const tableRows = data.map(item => [item.date, `$${item.total.toFixed(2)}`]);

    (doc as any).autoTable({
      startY: 50,
      head: [tableColumn],
      body: tableRows,
    });

    const finalY = (doc as any).lastAutoTable.finalY || 50;
    const totalSales = data.reduce((sum, item) => sum + item.total, 0);
    doc.text(`Total de Ventas: $${totalSales.toFixed(2)}`, 20, finalY + 10);

    doc.save(`reporte_ventas_${reportType}.pdf`);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Reportes de Ventas</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block mb-2">Fecha de Inicio</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-2">Fecha de Fin</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-2">Tipo de Reporte</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as 'daily' | 'weekly' | 'monthly')}
            className="w-full p-2 border rounded"
          >
            <option value="daily">Diario</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
          </select>
        </div>
      </div>
      <button
        onClick={generateReport}
        className="bg-blue-500 text-white px-4 py-2 rounded flex items-center"
      >
        <FileText size={20} className="mr-2" />
        Generar Reporte PDF
      </button>
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Resumen de Ventas</h2>
        <div className="bg-white shadow rounded-lg p-6">
          <BarChart className="w-full h-64" />
          <p className="text-center mt-4">Gráfico de ventas (representación visual)</p>
        </div>
      </div>
    </div>
  );
};

export default Reportes;