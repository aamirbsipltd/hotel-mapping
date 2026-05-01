'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { UploadCloud, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const DEMO_LIMIT = 10;

type ParsedPreview = {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
};

export function UploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedPreview | null>(null);
  const [missingCols, setMissingCols] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const REQUIRED = ['name', 'city'];
  const COLUMN_ALIASES: Record<string, string[]> = {
    name:  ['name', 'hotel_name', 'property_name', 'hotel name', 'property name'],
    city:  ['city', 'city_name', 'town', 'location'],
  };

  function detectMissing(headers: string[]): string[] {
    const lower = headers.map((h) => h.toLowerCase().trim());
    return REQUIRED.filter((col) => {
      const aliases = COLUMN_ALIASES[col] ?? [col];
      return !lower.some((h) => aliases.includes(h));
    });
  }

  function handleFile(f: File) {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        preview: 6,
        transformHeader: (h) => h.trim(),
      });
      const fullResult = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim(),
      });
      const headers = result.meta.fields ?? [];
      setMissingCols(detectMissing(headers));
      setPreview({
        headers,
        rows: result.data.slice(0, 5),
        totalRows: fullResult.data.length,
      });
    };
    reader.readAsText(f);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.endsWith('.csv')) handleFile(dropped);
    else toast.error('Please drop a .csv file');
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    if (missingCols.length > 0) return;

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.message ?? json.error ?? 'Upload failed');
        return;
      }

      router.push(`/results/${json.sessionId}`);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Drop zone */}
      <div
        className={cn(
          'relative rounded-xl border-2 border-dashed transition-colors cursor-pointer',
          isDragging
            ? 'border-primary bg-accent'
            : 'border-border hover:border-primary/50 hover:bg-muted/40',
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          {file ? (
            <>
              <FileText className="h-10 w-10 text-primary mb-3" />
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {(file.size / 1024).toFixed(1)} KB — click to change
              </p>
            </>
          ) : (
            <>
              <UploadCloud className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">Drop your CSV here</p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
            </>
          )}
        </div>
      </div>

      {/* Column requirements */}
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Required columns:</span> name, city
        <span className="mx-2">·</span>
        <span className="font-medium text-foreground">Optional:</span> latitude, longitude, address, phone
      </p>

      {/* Missing column error */}
      {missingCols.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">
            Missing required columns: <strong>{missingCols.join(', ')}</strong>.
            Please add these columns to your CSV and try again.
          </p>
        </div>
      )}

      {/* Demo cap warning */}
      {preview && preview.totalRows > DEMO_LIMIT && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">
            Demo limit: only the first {DEMO_LIMIT} of {preview.totalRows} rows will be
            processed.{' '}
            <a href="/pricing" className="font-medium underline underline-offset-2">
              Unlock Pro for $99 →
            </a>
          </p>
        </div>
      )}

      {/* Preview table */}
      {preview && preview.rows.length > 0 && missingCols.length === 0 && (
        <Card className="overflow-hidden p-0">
          <div className="px-4 py-2 border-b bg-muted/40">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Preview — first {preview.rows.length} rows
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {preview.headers.slice(0, 6).map((h) => (
                    <TableHead key={h} className="text-xs whitespace-nowrap">
                      {h}
                    </TableHead>
                  ))}
                  {preview.headers.length > 6 && (
                    <TableHead className="text-xs text-muted-foreground">
                      +{preview.headers.length - 6} more
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.rows.map((row, i) => (
                  <TableRow key={i}>
                    {preview.headers.slice(0, 6).map((h) => (
                      <TableCell key={h} className="text-xs max-w-[140px] truncate">
                        {row[h] ?? ''}
                      </TableCell>
                    ))}
                    {preview.headers.length > 6 && <TableCell />}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Button
        type="submit"
        disabled={!file || missingCols.length > 0 || isUploading}
        className="w-full"
        size="lg"
      >
        {isUploading ? 'Uploading…' : 'Match my hotels →'}
      </Button>
    </form>
  );
}
