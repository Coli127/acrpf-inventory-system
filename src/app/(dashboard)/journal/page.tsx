"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, BookOpen, Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

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
  const [expanded, setExpanded] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    available_taguibo_clay_bags: "",
    available_calapagan_clay_kg: "",
    available_fine_sand_kg: "",
    soaked_clay_for_day_kg: "",
    total_soaked_clay_mixture_kg: "",
    prepared_rtp_mix_for_day_kg: "",
    reclaimed_rtp_mix_kg: "",
    total_available_remaining_rtp_mix_kg: "",
    used_rtp_mix_kg: "",
    total_remaining_rtp_mix_kg: "",
    target_soaked_clay_mixture_kg: "",
    target_prepared_clay_mixture_kg: "",
    remarks: "",
  });

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

  useEffect(() => { fetchData(); }, [supabase]);

  const openAddDialog = () => {
    setEditingEntry(null);
    setForm({
      date: new Date().toISOString().split("T")[0],
      available_taguibo_clay_bags: "",
      available_calapagan_clay_kg: "",
      available_fine_sand_kg: "",
      soaked_clay_for_day_kg: "",
      total_soaked_clay_mixture_kg: "",
      prepared_rtp_mix_for_day_kg: "",
      reclaimed_rtp_mix_kg: "",
      total_available_remaining_rtp_mix_kg: "",
      used_rtp_mix_kg: "",
      total_remaining_rtp_mix_kg: "",
      target_soaked_clay_mixture_kg: "",
      target_prepared_clay_mixture_kg: "",
      remarks: "",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setForm({
      date: entry.date.includes("-") ? entry.date : new Date((parseInt(entry.date) - 25569) * 86400 * 1000).toISOString().split("T")[0],
      available_taguibo_clay_bags: entry.available_taguibo_clay_bags?.toString() || "",
      available_calapagan_clay_kg: entry.available_calapagan_clay_kg?.toString() || "",
      available_fine_sand_kg: entry.available_fine_sand_kg?.toString() || "",
      soaked_clay_for_day_kg: entry.soaked_clay_for_day_kg?.toString() || "",
      total_soaked_clay_mixture_kg: entry.total_soaked_clay_mixture_kg?.toString() || "",
      prepared_rtp_mix_for_day_kg: entry.prepared_rtp_mix_for_day_kg?.toString() || "",
      reclaimed_rtp_mix_kg: entry.reclaimed_rtp_mix_kg?.toString() || "",
      total_available_remaining_rtp_mix_kg: entry.total_available_remaining_rtp_mix_kg?.toString() || "",
      used_rtp_mix_kg: entry.used_rtp_mix_kg?.toString() || "",
      total_remaining_rtp_mix_kg: entry.total_remaining_rtp_mix_kg?.toString() || "",
      target_soaked_clay_mixture_kg: entry.target_soaked_clay_mixture_kg?.toString() || "",
      target_prepared_clay_mixture_kg: entry.target_prepared_clay_mixture_kg?.toString() || "",
      remarks: entry.remarks || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.date) { toast.error("Date is required"); return; }
    setSaving(true);

    try {
      const entry = {
        date: form.date,
        available_taguibo_clay_bags: parseInt(form.available_taguibo_clay_bags) || null,
        available_calapagan_clay_kg: parseInt(form.available_calapagan_clay_kg) || null,
        available_fine_sand_kg: parseInt(form.available_fine_sand_kg) || null,
        soaked_clay_for_day_kg: parseInt(form.soaked_clay_for_day_kg) || null,
        total_soaked_clay_mixture_kg: parseInt(form.total_soaked_clay_mixture_kg) || null,
        prepared_rtp_mix_for_day_kg: parseInt(form.prepared_rtp_mix_for_day_kg) || null,
        reclaimed_rtp_mix_kg: parseInt(form.reclaimed_rtp_mix_kg) || null,
        total_available_remaining_rtp_mix_kg: parseInt(form.total_available_remaining_rtp_mix_kg) || null,
        used_rtp_mix_kg: parseInt(form.used_rtp_mix_kg) || null,
        total_remaining_rtp_mix_kg: parseInt(form.total_remaining_rtp_mix_kg) || null,
        target_soaked_clay_mixture_kg: parseInt(form.target_soaked_clay_mixture_kg) || null,
        target_prepared_clay_mixture_kg: parseInt(form.target_prepared_clay_mixture_kg) || null,
        remarks: form.remarks || null,
      };

      if (editingEntry) {
        const { error } = await supabase.from("journal_entries").update(entry).eq("id", editingEntry.id);
        if (error) throw error;
        toast.success("Entry updated!");
      } else {
        const { error } = await supabase.from("journal_entries").insert(entry);
        if (error) throw error;
        toast.success("Entry added!");
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    try {
      const { error } = await supabase.from("journal_entries").delete().eq("id", id);
      if (error) throw error;
      toast.success("Entry deleted!");
      fetchData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
    }
  };

  const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
  const paginated = entries.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Journal"
        description={`${entries.length} clay inventory entries`}
        icon={BookOpen}
      >
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Entry
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <button
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Clay Inventory Entries</h3>
                <p className="text-sm text-muted-foreground">{entries.length} entries</p>
              </div>
            </div>
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {expanded && (
            <div className="border-t bg-white dark:bg-zinc-950">
              <Table className="min-w-[1800px]">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="border border-border text-center font-bold sticky left-0 bg-muted/50 z-10 min-w-[120px]">Date</TableHead>
                    <TableHead className="border border-border text-center font-bold min-w-[130px]">Taguibo Clay (bags)</TableHead>
                    <TableHead className="border border-border text-center font-bold min-w-[140px]">Calapagan Clay (kg)</TableHead>
                    <TableHead className="border border-border text-center font-bold min-w-[130px]">Fine Sand (kg)</TableHead>
                    <TableHead className="border border-border text-center font-bold min-w-[140px]">Soaked Clay (kg)</TableHead>
                    <TableHead className="border border-border text-center font-bold min-w-[150px]">Total Soaked (kg)</TableHead>
                    <TableHead className="border border-border text-center font-bold min-w-[150px]">RTP Mix (kg)</TableHead>
                    <TableHead className="border border-border text-center font-bold min-w-[140px]">Reclaimed (kg)</TableHead>
                    <TableHead className="border border-border text-center font-bold min-w-[170px]">Avail Remaining (kg)</TableHead>
                    <TableHead className="border border-border text-center font-bold min-w-[130px]">Used (kg)</TableHead>
                    <TableHead className="border border-border text-center font-bold min-w-[150px]">Remaining (kg)</TableHead>
                    <TableHead className="border border-border text-center font-bold min-w-[160px]">Target Soaked (kg)</TableHead>
                    <TableHead className="border border-border text-center font-bold min-w-[170px]">Target Prepared (kg)</TableHead>
                    <TableHead className="border border-border text-center font-bold min-w-[150px]">Remarks</TableHead>
                    <TableHead className="border border-border text-center font-bold sticky right-0 bg-muted/50 z-10 min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={15} className="text-center h-32 border border-border">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={15} className="text-center h-32 text-muted-foreground border border-border">
                        No journal entries found. Import from Excel file.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((entry, index) => (
                      <TableRow key={entry.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                        <TableCell className="border border-border font-medium sticky left-0 bg-inherit z-10">{formatDate(entry.date)}</TableCell>
                        <TableCell className="border border-border text-right tabular-nums">{entry.available_taguibo_clay_bags?.toLocaleString() ?? "-"}</TableCell>
                        <TableCell className="border border-border text-right tabular-nums">{entry.available_calapagan_clay_kg?.toLocaleString() ?? "-"}</TableCell>
                        <TableCell className="border border-border text-right tabular-nums">{entry.available_fine_sand_kg?.toLocaleString() ?? "-"}</TableCell>
                        <TableCell className="border border-border text-right tabular-nums">{entry.soaked_clay_for_day_kg?.toLocaleString() ?? "-"}</TableCell>
                        <TableCell className="border border-border text-right tabular-nums">{entry.total_soaked_clay_mixture_kg?.toLocaleString() ?? "-"}</TableCell>
                        <TableCell className="border border-border text-right tabular-nums">{entry.prepared_rtp_mix_for_day_kg?.toLocaleString() ?? "-"}</TableCell>
                        <TableCell className="border border-border text-right tabular-nums">{entry.reclaimed_rtp_mix_kg?.toLocaleString() ?? "-"}</TableCell>
                        <TableCell className="border border-border text-right tabular-nums">{entry.total_available_remaining_rtp_mix_kg?.toLocaleString() ?? "-"}</TableCell>
                        <TableCell className="border border-border text-right tabular-nums">{entry.used_rtp_mix_kg?.toLocaleString() ?? "-"}</TableCell>
                        <TableCell className="border border-border text-right tabular-nums">{entry.total_remaining_rtp_mix_kg?.toLocaleString() ?? "-"}</TableCell>
                        <TableCell className="border border-border text-right tabular-nums">{entry.target_soaked_clay_mixture_kg?.toLocaleString() ?? "-"}</TableCell>
                        <TableCell className="border border-border text-right tabular-nums">{entry.target_prepared_clay_mixture_kg?.toLocaleString() ?? "-"}</TableCell>
                        <TableCell className="border border-border text-sm min-w-[150px] max-w-[250px] truncate">{entry.remarks || "-"}</TableCell>
                        <TableCell className="border border-border sticky right-0 bg-inherit z-10">
                          <div className="flex gap-1 justify-center">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(entry)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(entry.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
                  <span className="text-sm text-muted-foreground">Page {page} of {totalPages} ({entries.length} total)</span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Edit Entry" : "Add New Entry"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2"><Label>Date *</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div className="space-y-2"><Label>Taguibo Clay (bags)</Label><Input type="number" value={form.available_taguibo_clay_bags} onChange={(e) => setForm({ ...form, available_taguibo_clay_bags: e.target.value })} /></div>
            <div className="space-y-2"><Label>Calapagan Clay (kg)</Label><Input type="number" value={form.available_calapagan_clay_kg} onChange={(e) => setForm({ ...form, available_calapagan_clay_kg: e.target.value })} /></div>
            <div className="space-y-2"><Label>Fine Sand (kg)</Label><Input type="number" value={form.available_fine_sand_kg} onChange={(e) => setForm({ ...form, available_fine_sand_kg: e.target.value })} /></div>
            <div className="space-y-2"><Label>Soaked Clay for Day (kg)</Label><Input type="number" value={form.soaked_clay_for_day_kg} onChange={(e) => setForm({ ...form, soaked_clay_for_day_kg: e.target.value })} /></div>
            <div className="space-y-2"><Label>Total Soaked Clay Mixture (kg)</Label><Input type="number" value={form.total_soaked_clay_mixture_kg} onChange={(e) => setForm({ ...form, total_soaked_clay_mixture_kg: e.target.value })} /></div>
            <div className="space-y-2"><Label>Prepared RTP Mix for Day (kg)</Label><Input type="number" value={form.prepared_rtp_mix_for_day_kg} onChange={(e) => setForm({ ...form, prepared_rtp_mix_for_day_kg: e.target.value })} /></div>
            <div className="space-y-2"><Label>Reclaimed RTP Mix (kg)</Label><Input type="number" value={form.reclaimed_rtp_mix_kg} onChange={(e) => setForm({ ...form, reclaimed_rtp_mix_kg: e.target.value })} /></div>
            <div className="space-y-2"><Label>Total Available Remaining RTP Mix (kg)</Label><Input type="number" value={form.total_available_remaining_rtp_mix_kg} onChange={(e) => setForm({ ...form, total_available_remaining_rtp_mix_kg: e.target.value })} /></div>
            <div className="space-y-2"><Label>Used RTP Mix (kg)</Label><Input type="number" value={form.used_rtp_mix_kg} onChange={(e) => setForm({ ...form, used_rtp_mix_kg: e.target.value })} /></div>
            <div className="space-y-2"><Label>Total Remaining RTP Mix (kg)</Label><Input type="number" value={form.total_remaining_rtp_mix_kg} onChange={(e) => setForm({ ...form, total_remaining_rtp_mix_kg: e.target.value })} /></div>
            <div className="space-y-2"><Label>Target Soaked Clay Mixture (kg)</Label><Input type="number" value={form.target_soaked_clay_mixture_kg} onChange={(e) => setForm({ ...form, target_soaked_clay_mixture_kg: e.target.value })} /></div>
            <div className="space-y-2"><Label>Target Prepared Clay Mixture (kg)</Label><Input type="number" value={form.target_prepared_clay_mixture_kg} onChange={(e) => setForm({ ...form, target_prepared_clay_mixture_kg: e.target.value })} /></div>
            <div className="col-span-3 space-y-2"><Label>Remarks</Label><Textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingEntry ? "Update" : "Add"} Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
