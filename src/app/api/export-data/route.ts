import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const TABLES = [
  "bricks_inventory", "customers", "journal_entries", "schedules",
  "activity_log", "notifications", "products", "profiles",
  "purchase_orders", "purchase_order_items",
];

export async function GET() {
  try {
    const supabase = createAdminClient();
    let sql = "-- ACRPF INVENTORY SYSTEM - Data Export\n-- Generated: " + new Date().toISOString() + "\n\n";

    for (const table of TABLES) {
      const { data, error } = await supabase.from(table).select("*");
      if (error) {
        sql += "-- " + table + ": ERROR - " + error.message + "\n\n";
        continue;
      }
      if (!data || data.length === 0) {
        sql += "-- " + table + ": (no data)\n\n";
        continue;
      }
      sql += "-- " + table + " (" + data.length + " rows)\n";
      for (const row of data) {
        const keys = Object.keys(row).filter(k => row[k] !== null);
        const cols = keys.join(", ");
        const vals = keys.map(k => {
          const v = row[k];
          if (typeof v === "string") return "'" + v.replace(/'/g, "''") + "'";
          if (v === null || v === undefined) return "NULL";
          if (typeof v === "object") return "'" + JSON.stringify(v).replace(/'/g, "''") + "'";
          return String(v);
        }).join(", ");
        sql += "INSERT INTO " + table + " (" + cols + ") VALUES (" + vals + ");\n";
      }
      sql += "\n";
    }

    return new NextResponse(sql, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": 'attachment; filename="acrpf-data.sql"',
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
