import { buildRegionInfo, getBoardRegions, renderPrintableSheet } from './printableSheet';

const PAGE_W = 297; // A4 horizontal, en mm
const PAGE_H = 210;
const MARGIN = 8;

const addSheetPage = (pdf, canvas, isFirst) => {
  if (!isFirst) pdf.addPage('a4', 'landscape');

  const maxW = PAGE_W - MARGIN * 2;
  const maxH = PAGE_H - MARGIN * 2;
  const scale = Math.min(maxW / canvas.width, maxH / canvas.height);
  const w = canvas.width * scale;
  const h = canvas.height * scale;

  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', (PAGE_W - w) / 2, (PAGE_H - h) / 2, w, h);
};

/**
 * Genera el PDF de la plantilla: una pagina con la hoja completa y, si la grilla es mayor
 * que un tablero, una pagina por tablero (con coordenadas globales y leyenda con las
 * cantidades de ese tablero). Devuelve un Blob.
 */
export const buildTemplatePdf = async (info, { showNumbers = false, boardSize = 29 } = {}) => {
  // jsPDF pesa bastante: se carga solo cuando el usuario exporta
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });

  const fullCanvas = renderPrintableSheet(info, { showNumbers });
  addSheetPage(pdf, fullCanvas, true);

  const cols = info.widthBeads;
  const rows = info.heightBeads;
  if (boardSize > 0 && (cols > boardSize || rows > boardSize)) {
    const regions = getBoardRegions(cols, rows, boardSize);
    regions.forEach((region, index) => {
      const regionInfo = buildRegionInfo(info, region);
      const title =
        `Tablero ${index + 1} de ${regions.length}` +
        ` · columnas ${region.col0 + 1}-${region.col1} · filas ${region.row0 + 1}-${region.row1}`;
      addSheetPage(pdf, renderPrintableSheet(regionInfo, { showNumbers, title }), false);
    });
  }

  return pdf.output('blob');
};
