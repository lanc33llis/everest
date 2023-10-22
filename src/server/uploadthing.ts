import type { NextApiRequest, NextApiResponse } from "next";
import { createUploadthing, type FileRouter } from "uploadthing/next-legacy";
import { fromBuffer } from "pdf2pic";
import * as fs from "fs";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import fetch from "node-fetch";
import { pdfToPng } from "pdf-to-png-converter";
import { db } from "./db";
import { z } from "zod";

const f = createUploadthing();

const gauth = JSON.parse(fs.readFileSync("./gauth.json").toString()) as {
  client_email: string;
  private_key: string;
};

const imageAnnotatorClient = new ImageAnnotatorClient({
  credentials: gauth,
});

const runImageInference = async (images: string[]): Promise<string> => {
  const res = await imageAnnotatorClient.batchAnnotateImages({
    requests: images.map((image_b64) => ({
      image: { content: image_b64 },
      features: [
        {
          type: "TEXT_DETECTION",
          model: "builtin/latest",
        },
      ],
    })),
  });

  let result = "";
  res[0].responses?.forEach((response) => {
    result += response.fullTextAnnotation?.text;
  });

  return result;
};

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  pdfUploader: f({ pdf: { maxFileSize: "1GB" } })
    // Set permissions and file types for this FileRoute
    .input(
      z.object({
        notepageId: z.string(),
      }),
    )
    .middleware(({ input }) => {
      return input;
    })
    .onUploadComplete(async ({ file, metadata }) => {
      const fileResponse = await fetch(file.url);
      const buffer = Buffer.from(await fileResponse.arrayBuffer());
      const images = (await pdfToPng(buffer)).map((page) =>
        page.content.toString("base64"),
      );

      const content = await runImageInference(images);

      await db.notePage.update({
        where: {
          id: metadata.notepageId,
        },
        data: {
          content,
        },
      });
    }),
  imageUploader: f({ image: { maxFileSize: "1GB" } })
    .input(
      z.object({
        notepageId: z.string(),
      }),
    )
    .middleware(({ input }) => {
      return input;
    })
    .onUploadComplete(async ({ file, metadata }) => {
      const fileResponse = await fetch(file.url);
      const buffer = Buffer.from(await fileResponse.arrayBuffer()).toString(
        "base64",
      );

      const content = await runImageInference([buffer]);

      await db.notePage.update({
        where: {
          id: metadata.notepageId,
        },
        data: {
          content,
        },
      });
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
