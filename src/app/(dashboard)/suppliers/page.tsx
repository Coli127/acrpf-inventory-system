"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Users, Plus, Search, MoreHorizontal, Pencil, Trash2, Loader2, AlertTriangle, Mail, Phone } from "lucide-react";
import type { Supplier } from "@/lib/types";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("suppliers").select("*").order("name");
    if (data) setSuppliers(data as Supplier[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!form.name) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const payload = { name: form.name, email: form.email || null, phone: form.phone || null, address: form.address || null };
      if (editing) {
        const { error } = await supabase.from("suppliers").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Supplier updated");
      } else {
        const { error } = await supabase.from("suppliers").insert(payload);
        if (error) throw error;
        toast.success("Supplier created");
      }
      setDialogOpen(false); setForm({ name: "", email: "", phone: "", address: "" }); setEditing(null); fetchData();
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : "An unexpected error occurred"); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase.from("suppliers").delete().eq("id", deleting.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Supplier deleted"); setDeleteDialogOpen(false); setDeleting(null); fetchData();
  };

  const filtered = suppliers.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || (s.email && s.email.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description={`${suppliers.length} customers`} icon={Users}>
        <Button onClick={() => { setEditing(null); setForm({ name: "", email: "", phone: "", address: "" }); setDialogOpen(true); }} className="gap-2"><Plus className="h-4 w-4" /> Add Supplier</Button>
      </PageHeader>

      <Card><CardContent className="p-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 max-w-sm" /></div></CardContent></Card>

      <Card><CardContent className="p-0"><div className="overflow-x-auto bg-white dark:bg-zinc-950"><Table><TableHeader><TableRow className="bg-muted/50">
        <TableHead className="border border-border font-bold">Name</TableHead><TableHead className="border border-border font-bold">Email</TableHead><TableHead className="border border-border font-bold">Phone</TableHead><TableHead className="border border-border font-bold">Address</TableHead><TableHead className="border border-border font-bold">Created</TableHead><TableHead className="border border-border w-[50px]"></TableHead>
      </TableRow></TableHeader><TableBody>
        {loading ? (
          <TableRow><TableCell colSpan={6} className="text-center h-32 border border-border"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
        ) : filtered.length === 0 ? (
          <TableRow><TableCell colSpan={6} className="text-center h-32 text-muted-foreground border border-border">No customers found</TableCell></TableRow>
        ) : filtered.map((s, index) => (
          <TableRow key={s.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}>
            <TableCell className="border border-border"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/10 to-chart-3/10 flex items-center justify-center"><Users className="h-4 w-4 text-primary" /></div><span className="font-medium">{s.name}</span></div></TableCell>
            <TableCell className="text-sm border border-border">{s.email ? (<span className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-muted-foreground" />{s.email}</span>) : "—"}</TableCell>
            <TableCell className="text-sm border border-border">{s.phone ? (<span className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-muted-foreground" />{s.phone}</span>) : "—"}</TableCell>
            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate border border-border">{s.address || "—"}</TableCell>
            <TableCell className="text-sm text-muted-foreground border border-border">{formatDate(s.created_at)}</TableCell>
            <TableCell className="border border-border">
              <DropdownMenu>
                <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent"><MoreHorizontal className="h-4 w-4" /></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { setEditing(s); setForm({ name: s.name, email: s.email || "", phone: s.phone || "", address: s.address || "" }); setDialogOpen(true); }}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => { setDeleting(s); setDeleteDialogOpen(true); }}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}</TableBody></Table></div></CardContent></Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Edit Supplier" : "Add Supplier"}</DialogTitle><DialogDescription>{editing ? "Update supplier details" : "Add a new supplier"}</DialogDescription></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Supplier name" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+63 900 000 0000" /></div>
          </div>
          <div className="space-y-2"><Label>Address</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address" rows={2} /></div>
        </div>
        <div className="flex justify-end gap-3 pt-4"><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editing ? "Update" : "Create"}</Button></div>
      </DialogContent></Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}><DialogContent>
        <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Delete Supplier</DialogTitle>
        <DialogDescription>Are you sure you want to delete &quot;{deleting?.name}&quot;?</DialogDescription></DialogHeader>
        <div className="flex justify-end gap-3 pt-4"><Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button><Button variant="destructive" onClick={handleDelete}>Delete</Button></div>
      </DialogContent></Dialog>
    </div>
  );
}
