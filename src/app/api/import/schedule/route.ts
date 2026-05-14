import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const sheetName = formData.get("sheet") as string || "";

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: "array" });

    let sheet;
    let usedSheetName = sheetName;

    if (usedSheetName) {
      sheet = workbook.Sheets[usedSheetName];
      if (!sheet) {
        return NextResponse.json({ error: `Sheet "${usedSheetName}" not found.` }, { status: 400 });
      }
    } else {
      const preferred = workbook.SheetNames.find((s) => s.toLowerCase().includes("schedule"));
      if (preferred) {
        sheet = workbook.Sheets[preferred];
        usedSheetName = preferred;
      } else {
        usedSheetName = workbook.SheetNames[0];
        sheet = workbook.Sheets[usedSheetName];
      }
    }

    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
    const supabase = await createClient();

    const entries: Record<string, unknown>[] = [];

    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const task = row[0] ? String(row[0]).trim() : "";
      if (!task || task.toLowerCase().includes("task") || task.startsWith("[")) continue;
      if (row[1] === "MONDAY" || row[1] === "Assign Per Day") continue;

      entries.push({
        task,
        monday: row[1] ? String(row[1]).trim() : null,
        tuesday: row[2] ? String(row[2]).trim() : null,
        wednesday: row[3] ? String(row[3]).trim() : null,
        thursday: row[4] ? String(row[4]).trim() : null,
        friday: row[5] ? String(row[5]).trim() : null,
        target: row[6] ? String(row[6]).trim() : null,
        remarks: row[7] ? String(row[7]).trim() : null,
      });
    }

    if (entries.length === 0) {
      return NextResponse.json({ message: "No schedule data found to import" });
    }

    const { error } = await supabase.from("schedules").insert(entries);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      success: true,
      imported: entries.length,
      sheet: usedSheetName,
      message: `Imported ${entries.length} schedule tasks from "${usedSheetName}"`,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "An unexpected error occurred" }, { status: 500 });
  }
}
