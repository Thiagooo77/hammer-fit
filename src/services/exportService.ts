import { supabase } from "@/integrations/supabase/client";
import pkg from "file-saver";
const { saveAs } = pkg;
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const exportService = {
  async toCSV(data: any[], filename: string) {
    const replacer = (key: string, value: any) => (value === null ? "" : value);
    const header = Object.keys(data[0]);
    const csv = [
      header.join(","),
      ...data.map((row) =>
        header
          .map((fieldName) => JSON.stringify(row[fieldName], replacer))
          .join(",")
      ),
    ].join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${filename}.csv`);
  },

  async toExcel(data: any[], filename: string) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    saveAs(blob, `${filename}.xlsx`);
  },

  async toPDF(data: any[], filename: string, title: string) {
    const doc = new jsPDF();
    doc.text(title, 14, 15);
    
    const headers = Object.keys(data[0]);
    const body = data.map(obj => Object.values(obj)) as any[][];

    autoTable(doc, {
      head: [headers],
      body: body,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [179, 114, 45] }
    });

    doc.save(`${filename}.pdf`);
  }
};
