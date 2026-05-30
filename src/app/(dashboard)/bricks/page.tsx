"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Package, Upload, ChevronDown, ChevronRight, Trash2, Plus, Pencil } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface BricksEntry {
  id: string;
  date: string;
  year: number | null;
  newly_printed: number | null;
  bricks_in_kiln: number | null;
  reclaimed_newly_printed: number | null;
  reclaimed_air_dried: number | null;
  deployed_delivered: number | null;
  bricks_with_cracks: number | null;
  total_air_dried: number | null;
  actual_count: number | null;
  total_fired: number | null;
  overall_total: number | null;
  remarks: string | null;
  deficit: number | null;
}

export default function BricksPage() {
  const [entries, setEntries] = useState<BricksEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded2025, setExpanded2025] = useState(false);
  const [expanded2026, setExpanded2026] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BricksEntry | null>(null);
  const [addYear, setAddYear] = useState<number>(2026);
  const [saving, setSaving] = useState(false);
  const [brickPage, setBrickPage] = useState<Record<number, number>>({ 2025: 1, 2026: 1 });
  const pageSize = 10;

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    newly_printed: "",
    bricks_in_kiln: "",
    reclaimed_newly_printed: "",
    reclaimed_air_dried: "",
    deployed_delivered: "",
    bricks_with_cracks: "",
    total_air_dried: "",
    actual_count: "",
    total_fired: "",
    overall_total: "",
    remarks: "",
    deficit: "",
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
      const { data, error } = await supabase.from("bricks_inventory").select("*").order("date", { ascending: false });
      if (error) throw error;
      if (data) setEntries(data as unknown as BricksEntry[]);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [supabase]);

  const data2025 = entries.filter((e) => e.year === 2025);
  const data2026 = entries.filter((e) => e.year === 2026);
  const total2025 = data2025.reduce((sum, e) => sum + (e.overall_total || 0), 0);
  const total2026 = data2026.reduce((sum, e) => sum + (e.overall_total || 0), 0);

  const openAddDialog = (year: number) => {
    setAddYear(year);
    setEditingEntry(null);
    setForm({
      date: `${year}-${new Date().toISOString().slice(5, 10)}`,
      newly_printed: "",
      bricks_in_kiln: "",
      reclaimed_newly_printed: "",
      reclaimed_air_dried: "",
      deployed_delivered: "",
      bricks_with_cracks: "",
      total_air_dried: "",
      actual_count: "",
      total_fired: "",
      overall_total: "",
      remarks: "",
      deficit: "",
    });
    setAddDialogOpen(true);
  };

  const openEditDialog = (entry: BricksEntry) => {
    setEditingEntry(entry);
    setAddYear(entry.year || 2026);
    setForm({
      date: entry.date.includes("-") ? entry.date : new Date((parseInt(entry.date) - 25569) * 86400 * 1000).toISOString().split("T")[0],
      newly_printed: entry.newly_printed?.toString() || "",
      bricks_in_kiln: entry.bricks_in_kiln?.toString() || "",
      reclaimed_newly_printed: entry.reclaimed_newly_printed?.toString() || "",
      reclaimed_air_dried: entry.reclaimed_air_dried?.toString() || "",
      deployed_delivered: entry.deployed_delivered?.toString() || "",
      bricks_with_cracks: entry.bricks_with_cracks?.toString() || "",
      total_air_dried: entry.total_air_dried?.toString() || "",
      actual_count: entry.actual_count?.toString() || "",
      total_fired: entry.total_fired?.toString() || "",
      overall_total: entry.overall_total?.toString() || "",
      remarks: entry.remarks || "",
      deficit: entry.deficit?.toString() || "",
    });
    setAddDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.date) { toast.error("Date is required"); return; }
    setSaving(true);
    try {
      const payload = {
        date: form.date,
        year: addYear,
        newly_printed: parseInt(form.newly_printed) || 0,
        bricks_in_kiln: parseInt(form.bricks_in_kiln) || 0,
        reclaimed_newly_printed: parseInt(form.reclaimed_newly_printed) || 0,
        reclaimed_air_dried: parseInt(form.reclaimed_air_dried) || 0,
        deployed_delivered: parseInt(form.deployed_delivered) || 0,
        bricks_with_cracks: parseInt(form.bricks_with_cracks) || null,
        total_air_dried: parseInt(form.total_air_dried) || null,
        actual_count: parseInt(form.actual_count) || null,
        total_fired: parseInt(form.total_fired) || 0,
        overall_total: parseInt(form.overall_total) || 0,
        remarks: form.remarks || null,
        deficit: parseInt(form.deficit) || null,
      };

      if (editingEntry) {
        const { error } = await supabase.from("bricks_inventory").update(payload).eq("id", editingEntry.id);
        if (error) throw error;
        toast.success("Entry updated!");
      } else {
        const { error } = await supabase.from("bricks_inventory").insert(payload);
        if (error) throw error;
        toast.success("Entry added!");
      }
      setAddDialogOpen(false);
      fetchData();
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : "An unexpected error occurred"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    try {
      const { error } = await supabase.from("bricks_inventory").delete().eq("id", id);
      if (error) throw error;
      toast.success("Entry deleted!");
      fetchData();
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : "An unexpected error occurred"); }
  };

  const renderTable = (data: BricksEntry[], year: number) => {
    const currentPage = brickPage[year] || 1;
    const totalBrickPages = Math.max(1, Math.ceil(data.length / pageSize));
    const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
    <div className="overflow-x-auto bg-white dark:bg-zinc-950 border rounded-lg">
      <div className="px-4 py-2 border-b flex items-center justify-between bg-muted/30">
        <span className="text-sm text-muted-foreground">{data.length} entries</span>
        <div className="flex items-center gap-2">
          {totalBrickPages > 1 && (
            <span className="text-xs text-muted-foreground">Page {currentPage} of {totalBrickPages}</span>
          )}
          <Button size="sm" onClick={() => openAddDialog(year)} className="gap-2">
            <Plus className="h-4 w-4" />Add Entry
          </Button>
        </div>
      </div>
      <div className="min-w-[1400px]">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th className="border border-border px-2 py-2.5 text-center font-bold sticky left-0 bg-muted/50 min-w-[100px]">Date</th>
              <th className="border border-border px-2 py-2.5 text-center font-bold min-w-[90px]">Newly Printed</th>
              <th className="border border-border px-2 py-2.5 text-center font-bold min-w-[80px]">In Kiln</th>
              <th className="border border-border px-2 py-2.5 text-center font-bold min-w-[105px]">Reclaimed (NP)</th>
              <th className="border border-border px-2 py-2.5 text-center font-bold min-w-[100px]">Reclaimed (AD)</th>
              <th className="border border-border px-2 py-2.5 text-center font-bold min-w-[90px]">Deployed</th>
              <th className="border border-border px-2 py-2.5 text-center font-bold min-w-[95px]">Bricks w/ Cracks</th>
              <th className="border border-border px-2 py-2.5 text-center font-bold min-w-[85px]">Total AD</th>
              <th className="border border-border px-2 py-2.5 text-center font-bold min-w-[80px]">Actual Count</th>
              <th className="border border-border px-2 py-2.5 text-center font-bold min-w-[75px]">Fired</th>
              <th className="border border-border px-2 py-2.5 text-center font-bold min-w-[80px]">Total</th>
              <th className="border border-border px-2 py-2.5 text-center font-bold min-w-[70px]">Deficit</th>
              <th className="border border-border px-2 py-2.5 text-center font-bold min-w-[200px]">Remarks</th>
              <th className="border border-border px-2 py-2.5 text-center font-bold sticky right-0 bg-muted/50 min-w-[80px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((entry, idx) => (
              <tr key={entry.id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                <td className="border border-border px-2 py-2 sticky left-0 bg-inherit font-medium whitespace-nowrap">{formatDate(entry.date)}</td>
                <td className="border border-border px-2 py-2 text-right tabular-nums">{entry.newly_printed?.toLocaleString() ?? "-"}</td>
                <td className="border border-border px-2 py-2 text-right tabular-nums">{entry.bricks_in_kiln?.toLocaleString() ?? "-"}</td>
                <td className="border border-border px-2 py-2 text-right tabular-nums">{entry.reclaimed_newly_printed?.toLocaleString() ?? "-"}</td>
                <td className="border border-border px-2 py-2 text-right tabular-nums">{entry.reclaimed_air_dried?.toLocaleString() ?? "-"}</td>
                <td className="border border-border px-2 py-2 text-right tabular-nums">{entry.deployed_delivered?.toLocaleString() ?? "-"}</td>
                <td className="border border-border px-2 py-2 text-right tabular-nums">{entry.bricks_with_cracks?.toLocaleString() ?? "-"}</td>
                <td className="border border-border px-2 py-2 text-right tabular-nums">{entry.total_air_dried?.toLocaleString() ?? "-"}</td>
                <td className="border border-border px-2 py-2 text-right tabular-nums">{entry.actual_count?.toLocaleString() ?? "-"}</td>
                <td className="border border-border px-2 py-2 text-right tabular-nums">{entry.total_fired?.toLocaleString() ?? "-"}</td>
                <td className="border border-border px-2 py-2 text-right tabular-nums font-semibold">{entry.overall_total?.toLocaleString() ?? "-"}</td>
                <td className="border border-border px-2 py-2 text-right tabular-nums text-red-500">{entry.deficit?.toLocaleString() ?? "-"}</td>
                <td className="border border-border px-2 py-2 text-sm min-w-[200px] max-w-[300px] truncate">{entry.remarks || "-"}</td>
                <td className="border border-border px-2 py-2 sticky right-0 bg-inherit">
                  <div className="flex gap-1 justify-center">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(entry)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(entry.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalBrickPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t">
          <span className="text-sm text-muted-foreground">Page {currentPage} of {totalBrickPages}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setBrickPage({ ...brickPage, [year]: currentPage - 1 })}>Prev</Button>
            <Button variant="outline" size="sm" disabled={currentPage >= totalBrickPages} onClick={() => setBrickPage({ ...brickPage, [year]: currentPage + 1 })}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Bricks Inventory" description={`${entries.length} total records`} icon={Package}>
        <Link href="/import-bricks">
          <Button variant="outline" className="gap-2"><Upload className="h-4 w-4" />Import Excel</Button>
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center"><Package className="h-5 w-5 text-amber-500" /></div>
            <div><p className="text-xs text-muted-foreground">2025 Total</p><p className="text-xl font-bold">{total2025.toLocaleString()}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Package className="h-5 w-5 text-emerald-500" /></div>
            <div><p className="text-xs text-muted-foreground">2026 Total</p><p className="text-xl font-bold">{total2026.toLocaleString()}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center"><Package className="h-5 w-5 text-blue-500" /></div>
            <div><p className="text-xs text-muted-foreground">Grand Total</p><p className="text-xl font-bold">{(total2025 + total2026).toLocaleString()}</p></div>
          </div>
        </CardContent></Card>
      </div>

      {loading ? (
        <Card><CardContent className="p-0"><div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></CardContent></Card>
      ) : (
        <div className="space-y-4">
          <Card><CardContent className="p-0">
            <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-accent/50 transition-colors" onClick={() => setExpanded2026(!expanded2026)}>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Package className="h-4 w-4 text-emerald-500" /></div>
                <div className="text-left"><h3 className="font-semibold">2026 Records</h3><p className="text-sm text-muted-foreground">{data2026.length} entries • {total2026.toLocaleString()} total bricks</p></div>
              </div>
              {expanded2026 ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {expanded2026 && (data2026.length === 0 ? <div className="p-6 text-center text-muted-foreground">No 2026 records found</div> : renderTable(data2026, 2026))}
          </CardContent></Card>

          <Card><CardContent className="p-0">
            <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-accent/50 transition-colors" onClick={() => setExpanded2025(!expanded2025)}>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center"><Package className="h-4 w-4 text-amber-500" /></div>
                <div className="text-left"><h3 className="font-semibold">2025 Records</h3><p className="text-sm text-muted-foreground">{data2025.length} entries • {total2025.toLocaleString()} total bricks</p></div>
              </div>
              {expanded2025 ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {expanded2025 && (data2025.length === 0 ? <div className="p-6 text-center text-muted-foreground">No 2025 records found</div> : renderTable(data2025, 2025))}
          </CardContent></Card>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>{editingEntry ? "Edit Entry" : `Add ${addYear} Entry`}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4">
            <div className="col-span-3 space-y-2"><Label>Date *</Label><Input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} /></div>
            <div className="space-y-2"><Label>Newly Printed</Label><Input type="number" value={form.newly_printed} onChange={(e) => setForm({...form, newly_printed: e.target.value})} /></div>
            <div className="space-y-2"><Label>Bricks in Kiln</Label><Input type="number" value={form.bricks_in_kiln} onChange={(e) => setForm({...form, bricks_in_kiln: e.target.value})} /></div>
            <div className="space-y-2"><Label>Reclaimed Newly Printed</Label><Input type="number" value={form.reclaimed_newly_printed} onChange={(e) => setForm({...form, reclaimed_newly_printed: e.target.value})} /></div>
            <div className="space-y-2"><Label>Reclaimed Air Dried</Label><Input type="number" value={form.reclaimed_air_dried} onChange={(e) => setForm({...form, reclaimed_air_dried: e.target.value})} /></div>
            <div className="space-y-2"><Label>Deployed/Delivered</Label><Input type="number" value={form.deployed_delivered} onChange={(e) => setForm({...form, deployed_delivered: e.target.value})} /></div>
            <div className="space-y-2"><Label>Bricks with Cracks</Label><Input type="number" value={form.bricks_with_cracks} onChange={(e) => setForm({...form, bricks_with_cracks: e.target.value})} /></div>
            <div className="space-y-2"><Label>Total Air Dried</Label><Input type="number" value={form.total_air_dried} onChange={(e) => setForm({...form, total_air_dried: e.target.value})} /></div>
            <div className="space-y-2"><Label>Actual Count</Label><Input type="number" value={form.actual_count} onChange={(e) => setForm({...form, actual_count: e.target.value})} /></div>
            <div className="space-y-2"><Label>Total Fired</Label><Input type="number" value={form.total_fired} onChange={(e) => setForm({...form, total_fired: e.target.value})} /></div>
            <div className="space-y-2"><Label>Overall Total</Label><Input type="number" value={form.overall_total} onChange={(e) => setForm({...form, overall_total: e.target.value})} /></div>
            <div className="space-y-2"><Label>Deficit</Label><Input type="number" value={form.deficit} onChange={(e) => setForm({...form, deficit: e.target.value})} /></div>
            <div className="col-span-3 space-y-2"><Label>Remarks</Label><Textarea value={form.remarks} onChange={(e) => setForm({...form, remarks: e.target.value})} rows={2} /></div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingEntry ? "Update" : "Add"} Entry</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
