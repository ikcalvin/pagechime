"use client";

import { Button } from "@/components/ui/button";
import { Download, Upload, Bookmark, Database } from "lucide-react";

export function DataSettings() {
  return (
    <div className="p-6">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-foreground">
          Data & Storage
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your data portability.
        </p>
      </div>

      <div className="space-y-0 divide-y divide-border/50">
        {/* Export */}
        <div className="flex items-center justify-between py-3.5 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Database className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Export Data</p>
              <p className="text-sm text-muted-foreground">
                Download your articles and tags as JSON.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 h-8 text-xs gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>

        {/* Import */}
        <div className="py-3.5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Upload className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Import Data</p>
              <p className="text-sm text-muted-foreground">
                Bring your library from other services.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 ml-11">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Bookmark className="h-3.5 w-3.5" />
              Pocket
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Bookmark className="h-3.5 w-3.5" />
              Instapaper
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              HTML File
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
