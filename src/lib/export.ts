import jsPDF from "jspdf";
import * as XLSX from "xlsx";

export interface SchoolHeader {
  nama: string;
  alamat: string;
  telepon: string;
  email: string;
  logo?: string;
}

const defaultKop: SchoolHeader = {
  nama: "SEKOLAHKU",
  alamat: "Jl. Pendidikan No. 1, Jakarta",
  telepon: "(021) 1234-5678",
  email: "info@sekolahku.id",
};

function drawKop(doc: jsPDF, kop: SchoolHeader = defaultKop) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(kop.nama, pageWidth / 2, 20, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(kop.alamat, pageWidth / 2, 27, { align: "center" });
  doc.text(`Telp: ${kop.telepon} | Email: ${kop.email}`, pageWidth / 2, 32, { align: "center" });
  doc.setLineWidth(0.5);
  doc.setDrawColor(37, 99, 235);
  doc.line(14, 37, pageWidth - 14, 37);
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
}

export function exportAbsensiPDF(
  records: Array<{ name: string; nis: string; status: string }>,
  kelas: string,
  date: string,
  kop?: SchoolHeader
) {
  const doc = new jsPDF();
  const header = kop || defaultKop;

  drawKop(doc, header);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("LAPORAN ABSENSI SISWA", doc.internal.pageSize.getWidth() / 2, 45, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Kelas: ${kelas}     Tanggal: ${date}`, doc.internal.pageSize.getWidth() / 2, 52, { align: "center" });

  const headers = [["No", "NIS", "Nama", "Status"]];
  const rows = records.map((r, i) => [String(i + 1), r.nis, r.name, r.status]);

  // Simple manual table since jspdf-autotable might not be installed
  let y = 58;
  const colWidths = [15, 35, 80, 40];
  const startX = 14;

  doc.setFontSize(9);
  doc.setFillColor(243, 244, 246);
  doc.rect(startX, y - 5, colWidths.reduce((a, b) => a + b, 0), 7, "F");
  doc.setFont("helvetica", "bold");
  headers[0].forEach((h, i) => {
    const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
    doc.text(h, x + 2, y);
  });
  y += 7;

  doc.setFont("helvetica", "normal");
  rows.forEach((row) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    row.forEach((cell, i) => {
      const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(String(cell), x + 2, y);
    });
    y += 6;
  });

  doc.save(`absensi-${kelas}-${date}.pdf`);
}

export function exportNilaiPDF(
  data: Array<{ name: string; tugas: string; uh: string; praktik: string; uts: string; uas: string; final: string }>,
  kelas: string,
  mapel: string,
  kop?: SchoolHeader
) {
  const doc = new jsPDF({ orientation: "landscape" });
  const header = kop || defaultKop;

  drawKop(doc, header);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("REKAP NILAI SISWA", doc.internal.pageSize.getWidth() / 2, 45, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Kelas: ${kelas}    Mapel: ${mapel}`, doc.internal.pageSize.getWidth() / 2, 52, { align: "center" });

  const colWidths = [10, 65, 22, 22, 22, 22, 22, 28];
  const headers = ["No", "Nama", "Tugas", "UH", "Praktik", "UTS", "UAS", "Akhir"];
  const startX = 10;
  let y = 58;

  doc.setFontSize(8);
  doc.setFillColor(243, 244, 246);
  doc.rect(startX, y - 5, colWidths.reduce((a, b) => a + b, 0), 7, "F");
  doc.setFont("helvetica", "bold");
  headers.forEach((h, i) => {
    const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
    doc.text(h, x + 1, y);
  });
  y += 7;

  doc.setFont("helvetica", "normal");
  data.forEach((row, idx) => {
    if (y > 185) { doc.addPage(); y = 20; }
    const cells = [String(idx + 1), row.name, row.tugas, row.uh, row.praktik, row.uts, row.uas, row.final];
    cells.forEach((cell, i) => {
      const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(String(cell), x + 1, y);
    });
    y += 6;
  });

  doc.save(`rekap-nilai-${kelas}-${mapel}.pdf`);
}

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  sheetName: string = "Sheet1"
) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
