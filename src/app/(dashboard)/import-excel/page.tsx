"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, Loader2, Package, BookOpen, Calendar } from "lucide-react";
import * as XLSX from "xlsx";

export default function ImportExcelPage() {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const supabase = createClient();

  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return "-";
    if (/^\d+$/.test(dateStr)) {
      const num = parseInt(dateStr);
      if (num > 30000) {
        const date = new Date((num - 25569) * 86400 * 1000);
        return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      }
      return dateStr;
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const excelDateToString = (serial: unknown): string => {
    if (!serial) return "__SKIP__";
    if (typeof serial === "string") {
      const str = serial.trim().toLowerCase();
      if (str.includes("total") || str === "0" || /^[a-zA-Z]+$/.test(str)) return "__SKIP__";
      if (/^\d{4}-\d{2}-\d{2}$/.test(serial.trim())) return serial.trim();
      return serial.trim();
    }
    if (typeof serial === "number") {
      if (serial > 50000) {
        const date = XLSX.SSF.parse_date_code(serial);
        if (!date || !date.y) return "__SKIP__";
        return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
      }
      return "__SKIP__";
    }
    return "__SKIP__";
  };

  const parseNumeric = (val: unknown): number | null => {
    if (val === null || val === undefined || val === "") return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  };

  const importBricks = async () => {
    setImporting("bricks");
    try {
      const { data: existing } = await supabase.from("bricks_inventory").select("date");
      const existingDates = new Set(existing?.map((e) => e.date.trim().toLowerCase()) || []);

      const response = await fetch("/ACR Production Facility Schedule and Journal_hshs.xlsx");
      const buffer = await response.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });

      const entries: Record<string, unknown>[] = [];

      // 2026 Bricks
      const sheet2026 = workbook.Sheets["2026 v. INVENTORY OF BRICKS"];
      if (sheet2026) {
        const data = XLSX.utils.sheet_to_json(sheet2026, { header: 1 }) as unknown[][];
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row[0]) continue;
          const date = excelDateToString(row[0]);
          if (date === "__SKIP__") continue;
          if (existingDates.has(date.toLowerCase())) continue;

          entries.push({
            date,
            year: 2026,
            newly_printed: parseNumeric(row[1]),
            bricks_in_kiln: parseNumeric(row[2]),
            reclaimed_newly_printed: parseNumeric(row[3]),
            reclaimed_air_dried: parseNumeric(row[4]),
            deployed_delivered: parseNumeric(row[5]),
            bricks_with_cracks: parseNumeric(row[6]),
            total_air_dried: parseNumeric(row[7]),
            actual_count: parseNumeric(row[8]),
            total_fired: parseNumeric(row[9]),
            overall_total: parseNumeric(row[10]),
            remarks: row[11] ? String(row[11]) : null,
            deficit: parseNumeric(row[12]),
          });
        }
      }

      // 2025 Bricks
      const sheet2025 = workbook.Sheets["2025 v. INVENTORY OF BRICKS"];
      if (sheet2025) {
        const data = XLSX.utils.sheet_to_json(sheet2025, { header: 1 }) as unknown[][];
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row[0]) continue;
          const date = excelDateToString(row[0]);
          if (date === "__SKIP__") continue;
          if (existingDates.has(date.toLowerCase())) continue;

          entries.push({
            date,
            year: 2025,
            newly_printed: parseNumeric(row[1]),
            bricks_in_kiln: parseNumeric(row[3]),
            reclaimed_newly_printed: parseNumeric(row[5]),
            reclaimed_air_dried: parseNumeric(row[6]),
            deployed_delivered: parseNumeric(row[8]),
            bricks_with_cracks: null,
            total_air_dried: parseNumeric(row[2]),
            actual_count: parseNumeric(row[10]),
            total_fired: parseNumeric(row[4]),
            overall_total: parseNumeric(row[12]),
            remarks: row[13] ? String(row[13]) : null,
            deficit: parseNumeric(row[14]),
          });
        }
      }

      if (entries.length > 0) {
        const { error } = await supabase.from("bricks_inventory").insert(entries);
        if (error) throw error;
      }

      toast.success(`${entries.length} bricks imported`);
    } catch (error: unknown) {
      toast.error((error as Error).message);
    } finally {
      setImporting(null);
    }
  };

  const importJournal = async () => {
    setImporting("journal");
    try {
      const { data: existing } = await supabase.from("journal_entries").select("date");
      const existingDates = new Set(existing?.map((e) => e.date.trim().toLowerCase()) || []);

      const response = await fetch("/ACR Production Facility Schedule and Journal_hshs.xlsx");
      const buffer = await response.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });

      const sheet = workbook.Sheets["2026 v. INVENTORY FOR CLAY MIXT"];
      if (!sheet) {
        toast.error("Sheet not found");
        return;
      }

      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
      const entries: Record<string, unknown>[] = [];

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[0]) continue;

        const date = excelDateToString(row[0]);
        if (date === "__SKIP__") continue;
        if (existingDates.has(date.toLowerCase())) continue;

        entries.push({
          date,
          available_taguibo_clay_bags: parseNumeric(row[1]),
          available_calapagan_clay_kg: parseNumeric(row[2]),
          available_fine_sand_kg: parseNumeric(row[3]),
          soaked_clay_for_day_kg: parseNumeric(row[4]),
          total_soaked_clay_mixture_kg: parseNumeric(row[5]),
          prepared_rtp_mix_for_day_kg: parseNumeric(row[6]),
          reclaimed_rtp_mix_kg: parseNumeric(row[7]),
          total_available_remaining_rtp_mix_kg: parseNumeric(row[8]),
          used_rtp_mix_kg: parseNumeric(row[9]),
          total_remaining_rtp_mix_kg: parseNumeric(row[10]),
          target_soaked_clay_mixture_kg: parseNumeric(row[11]),
          target_prepared_clay_mixture_kg: parseNumeric(row[12]),
          remarks: row[13] ? String(row[13]) : null,
        });
      }

      if (entries.length > 0) {
        const { error } = await supabase.from("journal_entries").insert(entries);
        if (error) throw error;
      }

      toast.success(`${entries.length} journal entries imported`);
    } catch (error: unknown) {
      toast.error((error as Error).message);
    } finally {
      setImporting(null);
    }
  };

  const importSchedule = async () => {
    setImporting("schedule");
    try {
      const response = await fetch("/ACR Production Facility Schedule and Journal_hshs.xlsx");
      const buffer = await response.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });

      const sheet = workbook.Sheets["SCHEDULE OF ACTIVITIES"];
      if (!sheet) {
        toast.error("Sheet not found");
        return;
      }

      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
      const entries: Record<string, unknown>[] = [];

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[0]) continue;

        const task = String(row[0]).trim();
        if (!task || task.toLowerCase().includes("total")) continue;

        entries.push({
          task,
          monday: row[1] ? String(row[1]) : null,
          tuesday: row[2] ? String(row[2]) : null,
          wednesday: row[3] ? String(row[3]) : null,
          thursday: row[4] ? String(row[4]) : null,
          friday: row[5] ? String(row[5]) : null,
          target: row[6] ? String(row[6]) : null,
          remarks: row[7] ? String(row[7]) : null,
        });
      }

      if (entries.length > 0) {
        const { error } = await supabase.from("schedules").insert(entries);
        if (error) throw error;
      }

      toast.success(`${entries.length} schedules imported`);
    } catch (error: unknown) {
      toast.error((error as Error).message);
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Excel"
        description="Import data from ACR Production Facility Excel file"
        icon={Upload}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:bg-accent/50" onClick={importing ? undefined : importBricks}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                {importing === "bricks" ? (
                  <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                ) : (
                  <Package className="h-6 w-6 text-amber-500" />
                )}
              </div>
              <div>
                <p className="font-medium">Bricks Inventory</p>
                <p className="text-sm text-muted-foreground">Import bricks data (2025 & 2026)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent/50" onClick={importing ? undefined : importJournal}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                {importing === "journal" ? (
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                ) : (
                  <BookOpen className="h-6 w-6 text-blue-500" />
                )}
              </div>
              <div>
                <p className="font-medium">Daily Journal</p>
                <p className="text-sm text-muted-foreground">Import clay inventory journal</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent/50" onClick={importing ? undefined : importSchedule}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                {importing === "schedule" ? (
                  <Loader2 className="h-6 w-6 animate-spin text-green-500" />
                ) : (
                  <Calendar className="h-6 w-6 text-green-500" />
                )}
              </div>
              <div>
                <p className="font-medium">Schedule</p>
                <p className="text-sm text-muted-foreground">Import task schedules</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Source: ACR Production Facility Schedule and Journal_hshs.xlsx
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}