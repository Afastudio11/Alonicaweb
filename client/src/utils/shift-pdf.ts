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

function rp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function fmtDt(d: string | Date) {
  return new Date(d).toLocaleString("id-ID", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtDate(d: string) {
  if (!d) return "-";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export function generateShiftPDF(report: ShiftReportData, recap: RecapData | null | undefined) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const orange = [255, 149, 0] as [number, number, number];
  const dark = [29, 29, 31] as [number, number, number];
  const grey = [110, 110, 115] as [number, number, number];

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
    ["Kasir", report.kasirName],
    ["Cabang", report.branchName || "-"],
    ["Mulai Shift", fmtDt(report.shiftStart)],
    ["Selesai Shift", fmtDt(report.shiftEnd)],
    ["Total Transaksi", `${report.totalOrders ?? 0} pesanan`],
  ];

  infoRows.forEach(([label, val]) => {
    doc.setTextColor(...grey);
    doc.text(label + ":", 14, y);
    doc.setTextColor(...dark);
    doc.text(val, 60, y);
    y += 5;
  });

  y += 3;

  // Summary table
  doc.setTextColor(...dark);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Ringkasan Penjualan", 14, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    head: [["Keterangan", "Jumlah"]],
    body: [
      ["Total Terbayar", rp(report.totalPaid ?? 0)],
      ["Penjualan Makanan", rp(report.totalMakanan ?? 0)],
      ["Penjualan Minuman", rp(report.totalMinuman ?? 0)],
      ["Open Bill Pending (belum lunas)", rp(report.totalOpenBillPending ?? 0)],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: orange, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
    columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // Kas detail table
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
      ["Kas Awal", rp(report.initialCash ?? 0)],
      ["Kas Tercatat Sistem", rp(report.systemCash ?? 0)],
      ["Kas Fisik Dihitung", rp(report.finalCash ?? 0)],
      ["Selisih Kas", diffStr],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [70, 70, 80], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
    columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
    bodyStyles: {},
    didDrawCell: (data) => {
      if (data.row.index === 3 && data.column.index === 1 && data.section === "body") {
        const cell = data.cell;
        doc.setTextColor(diff > 0 ? 22 : diff < 0 ? 200 : 29, diff > 0 ? 163 : diff < 0 ? 40 : 29, diff > 0 ? 74 : diff < 0 ? 40 : 31);
      }
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // Item breakdowns
  if (recap) {
    if (recap.makanan && recap.makanan.length > 0) {
      doc.setTextColor(...dark);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Detail Makanan", 14, y);
      y += 2;
      autoTable(doc, {
        startY: y,
        head: [["Nama Item", "Qty", "Total"]],
        body: recap.makanan.map(i => [i.name, `${i.qty}x`, rp(i.total)]),
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [255, 149, 0], textColor: [255, 255, 255], fontSize: 8 },
        columnStyles: { 1: { halign: "center" }, 2: { halign: "right" } },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 5;
    }

    if (recap.minuman && recap.minuman.length > 0) {
      doc.setTextColor(...dark);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Detail Minuman", 14, y);
      y += 2;
      autoTable(doc, {
        startY: y,
        head: [["Nama Item", "Qty", "Total"]],
        body: recap.minuman.map(i => [i.name, `${i.qty}x`, rp(i.total)]),
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [0, 122, 255], textColor: [255, 255, 255], fontSize: 8 },
        columnStyles: { 1: { halign: "center" }, 2: { halign: "right" } },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 5;
    }

    if (recap.openBill && recap.openBill.length > 0) {
      doc.setTextColor(...dark);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Open Bill Pending", 14, y);
      y += 2;
      autoTable(doc, {
        startY: y,
        head: [["Nama Item", "Qty", "Total"]],
        body: recap.openBill.map(i => [i.name, `${i.qty}x`, rp(i.total)]),
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [255, 171, 0], textColor: [255, 255, 255], fontSize: 8 },
        columnStyles: { 1: { halign: "center" }, 2: { halign: "right" } },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 5;
    }
  }

  // Notes
  if (report.notes) {
    doc.setTextColor(...dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Catatan:", 14, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grey);
    y += 4;
    const lines = doc.splitTextToSize(report.notes, W - 28);
    doc.text(lines, 14, y);
    y += lines.length * 4.5;
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...grey);
    doc.text(`ngehnoom · Yang Nyaman Jadi Sayang`, 14, doc.internal.pageSize.getHeight() - 8);
    doc.text(`Halaman ${i} dari ${pageCount}`, W - 14, doc.internal.pageSize.getHeight() - 8, { align: "right" });
  }

  const filename = `laporan-shift-${report.kasirName.replace(/\s+/g, "-")}-${report.reportDate}.pdf`;
  doc.save(filename);
}
