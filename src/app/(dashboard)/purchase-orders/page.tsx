"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { ShoppingCart, Plus, Search, MoreHorizontal, Loader2, Eye, CheckCircle, XCircle, Clock, FileText, ChevronDown, ChevronRight, Trash2, Pencil } from "lucide-react";

interface OrderRow {
  id: string;
  customer_id: string;
  status: string;
  total_amount: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  customer?: { name: string } | null;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product?: { name: string; sku: string } | null;
}

interface CustomerOption {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface ProductData {
  id: string;
  name: string;
  sku: string;
  unit_price: number;
}

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderRow & { items?: OrderItemRow[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderRow | null>(null);

  const [form, setForm] = useState({ customer_id: "", quantity: "1", price: "0", notes: "" });
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [customerSaving, setCustomerSaving] = useState(false);

  const supabase = createClient();

  const total = parseFloat(form.price || "0") * parseInt(form.quantity || "0");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: ordersRes } = await supabase
        .from("purchase_orders")
        .select("*, customer:customers(name)")
        .order("created_at", { ascending: false });

      const { data: customersRes } = await supabase
        .from("customers")
        .select("id, name, email, phone")
        .order("name");

      if (ordersRes) setOrders(ordersRes as unknown as OrderRow[]);
      if (customersRes) setCustomers(customersRes);
    } catch (error) { console.error("Fetch error:", error); }
    finally { setLoading(false); }
  }, [supabase]);

  const fetchProduct = useCallback(async () => {
    setProductLoading(true);
    try {
      const res = await fetch("/api/products/bricks");
      if (res.ok) {
        const data = await res.json();
        if (data.id) { setProductData(data); setProducts([data]); }
      }
    } catch (error) { console.error("Product fetch error:", error); }
    finally { setProductLoading(false); }
  }, []);

  useEffect(() => { fetchData(); fetchProduct(); }, [fetchData, fetchProduct]);

  const handleSave = async () => {
    if (!form.customer_id) { toast.error("Customer is required"); return; }
    if (!form.quantity || parseInt(form.quantity) < 1) { toast.error("Valid quantity is required"); return; }
    if (!form.price || parseFloat(form.price) < 0) { toast.error("Valid price is required"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: form.customer_id,
          product: "Bricks",
          product_id: productData?.id,
          quantity: parseInt(form.quantity),
          price: parseFloat(form.price),
          total,
          notes: form.notes,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create order");

      toast.success("Sales order created!");
      setDialogOpen(false);
      setForm({ customer_id: "", quantity: "1", price: "0", notes: "" });
      fetchData();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("Create order error:", error);
      toast.error(msg);
    }
    finally { setSaving(false); }
  };

  const handleAddCustomer = async () => {
    if (!customerForm.name) { toast.error("Name is required"); return; }
    setCustomerSaving(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create customer");
      toast.success("Customer created!");
      setCustomerDialogOpen(false);
      setCustomerForm({ name: "", email: "", phone: "", address: "" });
      setForm({ ...form, customer_id: data.id });
      fetchData();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("Add customer error:", error);
      toast.error(msg);
    } finally { setCustomerSaving(false); }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from("purchase_orders").update({ status }).eq("id", id);
      if (error) throw error;
      toast.success(`Order ${status}`);
      fetchData();
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : String(error)); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this order?")) return;
    try {
      const { error } = await supabase.from("purchase_orders").delete().eq("id", id);
      if (error) throw error;
      toast.success("Order deleted!");
      fetchData();
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : String(error)); }
  };

  const viewOrderDetail = async (order: OrderRow) => {
    setSelectedOrder(order as OrderRow & { items?: OrderItemRow[] });
    try {
      const { data } = await supabase
        .from("purchase_order_items")
        .select("*, product:products(name, sku)")
        .eq("order_id", order.id);
      setSelectedOrder((prev) => prev ? { ...prev, items: data as OrderItemRow[] } : null);
    } catch (error) { console.error("Detail fetch error:", error); }
    setDetailDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { cls: string; Icon: typeof FileText; label: string }> = {
      draft: { cls: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20", Icon: FileText, label: "Draft" },
      pending: { cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", Icon: Clock, label: "Pending" },
      approved: { cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", Icon: CheckCircle, label: "Approved" },
      received: { cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", Icon: CheckCircle, label: "Received" },
      cancelled: { cls: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20", Icon: XCircle, label: "Cancelled" },
    };
    const b = config[status] || config.draft;
    return <Badge className={`${b.cls} gap-1`}><b.Icon className="h-3 w-3" />{b.label}</Badge>;
  };

  const filtered = orders.filter((o) => {
    const matchSearch = search === "" || o.customer?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Sales Orders" description={`${orders.length} total orders`} icon={ShoppingCart}>
        <Button onClick={() => { setForm({ customer_id: "", quantity: "1", price: "0", notes: "" }); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />Create Order
        </Button>
      </PageHeader>

      <Card><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by customer..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "all")}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <div className="overflow-x-auto bg-white dark:bg-zinc-950">
          <Table className="border-collapse">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="border border-border text-center font-bold">Order ID</TableHead>
                <TableHead className="border border-border text-center font-bold min-w-[180px]">Customer</TableHead>
                <TableHead className="border border-border text-center font-bold min-w-[120px]">Status</TableHead>
                <TableHead className="border border-border text-center font-bold min-w-[120px]">Total</TableHead>
                <TableHead className="border border-border text-center font-bold min-w-[120px]">Created</TableHead>
                <TableHead className="border border-border text-center font-bold sticky right-0 bg-muted/50 min-w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-32 border border-border">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-32 text-muted-foreground border border-border">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((o, index) => (
                  <TableRow key={o.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                    <TableCell className="border border-border font-mono text-xs">{o.id.slice(0, 8).toUpperCase()}</TableCell>
                    <TableCell className="border border-border font-medium">{o.customer?.name ?? "—"}</TableCell>
                    <TableCell className="border border-border text-center">{getStatusBadge(o.status)}</TableCell>
                    <TableCell className="border border-border text-right font-semibold">{formatCurrency(o.total_amount)}</TableCell>
                    <TableCell className="border border-border text-sm text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </TableCell>
                    <TableCell className="border border-border sticky right-0 bg-inherit">
                      <div className="flex gap-1 justify-center">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => viewOrderDetail(o)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(o.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {o.status === "draft" && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(o.id, "pending")}>Mark Pending</DropdownMenuItem>
                            )}
                            {o.status === "pending" && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(o.id, "approved")}>Approve</DropdownMenuItem>
                            )}
                            {o.status === "approved" && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(o.id, "received")}>Mark Received</DropdownMenuItem>
                            )}
                            {o.status !== "cancelled" && o.status !== "received" && (
                              <DropdownMenuItem variant="destructive" onClick={() => handleUpdateStatus(o.id, "cancelled")}>Cancel Order</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent></Card>

      {/* Create Order Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create Sales Order</DialogTitle><DialogDescription>Select a customer and enter quantity</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Customer *</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v ?? "" })}>
                    <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent style={{ zIndex: 100 }}>{customers.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="icon" type="button" onClick={() => { setCustomerForm({ name: "", email: "", phone: "", address: "" }); setCustomerDialogOpen(true); }} className="shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2"><Label>Product</Label><Input value="Bricks" disabled className="bg-muted" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Quantity</Label><Input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
              <div className="space-y-2"><Label>Price (each)</Label><Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="₱0.00" /></div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t font-bold"><span>Total:</span><span>{formatCurrency(total)}</span></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Order notes" rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.customer_id || !form.price || parseFloat(form.price) <= 0}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Customer</DialogTitle><DialogDescription>Add a new customer</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} placeholder="Customer name" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} placeholder="email@example.com" /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} placeholder="+63 900 000 0000" /></div>
            </div>
            <div className="space-y-2"><Label>Address</Label><Textarea value={customerForm.address} onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })} placeholder="Full address" rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomerDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCustomer} disabled={customerSaving || !customerForm.name}>{customerSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Order Details</DialogTitle><DialogDescription>Order {selectedOrder?.id.slice(0, 8).toUpperCase()}</DialogDescription></DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Status</span>{getStatusBadge(selectedOrder.status)}</div>
              <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Customer</span><span className="font-medium">{selectedOrder.customer?.name ?? "—"}</span></div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Product</TableHead><TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead><TableHead className="text-right">Subtotal</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {selectedOrder.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm">{item.product?.name ?? "—"} ({item.product?.sku})</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.quantity * item.unit_price)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-between items-center pt-2 border-t"><span className="font-semibold">Total</span><span className="font-bold text-lg">{formatCurrency(selectedOrder.total_amount)}</span></div>
              {selectedOrder.notes && <div><span className="text-sm text-muted-foreground">Notes: </span><span className="text-sm">{selectedOrder.notes}</span></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
