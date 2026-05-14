import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { headers, rows, tableName } = body;

    if (!headers || !rows || !tableName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createClient();

    const mappedRows = rows.map((row: unknown[]) => {
      const obj: Record<string, unknown> = {};
      headers.forEach((header: string, index: number) => {
        obj[header] = row[index] ?? null;
      });
      return obj;
    });

    const { error } = await supabase
      .from(tableName)
      .insert(mappedRows);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Imported ${mappedRows.length} rows to ${tableName}` 
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "An unexpected error occurred" }, { status: 500 });
  }
}
