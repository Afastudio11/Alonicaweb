import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ItemSummary { name: string; qty: number; total: number; }
interface RecapData {
  makanan: ItemSummary[];
  minuman: ItemSummary[];
  openBill: ItemSummary[];
}
interface ShiftReportData {
  kasirName: string;
  branchName?: string | null;
  reportDate: string;
  shiftStart: string | Date;
  shiftEnd: string | Date;
  totalOrders?: number | null;
  totalPaid?: number | null;
  totalMakanan?: number | null;
  totalMinuman?: number | null;
  totalOpenBillPending?: number | null;
  initialCash?: number | null;
  finalCash?: number | null;
  systemCash?: number | null;
  cashDifference?: number | null;
  notes?: string | null;
}

const PAGE_H = 297;
const PAGE_MARGIN_BOTTOM = 20;

function rp(n: number | null | undefined) {
  return "Rp " + (n ?? 0).toLocaleString("id-ID");
}

function fmtDt(d: string | Date | null | undefined) {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "-";
  return dt.toLocaleString("id-ID", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "-";
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}

function safeStr(v: any): string {
  if (v === null || v === undefined) return "-";
  return String(v);
}

function safeItems(arr: ItemSummary[] | null | undefined): ItemSummary[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter(Boolean).map(i => ({
    name: safeStr(i?.name),
    qty: Number(i?.qty) || 0,
    total: Number(i?.total) || 0,
  }));
}

function getLastY(doc: jsPDF, fallback: number): number {
  const last = (doc as any).lastAutoTable;
  if (last && typeof last.finalY === "number") return last.finalY;
  return fallback;
}

function checkPage(doc: jsPDF, y: number, needed = 30): number {
  if (y + needed > PAGE_H - PAGE_MARGIN_BOTTOM) {
    doc.addPage();
    return 20;
  }
  return y;
}

export function generateShiftPDF(report: ShiftReportData, recap: RecapData | null | undefined): boolean {
  try {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const orange: [number, number, number] = [255, 149, 0];
    const dark: [number, number, number] = [29, 29, 31];
    const grey: [number, number, number] = [110, 110, 115];

    let y = 14;

    // Header bar
    doc.setFillColor(...orange);
    doc.rect(0, 0, W, 26, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("ngehnoom", 14, 11);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Laporan Penutupan Shift Kasir", 14, 17);
    doc.setFontSize(8);
    doc.text(`Tanggal: ${fmtDate(report.reportDate)}`, W - 14, 11, { align: "right" });
    doc.text(`Dicetak: ${fmtDt(new Date())}`, W - 14, 17, { align: "right" });

    y = 34;

    // Info Kasir & Shift
    doc.setTextColor(...dark);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Informasi Shift", 14, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grey);

    const infoRows = [
      ["Kasir", safeStr(report.kasirName)],
      ["Cabang", safeStr(report.branchName) || "-"],
      ["Mulai Shift", fmtDt(report.shiftStart)],
      ["Selesai Shift", fmtDt(report.shiftEnd)],
      ["Total Transaksi", `${report.totalOrders ?? 0} pesanan`],
    ];

    infoRows.forEach(([label, val]) => {
      y = checkPage(doc, y, 8);
      doc.setTextColor(...grey);
      doc.text(label + ":", 14, y);
      doc.setTextColor(...dark);
      doc.text(val, 60, y);
      y += 5;
    });

    y += 3;

    // Summary table
    y = checkPage(doc, y, 50);
    doc.setTextColor(...dark);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Ringkasan Penjualan", 14, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [["Keterangan", "Jumlah"]],
      body: [
        ["Total Terbayar", rp(report.totalPaid)],
        ["Penjualan Makanan", rp(report.totalMakanan)],
        ["Penjualan Minuman", rp(report.totalMinuman)],
        ["Open Bill Pending (belum lunas)", rp(report.totalOpenBillPending)],
      ],
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: orange, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
      columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
      margin: { left: 14, right: 14 },
    });

    y = getLastY(doc, y + 40) + 6;

    // Kas detail table
    y = checkPage(doc, y, 50);
    doc.setTextColor(...dark);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Rekonsiliasi Kas", 14, y);
    y += 2;

    const diff = report.cashDifference ?? 0;
    const diffStr = (diff >= 0 ? "+" : "") + rp(diff);

    autoTable(doc, {
      startY: y,
      head: [["Keterangan", "Jumlah"]],
      body: [
        ["Kas Awal", rp(report.initialCash)],
        ["Kas Tercatat Sistem", rp(report.systemCash)],
        ["Kas Fisik Dihitung", rp(report.finalCash)],
        ["Selisih Kas", diffStr],
      ],
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [70, 70, 80], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
      columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
      margin: { left: 14, right: 14 },
    });

    y = getLastY(doc, y + 40) + 6;

    // Item breakdowns
    const safeRecap = recap ?? null;

    const makanan = safeItems(safeRecap?.makanan);
    if (makanan.length > 0) {
      y = checkPage(doc, y, 40);
      doc.setTextColor(...dark);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Detail Makanan", 14, y);
      y += 2;
      autoTable(doc, {
        startY: y,
        head: [["Nama Item", "Qty", "Total"]],
        body: makanan.map(i => [i.name, `${i.qty}x`, rp(i.total)]),
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [255, 149, 0], textColor: [255, 255, 255], fontSize: 8 },
        columnStyles: { 1: { halign: "center" }, 2: { halign: "right" } },
        margin: { left: 14, right: 14 },
      });
      y = getLastY(doc, y + 30) + 5;
    }

    const minuman = safeItems(safeRecap?.minuman);
    if (minuman.length > 0) {
      y = checkPage(doc, y, 40);
      doc.setTextColor(...dark);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Detail Minuman", 14, y);
      y += 2;
      autoTable(doc, {
        startY: y,
        head: [["Nama Item", "Qty", "Total"]],
        body: minuman.map(i => [i.name, `${i.qty}x`, rp(i.total)]),
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [0, 122, 255], textColor: [255, 255, 255], fontSize: 8 },
        columnStyles: { 1: { halign: "center" }, 2: { halign: "right" } },
        margin: { left: 14, right: 14 },
      });
      y = getLastY(doc, y + 30) + 5;
    }

    const openBill = safeItems(safeRecap?.openBill);
    if (openBill.length > 0) {
      y = checkPage(doc, y, 40);
      doc.setTextColor(...dark);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Open Bill Pending", 14, y);
      y += 2;
      autoTable(doc, {
        startY: y,
        head: [["Nama Item", "Qty", "Total"]],
        body: openBill.map(i => [i.name, `${i.qty}x`, rp(i.total)]),
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [255, 171, 0], textColor: [255, 255, 255], fontSize: 8 },
        columnStyles: { 1: { halign: "center" }, 2: { halign: "right" } },
        margin: { left: 14, right: 14 },
      });
      y = getLastY(doc, y + 30) + 5;
    }

    // Notes — split per baris dan tambah halaman jika perlu
    if (report.notes) {
      y = checkPage(doc, y, 20);
      doc.setTextColor(...dark);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Catatan:", 14, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...grey);

      const lines = doc.splitTextToSize(report.notes, W - 28) as string[];
      for (const line of lines) {
        y = checkPage(doc, y, 6);
        doc.text(line, 14, y);
        y += 4.5;
      }
    }

    // Footer setiap halaman
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(...grey);
      doc.text(`ngehnoom · Yang Nyaman Jadi Sayang`, 14, PAGE_H - 8);
      doc.text(`Halaman ${i} dari ${pageCount}`, W - 14, PAGE_H - 8, { align: "right" });
    }

    const kasirSlug = safeStr(report.kasirName).replace(/\s+/g, "-") || "kasir";
    const dateSlug = report.reportDate || new Date().toISOString().split("T")[0];
    const filename = `laporan-shift-${kasirSlug}-${dateSlug}.pdf`;
    doc.save(filename);
    return true;
  } catch (err) {
    console.error("[generateShiftPDF] Gagal membuat PDF:", err);
    return false;
  }
}
