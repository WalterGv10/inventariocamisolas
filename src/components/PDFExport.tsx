import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { InventarioConDetalles } from '../types';
import styles from './PDFExport.module.css';

interface PDFExportProps {
    inventario: InventarioConDetalles[];
}

/**
 * PDF Export Component.
 * 
 * Generates a downloadable PDF report of the current inventory using `jspdf` and `jspdf-autotable`.
 * The report includes:
 * - Header with Title and Timestamp.
 * - Data Table (Team, Color, Size, Stock, Samples, Sales).
 * - Summary Totals at the bottom.
 * 
 * ---
 * 
 * Componente de Exportación PDF.
 * 
 * Genera un reporte PDF descargable del inventario actual usando `jspdf` y `jspdf-autotable`.
 * El reporte incluye:
 * - Encabezado con Título y Fecha/Hora.
 * - Tabla de Datos (Equipo, Color, Talla, Stock, Muestras, Ventas).
 * - Totales de Resumen al final.
 */
export function PDFExport({ inventario }: PDFExportProps) {
    const handleExportPDF = () => {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Reporte de Inventario de Camisolas', 14, 20);

        // Timestamp
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const timestamp = new Date().toLocaleString('es-GT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
        doc.text(`Generado: ${timestamp}`, 14, 28);

        // Prepare table data
        const tableData = inventario.map((item) => [
            item.equipo,
            item.color,
            item.talla,
            item.cantidad.toString(),
            item.muestras.toString(),
            item.vendidas.toString(),
        ]);

        // Add table
        autoTable(doc, {
            startY: 35,
            head: [['Equipo', 'Color', 'Talla', 'Stock', 'Muestras', 'Ventas']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [57, 255, 20],
                textColor: [0, 0, 0],
                fontSize: 11,
                fontStyle: 'bold',
                halign: 'center',
            },
            bodyStyles: {
                fontSize: 10,
            },
            columnStyles: {
                0: { halign: 'left' },
                1: { halign: 'left' },
                2: { halign: 'center', fontStyle: 'bold' },
                3: { halign: 'center' },
                4: { halign: 'center' },
                5: { halign: 'center' },
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245],
            },
        });

        // Summary calculations
        const totalStock = inventario.reduce((sum, item) => sum + item.cantidad, 0);
        const totalMuestras = inventario.reduce((sum, item) => sum + item.muestras, 0);
        const totalVentas = inventario.reduce((sum, item) => sum + item.vendidas, 0);

        const finalY = (doc as any).lastAutoTable.finalY || 35;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total Stock: ${totalStock}`, 14, finalY + 10);
        doc.text(`Total Muestras: ${totalMuestras}`, 14, finalY + 17);
        doc.text(`Total Ventas: ${totalVentas}`, 14, finalY + 24);

        // Save PDF
        const filename = `inventario_completo_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
    };

    return (
        <button className={styles.exportButton} onClick={handleExportPDF}>
            📄 Exportar PDF
        </button>
    );
}
