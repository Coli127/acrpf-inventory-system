"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, FileSpreadsheet, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ImportBricksPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [sheetName, setSheetName] = useState("2026 v. INVENTORY OF BRICKS");
  const [result, setResult] = useState<{ imported: number; message: string } | null>(null);

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select an Excel file");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sheet", sheetName);

      const res = await fetch("/api/import/bricks", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Import failed");

      setResult(data);
      toast.success(data.message);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Import Bricks Inventory</h1>
          <p className="text-muted-foreground">Upload Excel file to import bricks data</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Excel File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Excel File</Label>
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setFile(e.target.files[0]);
                  setResult(null);
                }
              }}
            />
            <p className="text-sm text-muted-foreground">
              Supported formats: .xlsx, .xls, .csv
            </p>
          </div>

          <div className="space-y-2">
            <Label>Sheet Name</Label>
            <Input
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              placeholder="e.g., 2026 v. INVENTORY OF BRICKS"
            />
            <p className="text-sm text-muted-foreground">
              Enter the exact sheet name from your Excel file
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={handleImport} disabled={!file || loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Import Bricks
            </Button>
            {file && !loading && (
              <span className="text-sm text-muted-foreground">
                Selected: {file.name}
              </span>
            )}
          </div>

          {result && (
            <div className="flex items-center gap-2 p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-500/20">
              <CheckCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Import Successful!</p>
                <p className="text-sm">{result.message}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expected Excel Format</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>The Excel sheet should have these columns (in order):</p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Date (or Excel serial number)</li>
              <li>Newly Printed</li>
              <li>Bricks in Kiln</li>
              <li>Reclaimed Newly Printed</li>
              <li>Reclaimed Air Dried</li>
              <li>Deployed/Delivered</li>
              <li>Bricks with Cracks</li>
              <li>Total Air Dried</li>
              <li>Actual Count</li>
              <li>Total Fired</li>
              <li>Overall Total</li>
              <li>Remarks</li>
              <li>Deficit</li>
            </ol>
            <p className="mt-2">Duplicate dates will be automatically skipped.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
