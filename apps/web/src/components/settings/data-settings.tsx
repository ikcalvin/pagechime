"use client";

import { Button } from "@/components/ui/button";
import { Download, Upload, FileJson, Bookmark } from "lucide-react";

export function DataSettings() {
  return (
    <div className="divide-y divide-border">
      <div className="grid md:grid-cols-[240px_1fr] gap-4 md:gap-8 py-8">
        <div>
          <h3 className="font-semibold text-lg">Data & Storage</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your data portability.
          </p>
        </div>

        <div className="space-y-4">
          {/* Export Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 border-b border-border/50 gap-4">
            <div className="space-y-1">
              <span className="text-sm font-medium text-foreground">
                Export Data
              </span>
              <p className="text-sm text-muted-foreground">
                Download a copy of your articles and tags as JSON.
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export JSON
            </Button>
          </div>

          {/* Import Row */}
          <div className="flex flex-col sm:flex-row items-start justify-between py-4 gap-4">
            <div className="space-y-1">
              <span className="text-sm font-medium text-foreground">
                Import Data
              </span>
              <p className="text-sm text-muted-foreground">
                Bring your library from other services.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-w-[200px]">
              <Button variant="outline" size="sm" className="justify-start">
                <Bookmark className="mr-2 h-4 w-4" />
                Pocket Import
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <Bookmark className="mr-2 h-4 w-4" />
                Instapaper Import
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <Upload className="mr-2 h-4 w-4" />
                HTML File
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
