"use client";

import { useState, useCallback } from "react";
import { importOwnersFromCsv } from "@/app/actions/import";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload } from "lucide-react";
import Papa from "papaparse";

interface Props {
  svjId: string;
}

interface PreviewRow {
  jednotka: string;
  jmeno: string;
  podil: string;
  email: string;
  telefon?: string;
}

interface ImportResult {
  row: number;
  jednotka: string;
  status: "ok" | "error";
  error?: string;
}

export function CsvImportForm({ svjId }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const processFile = useCallback((f: File) => {
    setFile(f);
    setResults(null);
    setParseErrors([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().toLowerCase(),
      });

      if (parsed.errors.length > 0) {
        setParseErrors(parsed.errors.map((e) => e.message));
        setPreview([]);
        return;
      }

      const rows: PreviewRow[] = parsed.data.slice(0, 10).map((row) => ({
        jednotka: row["jednotka"] ?? "",
        jmeno: row["jmeno"] ?? "",
        podil: row["podil"] ?? "",
        email: row["email"] ?? "",
        telefon: row["telefon"],
      }));

      setPreview(rows);
    };
    reader.readAsText(f);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".csv")) processFile(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      const res = await importOwnersFromCsv(svjId, text);
      if (res.success && res.results) {
        setResults(res.results);
      } else {
        setParseErrors([res.error ?? "Neznámá chyba"]);
      }
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import vlastníků ze CSV</CardTitle>
          <CardDescription>
            Formát: jednotka, jméno, podíl (např. 1/3), e-mail, telefon
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer ${
              dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onClick={() => document.getElementById("csv-file-input")?.click()}
          >
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {file ? file.name : "Přetáhněte CSV soubor sem nebo klikněte pro výběr"}
            </p>
            <input
              id="csv-file-input"
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={onFileChange}
            />
          </div>

          {parseErrors.length > 0 && (
            <div className="rounded-md bg-destructive/10 p-3 space-y-1">
              {parseErrors.map((err, i) => (
                <p key={i} className="text-sm text-destructive">{err}</p>
              ))}
            </div>
          )}

          {preview.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Náhled (prvních {preview.length} řádků)</p>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jednotka</TableHead>
                      <TableHead>Jméno</TableHead>
                      <TableHead>Podíl</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Telefon</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>{row.jednotka}</TableCell>
                        <TableCell>{row.jmeno}</TableCell>
                        <TableCell>{row.podil}</TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>{row.telefon ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {file && preview.length > 0 && (
            <Button onClick={handleImport} disabled={isImporting} className="w-full md:w-auto">
              {isImporting ? "Importuji..." : "Importovat"}
            </Button>
          )}
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Výsledky importu</CardTitle>
            <CardDescription>
              Úspěšně: {results.filter((r) => r.status === "ok").length} |{" "}
              Chyby: {results.filter((r) => r.status === "error").length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Řádek</TableHead>
                    <TableHead>Jednotka</TableHead>
                    <TableHead>Stav</TableHead>
                    <TableHead>Chyba</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.row}</TableCell>
                      <TableCell>{r.jednotka}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === "ok" ? "default" : "destructive"}>
                          {r.status === "ok" ? "OK" : "Chyba"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.error ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
