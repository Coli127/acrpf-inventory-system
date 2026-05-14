"use client";

import { useState, useRef } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Calendar, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ImportSchedulePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<unknown[][] | null>(null);
  const [result, setResult] = useState<{ imported: number; message: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const sheetName = wb.SheetNames.find((s: string) => s.toLowerCase().includes("schedule")) || wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
        const previewRows = rows.slice(2, 8).filter((r: unknown[]) => r[0] && String(r[0]).trim());
        setPreview(previewRows);
      } catch {}
    };
    reader.readAsArrayBuffer(f);
  };

  const handleImport = async () => {
    if (!file) { toast.error("Select a file first"); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/import/schedule", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setResult(data);
      toast.success(data.message);
      setPreview(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Import Schedule" description="Upload Excel file to import task schedules" icon={Calendar} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" /> Upload Excel File
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-accent/50 transition-colors"
          >
            <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium">{file ? file.name : "Click to select Excel file"}</p>
            <p className="text-sm text-muted-foreground mt-1">Supports .xlsx and .xls files</p>
          </div>

          {preview && preview.length > 0 && (
            <div className="overflow-x-auto rounded-lg border">
              <Table className="border-collapse w-full text-sm">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="border border-border">Task</TableHead>
                    <TableHead className="border border-border">Mon</TableHead>
                    <TableHead className="border border-border">Tue</TableHead>
                    <TableHead className="border border-border">Wed</TableHead>
                    <TableHead className="border border-border">Thu</TableHead>
                    <TableHead className="border border-border">Fri</TableHead>
                    <TableHead className="border border-border">Target</TableHead>
                    <TableHead className="border border-border">Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((row, i) => {
                    const r = row as (string | number | null | undefined)[];
                    return (
                    <TableRow key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                      <TableCell className="border border-border">{String(r[0] || "").slice(0, 40)}</TableCell>
                      <TableCell className="border border-border">{r[1] || "-"}</TableCell>
                      <TableCell className="border border-border">{r[2] || "-"}</TableCell>
                      <TableCell className="border border-border">{r[3] || "-"}</TableCell>
                      <TableCell className="border border-border">{r[4] || "-"}</TableCell>
                      <TableCell className="border border-border">{r[5] || "-"}</TableCell>
                      <TableCell className="border border-border">{r[6] ? String(r[6]).slice(0, 25) : "-"}</TableCell>
                      <TableCell className="border border-border">{r[7] ? String(r[7]).slice(0, 20) : "-"}</TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {result && (
            <div className={`flex items-center gap-3 p-4 rounded-lg ${result.imported > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
              {result.imported > 0 ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <div>
                <p className="font-medium">{result.message}</p>
              </div>
            </div>
          )}

          <Button onClick={handleImport} disabled={!file || loading} className="w-full gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {loading ? "Importing..." : "Import Schedule"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
