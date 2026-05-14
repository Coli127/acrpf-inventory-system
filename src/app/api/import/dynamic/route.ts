import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length === 0) {
      return NextResponse.json({ error: "Empty file" }, { status: 400 });
    }

    const headers = jsonData[0] as string[];
    const rows = (jsonData.slice(1) as unknown[][]).filter((row) => 
      row.some((cell) => cell !== undefined && cell !== null && cell !== "")
    );

    return NextResponse.json({
      headers,
      rows,
      sheetName,
      totalRows: rows.length,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "An unexpected error occurred" }, { status: 500 });
  }
}
