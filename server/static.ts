import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import type { Response } from "express";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Configure proper MIME types for static files
  const mimeTypes: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript",
    ".mjs": "application/javascript",
    ".json": "application/json",
    ".css": "text/css",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".eot": "application/vnd.ms-fontobject",
    ".mp3": "audio/mpeg",
    ".mp4": "video/mp4",
  };

  // Serve static files with proper MIME types
  app.use(
    express.static(distPath, {
      setHeaders: (res: Response, filePath: string) => {
        const ext = path.extname(filePath).toLowerCase();
        const mimeType = mimeTypes[ext];
        if (mimeType) {
          res.setHeader("Content-Type", mimeType);
        }
        // Cache static assets for 1 day
        if (filePath.includes("/assets/")) {
          res.setHeader("Cache-Control", "public, max-age=86400, immutable");
        } else if (ext !== ".html") {
          res.setHeader("Cache-Control", "public, max-age=3600");
        } else {
          // Don't cache HTML files
          res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
        }
      },
    })
  );

  // Fallback: serve index.html for all unmatched routes (SPA routing)
  app.use("*", (_req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
