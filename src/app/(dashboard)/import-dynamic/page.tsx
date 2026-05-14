"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Upload, Database, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

export default function DynamicImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<unknown[][]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tableName, setTableName] = useState("");
  const [preview, setPreview] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setPreview(false);
      setHeaders([]);
      setRows([]);
    }
  };

  const parseFile = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import/dynamic", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse file");

      setHeaders(data.headers);
      setRows(data.rows);
      setPreview(true);
      toast.success(`Parsed ${data.totalRows} rows`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const saveToDatabase = async () => {
    if (!tableName.trim()) {
      toast.error("Please enter a table name");
      return;
    }
    if (headers.length === 0 || rows.length === 0) {
      toast.error("No data to save");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/import/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headers, rows, tableName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      toast.success(data.message);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Dynamic Excel Import</h1>
          <p className="text-muted-foreground">Upload any Excel file and auto-detect headers</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label>Excel File</Label>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
              />
            </div>
            <Button onClick={parseFile} disabled={!file || loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Parse File
            </Button>
          </div>
        </CardContent>
      </Card>

      {preview && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Detected Headers ({headers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {headers.map((h, i) => (
                  <span key={i} className="px-3 py-1 bg-secondary rounded-full text-sm">
                    {h || `Column ${i + 1}`}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Preview ({rows.length} rows)</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((h, i) => (
                      <TableHead key={i}>{h || `Col ${i + 1}`}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 10).map((row, ri) => (
                    <TableRow key={ri}>
                      {headers.map((_, ci) => (
                        <TableCell key={ci}>{String(row[ci] ?? "")}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {rows.length > 10 && (
                    <TableRow>
                      <TableCell colSpan={headers.length} className="text-center text-muted-foreground">
                        ... and {rows.length - 10} more rows
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Save to Database</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Label>Table Name</Label>
                  <Input
                    placeholder="Enter Supabase table name"
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                  />
                </div>
                <Button onClick={saveToDatabase} disabled={saving || !tableName}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                  Save to Supabase
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Note: Table must exist in your Supabase database with matching column names. Data will be inserted as rows.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
