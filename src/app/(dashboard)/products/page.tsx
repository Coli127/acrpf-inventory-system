"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate, generateSKU } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Package, Plus, Search, MoreHorizontal, Pencil, Trash2, Loader2, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import type { Product, Category, Supplier, Warehouse } from "@/lib/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "", sku: "", description: "", category_id: "", supplier_id: "",
    unit_price: "", cost_price: "", quantity: "", min_stock_level: "10",
    warehouse_id: "", barcode: "", status: "active",
  });

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes, suppliersRes, warehousesRes] = await Promise.all([
        supabase.from("products").select("*, category:categories(*), supplier:suppliers(*), warehouse:warehouses(*)").order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("name"),
        supabase.from("suppliers").select("*").order("name"),
        supabase.from("warehouses").select("*").order("name"),
      ]);
      if (productsRes.data) setProducts(productsRes.data as unknown as Product[]);
      if (categoriesRes.data) setCategories(categoriesRes.data as Category[]);
      if (suppliersRes.data) setSuppliers(suppliersRes.data as Supplier[]);
      if (warehousesRes.data) setWarehouses(warehousesRes.data as Warehouse[]);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setForm({ name: "", sku: generateSKU(), description: "", category_id: "", supplier_id: "", unit_price: "", cost_price: "", quantity: "", min_stock_level: "10", warehouse_id: "", barcode: "", status: "active" });
    setEditingProduct(null);
  };

  const openCreateDialog = () => { resetForm(); setDialogOpen(true); };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name, sku: product.sku, description: product.description || "",
      category_id: product.category_id || "", supplier_id: product.supplier_id || "",
      unit_price: product.unit_price.toString(), cost_price: product.cost_price.toString(),
      quantity: product.quantity.toString(), min_stock_level: product.min_stock_level.toString(),
      warehouse_id: product.warehouse_id || "", barcode: product.barcode || "", status: product.status,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.sku) { toast.error("Name and SKU are required"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name, sku: form.sku, description: form.description || null,
        category_id: form.category_id || null, supplier_id: form.supplier_id || null,
        unit_price: parseFloat(form.unit_price) || 0, cost_price: parseFloat(form.cost_price) || 0,
        quantity: parseInt(form.quantity) || 0, min_stock_level: parseInt(form.min_stock_level) || 10,
        warehouse_id: form.warehouse_id || null, barcode: form.barcode || null, status: form.status,
      };
      if (editingProduct) {
        const { error } = await supabase.from("products").update(payload).eq("id", editingProduct.id);
        if (error) throw error;
        toast.success("Product updated successfully");
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
        toast.success("Product created successfully");
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    const { error } = await supabase.from("products").delete().eq("id", deletingProduct.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Product deleted");
    setDeleteDialogOpen(false);
    setDeletingProduct(null);
    fetchData();
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = filterCategory === "all" || p.category_id === filterCategory;
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  const getStockBadge = (product: Product) => {
    if (product.quantity === 0) return <Badge variant="destructive" className="text-[10px]">Out of Stock</Badge>;
    if (product.quantity <= product.min_stock_level) return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px]">Low Stock</Badge>;
    return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">In Stock</Badge>;
  };

  const getStatusBadge = (status: string) => {
    if (status === "active") return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">Active</Badge>;
    if (status === "inactive") return <Badge variant="secondary" className="text-[10px]">Inactive</Badge>;
    if (status === "discontinued") return <Badge variant="destructive" className="text-[10px]">Discontinued</Badge>;
    return null;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Products" description={`${products.length} products in inventory`} icon={Package}>
        <Button onClick={openCreateDialog} className="gap-2"><Plus className="h-4 w-4" />Add Product</Button>
      </PageHeader>

      <Card><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products by name, SKU, or barcode..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
          <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v ?? "all")}>
            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "all")}>
            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="discontinued">Discontinued</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent></Card>

      <Card>
        <CardContent className="p-0">
          <button
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Package className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Product Inventory</h3>
                <p className="text-sm text-muted-foreground">{filteredProducts.length} products</p>
              </div>
            </div>
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {expanded && (
            <div className="border-t overflow-x-auto bg-white dark:bg-zinc-950">
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="border border-border text-center font-bold sticky left-0 bg-muted/50 min-w-[200px]">Product</TableHead>
                    <TableHead className="border border-border text-center font-bold min-w-[100px]">SKU</TableHead>
                    <TableHead className="border border-border text-center font-bold min-w-[130px]">Category</TableHead>
                    <TableHead className="border border-border text-center font-bold min-w-[100px]">Price</TableHead>
                    <TableHead className="border border-border text-center font-bold min-w-[80px]">Cost</TableHead>
                    <TableHead className="border border-border text-center font-bold min-w-[80px]">Qty</TableHead>
                    <TableHead className="border border-border text-center font-bold min-w-[100px]">Min Stock</TableHead>
                    <TableHead className="border border-border text-center font-bold min-w-[100px]">Stock</TableHead>
                    <TableHead className="border border-border text-center font-bold min-w-[100px]">Status</TableHead>
                    <TableHead className="border border-border text-center font-bold min-w-[130px]">Supplier</TableHead>
                    <TableHead className="border border-border text-center font-bold sticky right-0 bg-muted/50 min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center h-32 border border-border">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center h-32 text-muted-foreground border border-border">
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product, index) => (
                      <TableRow key={product.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                        <TableCell className="border border-border font-medium sticky left-0 bg-inherit">
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[180px]">{product.description || "-"}</div>
                          </div>
                        </TableCell>
                        <TableCell className="border border-border">{product.sku}</TableCell>
                        <TableCell className="border border-border">{product.category?.name || "-"}</TableCell>
                        <TableCell className="border border-border text-right">{formatCurrency(product.unit_price)}</TableCell>
                        <TableCell className="border border-border text-right">{formatCurrency(product.cost_price)}</TableCell>
                        <TableCell className="border border-border text-right">{product.quantity}</TableCell>
                        <TableCell className="border border-border text-right">{product.min_stock_level}</TableCell>
                        <TableCell className="border border-border text-center">{getStockBadge(product)}</TableCell>
                        <TableCell className="border border-border text-center">{getStatusBadge(product.status)}</TableCell>
                        <TableCell className="border border-border">{product.supplier?.name || "-"}</TableCell>
                        <TableCell className="border border-border sticky right-0 bg-inherit">
                          <div className="flex gap-1 justify-center">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(product)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setDeletingProduct(product); setDeleteDialogOpen(true); }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>{editingProduct ? "Update product details" : "Create a new product in inventory"}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" /></div>
            <div className="space-y-2"><Label>SKU *</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Stock Keeping Unit" /></div>
            <div className="space-y-2"><Label>Category</Label><Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v ?? "" })}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>{categories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}</SelectContent>
            </Select></div>
            <div className="space-y-2"><Label>Supplier</Label><Select value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v ?? "" })}>
              <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
              <SelectContent>{suppliers.map((sup) => (<SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>))}</SelectContent>
            </Select></div>
            <div className="space-y-2"><Label>Unit Price *</Label><Input type="number" step="0.01" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} placeholder="0.00" /></div>
            <div className="space-y-2"><Label>Cost Price *</Label><Input type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} placeholder="0.00" /></div>
            <div className="space-y-2"><Label>Quantity *</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
            <div className="space-y-2"><Label>Min Stock Level</Label><Input type="number" value={form.min_stock_level} onChange={(e) => setForm({ ...form, min_stock_level: e.target.value })} /></div>
            <div className="space-y-2"><Label>Warehouse</Label><Select value={form.warehouse_id} onValueChange={(v) => setForm({ ...form, warehouse_id: v ?? "" })}>
              <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
              <SelectContent>{warehouses.map((w) => (<SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>))}</SelectContent>
            </Select></div>
            <div className="space-y-2"><Label>Barcode</Label><Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="Barcode" /></div>
            <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v ?? "active" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="discontinued">Discontinued</SelectItem>
              </SelectContent>
            </Select></div>
            <div className="col-span-2 space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingProduct ? "Update" : "Create"} Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Delete Product</DialogTitle>
            <DialogDescription>Delete &quot;{deletingProduct?.name}&quot;? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeletingProduct(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
