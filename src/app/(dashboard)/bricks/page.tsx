"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Package,
  Upload,
  Trash2,
  Plus,
  Pencil,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Search,
  X,
} from "lucide-react";
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
  highlight_color: string | null;
}

type SortColumn =
  | "date"
  | "newly_printed"
  | "bricks_in_kiln"
  | "reclaimed_newly_printed"
  | "reclaimed_air_dried"
  | "deployed_delivered"
  | "bricks_with_cracks"
  | "total_air_dried"
  | "actual_count"
  | "total_fired"
  | "overall_total"
  | "deficit";

const COLOR_OPTIONS = [
  { label: "None", value: "" },
  { label: "Yellow", value: "#fef9c3" },
  { label: "Green", value: "#bbf7d0" },
  { label: "Blue", value: "#bfdbfe" },
  { label: "Red", value: "#fecaca" },
  { label: "Orange", value: "#fed7aa" },
  { label: "Purple", value: "#e9d5ff" },
  { label: "Pink", value: "#fce7f3" },
  { label: "Cyan", value: "#cffafe" },
];

const MONTHS = [
  { value: "", label: "All Months" },
  { value: "0", label: "January" },
  { value: "1", label: "February" },
  { value: "2", label: "March" },
  { value: "3", label: "April" },
  { value: "4", label: "May" },
  { value: "5", label: "June" },
  { value: "6", label: "July" },
  { value: "7", label: "August" },
  { value: "8", label: "September" },
  { value: "9", label: "October" },
  { value: "10", label: "November" },
  { value: "11", label: "December" },
];

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  if (/^\d+$/.test(dateStr)) {
    const num = parseInt(dateStr);
    if (num > 30000) return new Date((num - 25569) * 86400 * 1000);
    return null;
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(dateStr: string): string {
  const d = parseDate(dateStr);
  if (!d) return dateStr || "-";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function getMonth(dateStr: string): number | null {
  const d = parseDate(dateStr);
  return d ? d.getMonth() : null;
}

function getEntryYear(dateStr: string, entryYear: number | null): number | null {
  if (entryYear) return entryYear;
  const d = parseDate(dateStr);
  return d ? d.getFullYear() : null;
}

export default function BricksPage() {
  const supabase = createClient();

  const [entries, setEntries] = useState<BricksEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterYear, setFilterYear] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>("");
  const [search, setSearch] = useState("");

  const [sortColumn, setSortColumn] = useState<SortColumn>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BricksEntry | null>(null);
  const [saving, setSaving] = useState(false);
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
    highlight_color: "",
  });

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
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    entries.forEach((e) => {
      const y = getEntryYear(e.date, e.year);
      if (y) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [entries]);

  const processed = useMemo(() => {
    let result = [...entries];

    if (filterYear) {
      const y = parseInt(filterYear);
      result = result.filter((e) => getEntryYear(e.date, e.year) === y);
    }
    if (filterMonth) {
      const m = parseInt(filterMonth);
      result = result.filter((e) => getMonth(e.date) === m);
    }
    if (filterDate) {
      result = result.filter((e) => {
        const d = parseDate(e.date);
        if (!d) return false;
        const fd = new Date(filterDate);
        return d.getFullYear() === fd.getFullYear() && d.getMonth() === fd.getMonth() && d.getDate() === fd.getDate();
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) => {
        const remarks = (e.remarks || "").toLowerCase();
        const dateStr = formatDate(e.date).toLowerCase();
        return remarks.includes(q) || dateStr.includes(q);
      });
    }

    result.sort((a, b) => {
      if (sortColumn === "date") {
        const da = parseDate(a.date);
        const db = parseDate(b.date);
        if (da && db) return sortDir === "asc" ? da.getTime() - db.getTime() : db.getTime() - da.getTime();
        if (da) return sortDir === "asc" ? -1 : 1;
        if (db) return sortDir === "asc" ? 1 : -1;
        return 0;
      }
      const va = a[sortColumn] ?? 0;
      const vb = b[sortColumn] ?? 0;
      return sortDir === "asc" ? va - vb : vb - va;
    });

    return result;
  }, [entries, filterYear, filterMonth, filterDate, search, sortColumn, sortDir]);

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  const paginatedData = processed.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [filterYear, filterMonth, filterDate, search]);

  const filteredTotal = processed.reduce((sum, e) => sum + (e.overall_total || 0), 0);
  const grandTotal = entries.reduce((sum, e) => sum + (e.overall_total || 0), 0);

  const handleSort = (col: SortColumn) => {
    if (col === sortColumn) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortColumn(col); setSortDir("desc"); }
  };

  const SortIcon = ({ col }: { col: SortColumn }) => {
    if (col !== sortColumn) return <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 ml-1 inline" /> : <ArrowDown className="h-3 w-3 ml-1 inline" />;
  };

  const exportCSV = () => {
    const headers = [
      "Date", "Newly Printed", "In Kiln", "Reclaimed (NP)", "Reclaimed (AD)",
      "Deployed", "Cracks", "Total AD", "Actual Count", "Fired",
      "Total", "Deficit", "Remarks",
    ];
    const rows = processed.map((e) => [
      formatDate(e.date),
      e.newly_printed ?? "",
      e.bricks_in_kiln ?? "",
      e.reclaimed_newly_printed ?? "",
      e.reclaimed_air_dried ?? "",
      e.deployed_delivered ?? "",
      e.bricks_with_cracks ?? "",
      e.total_air_dried ?? "",
      e.actual_count ?? "",
      e.total_fired ?? "",
      e.overall_total ?? "",
      e.deficit ?? "",
      `"${(e.remarks || "").replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bricks-inventory-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openAddDialog = () => {
    setEditingEntry(null);
    setForm({
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
      highlight_color: "",
    });
    setAddDialogOpen(true);
  };

  const openEditDialog = (entry: BricksEntry) => {
    setEditingEntry(entry);
    const num = Number(entry.date);
    const dateStr = entry.date?.includes("-")
      ? entry.date
      : !isNaN(num)
        ? new Date((num - 25569) * 86400 * 1000).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
    setForm({
      date: dateStr,
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
      highlight_color: entry.highlight_color || "",
    });
    setAddDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.date) { toast.error("Date is required"); return; }
    setSaving(true);
    try {
      const parsedDate = parseDate(form.date);
      const year = parsedDate ? parsedDate.getFullYear() : new Date().getFullYear();
      const payload = {
        date: form.date,
        year,
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
        highlight_color: form.highlight_color || null,
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
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to save entry");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    try {
      const { error } = await supabase.from("bricks_inventory").delete().eq("id", id);
      if (error) throw error;
      toast.success("Entry deleted!");
      fetchData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to delete entry");
    }
  };

  const sortableColumns: { key: SortColumn; label: string }[] = [
    { key: "date", label: "Date" },
    { key: "newly_printed", label: "Newly Printed" },
    { key: "bricks_in_kiln", label: "In Kiln" },
    { key: "reclaimed_newly_printed", label: "Reclaimed (NP)" },
    { key: "reclaimed_air_dried", label: "Reclaimed (AD)" },
    { key: "deployed_delivered", label: "Deployed" },
    { key: "bricks_with_cracks", label: "Cracks" },
    { key: "total_air_dried", label: "Total AD" },
    { key: "actual_count", label: "Actual Count" },
    { key: "total_fired", label: "Fired" },
    { key: "overall_total", label: "Total" },
    { key: "deficit", label: "Deficit" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Bricks Inventory" description={`${processed.length} record${processed.length !== 1 ? "s" : ""}`} icon={Package}>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} className="gap-2">
            <Download className="h-4 w-4" />Export
          </Button>
          <Link href="/import-bricks">
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />Import Excel
            </Button>
          </Link>
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center"><Package className="h-5 w-5 text-amber-500" /></div>
            <div><p className="text-xs text-muted-foreground">Filtered Entries</p><p className="text-xl font-bold">{processed.length.toLocaleString()}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Package className="h-5 w-5 text-emerald-500" /></div>
            <div><p className="text-xs text-muted-foreground">Filtered Total</p><p className="text-xl font-bold">{filteredTotal.toLocaleString()}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center"><Package className="h-5 w-5 text-blue-500" /></div>
            <div><p className="text-xs text-muted-foreground">Grand Total</p><p className="text-xl font-bold">{grandTotal.toLocaleString()}</p></div>
          </div>
        </CardContent></Card>
      </div>

      <Card><CardContent className="p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1.5 min-w-[120px]">
            <Label className="text-xs">Year</Label>
            <Select value={filterYear} onValueChange={(v) => setFilterYear(v ?? "")}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Years</SelectItem>
                {availableYears.map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 min-w-[130px]">
            <Label className="text-xs">Month</Label>
            <Select value={filterMonth} onValueChange={(v) => setFilterMonth(v ?? "")}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Months" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 min-w-[140px]">
            <Label className="text-xs">Date</Label>
            <Input type="date" className="h-9" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          </div>
          <div className="space-y-1.5 min-w-[180px] flex-1">
            <Label className="text-xs">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="h-9 pl-8" placeholder="Search remarks or date..." value={search} onChange={(e) => setSearch(e.target.value)} />
              {search && (
                <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearch("")}>
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <Button size="sm" onClick={openAddDialog} className="gap-2 h-9"><Plus className="h-4 w-4" />Add Entry</Button>
        </div>
      </CardContent></Card>

      {loading ? (
        <Card><CardContent className="p-0"><div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></CardContent></Card>
      ) : processed.length === 0 ? (
        <Card><CardContent className="p-0"><div className="flex h-32 items-center justify-center text-muted-foreground">No records found</div></CardContent></Card>
      ) : (
        <div className="bg-white dark:bg-zinc-950 border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-muted/50">
                  {sortableColumns.map((col) => (
                    <th
                      key={col.key}
                      className={`border border-border px-2 py-2.5 text-center font-bold whitespace-nowrap cursor-pointer select-none hover:bg-muted/70 transition-colors min-w-[80px] ${col.key === "date" ? "sticky left-0 bg-muted/50 min-w-[110px]" : ""}`}
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}<SortIcon col={col.key} />
                    </th>
                  ))}
                  <th className="border border-border px-2 py-2.5 text-center font-bold min-w-[180px]">Remarks</th>
                  <th className="border border-border px-2 py-2.5 text-center font-bold sticky right-0 bg-muted/50 min-w-[80px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((entry, idx) => (
                  <tr key={entry.id} className={`${idx % 2 === 0 ? "bg-background" : "bg-muted/30"} hover:bg-primary/5 transition-colors`}
                    style={entry.highlight_color ? { backgroundColor: entry.highlight_color } : {}}>
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
                    <td className="border border-border px-2 py-2 text-sm max-w-[200px] truncate" title={entry.remarks || ""}>{entry.remarks || "-"}</td>
                    <td className="border border-border px-2 py-2 sticky right-0 bg-inherit">
                      <div className="flex gap-1 justify-center">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(entry)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(entry.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t">
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages} ({processed.length} total)</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>{editingEntry ? "Edit Entry" : "Add Entry"}</DialogTitle></DialogHeader>
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
            <div className="col-span-3 space-y-2"><Label>Highlight Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button key={c.value} type="button" title={c.label}
                    className={`w-8 h-8 rounded-full border-2 ${c.value === form.highlight_color ? "border-foreground ring-2 ring-offset-2" : "border-muted"} ${c.value || "bg-background"}`}
                    style={c.value ? { backgroundColor: c.value } : {}}
                    onClick={() => setForm({...form, highlight_color: c.value})}
                  />
                ))}
              </div>
            </div>
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
