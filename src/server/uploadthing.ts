import type { NextApiRequest, NextApiResponse } from "next";
import { createUploadthing, type FileRouter } from "uploadthing/next-legacy";
import { fromBuffer } from "pdf2pic";
import { readFileSync } from "fs";
const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  pdfUploader: f({ pdf: { maxFileSize: "1GB" } })
    // Set permissions and file types for this FileRoute
    .middleware(({ req, res }) => {
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      const fileURL = new URL(file.url);
      const buffer = readFileSync(fileURL);
      const image = fromBuffer(buffer).bulk(-1, { responseType: "buffer" });
      // This code RUNS ON YOUR SERVER after upload
      console.log(image);
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
