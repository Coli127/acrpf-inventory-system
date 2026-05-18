"use client";

import { useEffect, useState, useCallback } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FileText, Clock, CheckCircle, XCircle, Users } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, oRes] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/orders"),
      ]);
      if (cRes.ok) setCustomers(await cRes.json());
      if (oRes.ok) setOrders(await oRes.json());
    } catch (error) {
      console.error("Fetch error:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description={`${customers.length} customers — ${orders.length} orders`} icon={Users} />

      {/* Customer List */}
      <Card>
        <CardHeader><CardTitle className="text-base">Customer List</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Address</TableHead><TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center h-16"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
              ) : customers.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center h-16 text-muted-foreground">No customers</TableCell></TableRow>
              ) : customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-sm">{c.email || "—"}</TableCell>
                  <TableCell className="text-sm">{c.phone || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.address || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(c.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Orders per Customer</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="border-collapse">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="border border-border text-center font-bold">Order ID</TableHead>
                  <TableHead className="border border-border text-center font-bold min-w-[150px]">Customer</TableHead>
                  <TableHead className="border border-border text-center font-bold">Status</TableHead>
                  <TableHead className="border border-border text-center font-bold">Total</TableHead>
                  <TableHead className="border border-border text-center font-bold min-w-[170px]">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center h-16 border border-border"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                ) : orders.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center h-16 text-muted-foreground border border-border">No orders</TableCell></TableRow>
                ) : orders.map((o, i) => (
                  <TableRow key={o.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                    <TableCell className="border border-border font-mono text-xs">{o.id.slice(0, 8).toUpperCase()}</TableCell>
                    <TableCell className="border border-border font-medium">{o.customer?.name ?? "—"}</TableCell>
                    <TableCell className="border border-border text-center">{getStatusBadge(o.status)}</TableCell>
                    <TableCell className="border border-border text-right font-semibold">{formatCurrency(o.total_amount)}</TableCell>
                    <TableCell className="border border-border text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(o.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
