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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Users, Plus, Search, MoreHorizontal, Pencil, Trash2, Loader2, AlertTriangle, Mail, Phone, Building2, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Customer } from "@/lib/types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [ordersDialogOpen, setOrdersDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("customers").select("*").order("name");
    if (data) setCustomers(data as Customer[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!form.name) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const payload = { name: form.name, email: form.email || null, phone: form.phone || null, address: form.address || null };
      if (editing) {
        const { error } = await supabase.from("customers").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Customer updated");
      } else {
        const { error } = await supabase.from("customers").insert(payload);
        if (error) throw error;
        toast.success("Customer created");
      }
      setDialogOpen(false); setForm({ name: "", email: "", phone: "", address: "" }); setEditing(null); fetchData();
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : "An unexpected error occurred"); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase.from("customers").delete().eq("id", deleting.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Customer deleted"); setDeleteDialogOpen(false); setDeleting(null); fetchData();
  };

  const viewOrders = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setOrdersLoading(true);
    setOrdersDialogOpen(true);
    const { data } = await supabase
      .from("purchase_orders")
      .select("id, total_amount, status, created_at, notes")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false });
    setCustomerOrders(data || []);
    setOrdersLoading(false);
  };

  const filtered = customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || (c.email && c.email.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description={`${customers.length} customers`} icon={Users}>
        <Button onClick={() => { setEditing(null); setForm({ name: "", email: "", phone: "", address: "" }); setDialogOpen(true); }} className="gap-2"><Plus className="h-4 w-4" /> Add Customer</Button>
      </PageHeader>

      <Card><CardContent className="p-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 max-w-sm" /></div></CardContent></Card>

      <Card><CardContent className="p-0"><Table><TableHeader><TableRow>
        <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Address</TableHead><TableHead>Created</TableHead><TableHead className="w-[50px]"></TableHead>
      </TableRow></TableHeader><TableBody>
        {loading ? (
          <TableRow><TableCell colSpan={6} className="text-center h-32"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
        ) : filtered.length === 0 ? (
          <TableRow><TableCell colSpan={6} className="text-center h-32 text-muted-foreground">No customers found</TableCell></TableRow>
        ) : filtered.map((c) => (
          <TableRow key={c.id}>
            <TableCell><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/10 to-chart-3/10 flex items-center justify-center"><Building2 className="h-4 w-4 text-primary" /></div><span className="font-medium">{c.name}</span></div></TableCell>
            <TableCell className="text-sm">{c.email ? (<span className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-muted-foreground" />{c.email}</span>) : "—"}</TableCell>
            <TableCell className="text-sm">{c.phone ? (<span className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-muted-foreground" />{c.phone}</span>) : "—"}</TableCell>
            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{c.address || "—"}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{formatDate(c.created_at)}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent"><MoreHorizontal className="h-4 w-4" /></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => viewOrders(c)}><ShoppingCart className="mr-2 h-4 w-4" />View Orders</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setEditing(c); setForm({ name: c.name, email: c.email || "", phone: c.phone || "", address: c.address || "" }); setDialogOpen(true); }}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => { setDeleting(c); setDeleteDialogOpen(true); }}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}</TableBody></Table></CardContent></Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Edit Customer" : "Add Customer"}</DialogTitle><DialogDescription>{editing ? "Update customer details" : "Add a new customer"}</DialogDescription></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Customer name" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+63 900 000 0000" /></div>
          </div>
          <div className="space-y-2"><Label>Address</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address" rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editing ? "Update" : "Create"}</Button></DialogFooter>
      </DialogContent></Dialog>

      <Dialog open={ordersDialogOpen} onOpenChange={setOrdersDialogOpen}><DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Orders — {selectedCustomer?.name}</DialogTitle><DialogDescription>Sales orders for this customer</DialogDescription></DialogHeader>
        <div className="max-h-80 overflow-auto">
          {ordersLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : customerOrders.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No orders found for this customer</p>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Order ID</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {customerOrders.map((o: any) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.id.slice(0, 8).toUpperCase()}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(o.total_amount)}</TableCell>
                    <TableCell><span className="capitalize text-sm">{o.status}</span></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent></Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}><DialogContent>
        <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Delete Customer</DialogTitle>
        <DialogDescription>Are you sure you want to delete &quot;{deleting?.name}&quot;?</DialogDescription></DialogHeader>
        <DialogFooter><Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  );
}
