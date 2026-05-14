import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";

function excelDateToString(serial: unknown): string | null {
  if (!serial) return null;
  if (typeof serial === "string") {
    const str = serial.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    return str;
  }
  if (typeof serial === "number" && serial > 50000) {
    const date = XLSX.SSF.parse_date_code(serial);
    if (!date || !date.y) return null;
    return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
  }
  return null;
}

function parseNum(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const sheetName = formData.get("sheet") as string || "2026 v. INVENTORY OF BRICKS";

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: "array" });
    
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      return NextResponse.json({ error: `Sheet "${sheetName}" not found. Available: ${workbook.SheetNames.join(", ")}` }, { status: 400 });
    }

    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
    const supabase = await createClient();

    // Get existing dates to avoid duplicates
    const { data: existing } = await supabase.from("bricks_inventory").select("date");
    const existingDates = new Set(existing?.map((e) => e.date.trim().toLowerCase()) || []);

    const entries: Record<string, unknown>[] = [];
    
    // Sheet has 13 columns: Date, Newly Printed, Bricks in Kiln, Reclaimed Newly Printed, Reclaimed Air Dried, Deployed/Delivered, Bricks with Cracks, Total Air Dried, Actual Count, Total Fired, Overall Total, Remarks, Deficit
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      const date = excelDateToString(row[0]);
      if (!date || date === "__SKIP__") continue;
      if (existingDates.has(date.toLowerCase())) continue;

      // Skip text rows
      const dateStr = String(row[0]).toLowerCase();
      if (dateStr.includes("total") || dateStr.includes("week")) continue;

      entries.push({
        date,
        year: date.split("-")[0],
        newly_printed: parseNum(row[1]) || 0,
        bricks_in_kiln: parseNum(row[2]) || 0,
        reclaimed_newly_printed: parseNum(row[3]) || 0,
        reclaimed_air_dried: parseNum(row[4]) || 0,
        deployed_delivered: parseNum(row[5]) || 0,
        bricks_with_cracks: parseNum(row[6]) || 0,
        total_air_dried: parseNum(row[7]) || 0,
        actual_count: parseNum(row[8]) || 0,
        total_fired: parseNum(row[9]) || 0,
        overall_total: parseNum(row[10]) || 0,
        remarks: row[11] ? String(row[11]) : null,
        deficit: parseNum(row[12]) || 0,
      });
    }

    if (entries.length === 0) {
      return NextResponse.json({ message: "No new data to import" });
    }

    const { error } = await supabase.from("bricks_inventory").insert(entries);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ 
      success: true, 
      imported: entries.length,
      message: `Successfully imported ${entries.length} rows to bricks inventory` 
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "An unexpected error occurred" }, { status: 500 });
  }
}
