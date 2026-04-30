"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Package } from "lucide-react";

interface BricksEntry {
  id: string;
  date: string;
  year: number | null;
  newly_printed: number | null;
  bricks_in_kiln: number | null;
  reclaimed_newly_printed: number | null;
  reclaimed_air_dried: number | null;
  deployed_delivered: number | null;
  total_fired: number | null;
  overall_total: number | null;
  remarks: string | null;
}

export default function BricksPage() {
  const [entries, setEntries] = useState<BricksEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const formatDate = (dateStr: string | null | undefined): string => {
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("bricks_inventory")
          .select("*")
          .order("date", { ascending: false });
        if (error) throw error;
        if (data) setEntries(data as unknown as BricksEntry[]);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [supabase]);

  const data2025 = entries.filter((e) => e.year === 2025);
  const data2026 = entries.filter((e) => e.year === 2026);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bricks Inventory"
        description={`${entries.length} records (2025: ${data2025.length}, 2026: ${data2026.length})`}
        icon={Package}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">2025 Records</p>
                <p className="text-xl font-bold">{data2025.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">2026 Records</p>
                <p className="text-xl font-bold">{data2026.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Bricks</p>
                <p className="text-xl font-bold">
                  {(data2025.reduce((sum, e) => sum + (e.overall_total || 0), 0) + data2026.reduce((sum, e) => sum + (e.overall_total || 0), 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Newly Printed</TableHead>
                  <TableHead className="text-right">In Kiln</TableHead>
                  <TableHead className="text-right">Reclaimed</TableHead>
                  <TableHead className="text-right">Deployed</TableHead>
                  <TableHead className="text-right">Total Fired</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-32 text-muted-foreground">
                      No brick records found. Import from Excel file.
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.slice(0, 50).map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {formatDate(entry.date)}
                        {entry.year && (
                          <span className={`ml-2 text-xs ${entry.year === 2025 ? "text-amber-500" : "text-emerald-500"}`}>
                            ({entry.year})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{entry.newly_printed ?? "-"}</TableCell>
                      <TableCell className="text-right">{entry.bricks_in_kiln ?? "-"}</TableCell>
                      <TableCell className="text-right">
                        {(entry.reclaimed_newly_printed || 0) + (entry.reclaimed_air_dried || 0)}
                      </TableCell>
                      <TableCell className="text-right">{entry.deployed_delivered ?? "-"}</TableCell>
                      <TableCell className="text-right">{entry.total_fired ?? "-"}</TableCell>
                      <TableCell className="text-right font-semibold">{entry.overall_total ?? "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">{entry.remarks || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}