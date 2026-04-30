"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, BookOpen } from "lucide-react";

interface JournalEntry {
  id: string;
  date: string;
  available_taguibo_clay_bags: number | null;
  available_calapagan_clay_kg: number | null;
  available_fine_sand_kg: number | null;
  soaked_clay_for_day_kg: number | null;
  total_soaked_clay_mixture_kg: number | null;
  prepared_rtp_mix_for_day_kg: number | null;
  reclaimed_rtp_mix_kg: number | null;
  total_available_remaining_rtp_mix_kg: number | null;
  used_rtp_mix_kg: number | null;
  total_remaining_rtp_mix_kg: number | null;
  target_soaked_clay_mixture_kg: number | null;
  target_prepared_clay_mixture_kg: number | null;
  remarks: string | null;
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
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
          .from("journal_entries")
          .select("*")
          .order("date", { ascending: false });
        if (error) throw error;
        if (data) setEntries(data as unknown as JournalEntry[]);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [supabase]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Journal"
        description={`${entries.length} clay inventory entries`}
        icon={BookOpen}
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Clay Bags</TableHead>
                  <TableHead className="text-right">Soaked (kg)</TableHead>
                  <TableHead className="text-right">Prepared (kg)</TableHead>
                  <TableHead className="text-right">Reclaimed (kg)</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                      No journal entries found. Import from Excel file.
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.slice(0, 50).map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{formatDate(entry.date)}</TableCell>
                      <TableCell className="text-right">{entry.available_taguibo_clay_bags ?? "-"}</TableCell>
                      <TableCell className="text-right">{entry.soaked_clay_for_day_kg ?? "-"}</TableCell>
                      <TableCell className="text-right">{entry.prepared_rtp_mix_for_day_kg ?? "-"}</TableCell>
                      <TableCell className="text-right">{entry.reclaimed_rtp_mix_kg ?? "-"}</TableCell>
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