import { z } from "zod";
import * as fs from "fs";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { env } from "~/env.mjs";
import { TextServiceClient } from "@google-ai/generativelanguage";
import { jsonrepair } from "jsonrepair";
import { convert } from "html-to-text";
import { fromBuffer } from "pdf2pic";
import { ImageAnnotatorClient } from "@google-cloud/vision";

interface Flashcard {
  title: string;
  body: string;
}

interface Flashcards {
  cards: Flashcard[];
}

const gauth = JSON.parse(fs.readFileSync("./gauth.json").toString()) as {
  client_email: string;
  private_key: string;
};

const textServiceClient = new TextServiceClient({
  credentials: gauth,
});

const imageAnnotatorClient = new ImageAnnotatorClient({
  credentials: gauth,
});

const runInference = async (prompt: string): Promise<string> => {
  const res = await textServiceClient.generateText({
    model: "models/text-bison-001",
    prompt: {
      text: prompt,
    },
  });

  const result: string[] =
    res[0].candidates?.map((candidate) => candidate.output + "") ?? [];

  return result.join("");
};

const runImageInference = async (images: string[]): Promise<string> => {
  const batch_request = images.map((image_b64) => ({
    image: { content: image_b64 },
  }));
  const res = await imageAnnotatorClient.batchAnnotateImages({
    requests: batch_request,
  });

  let result = "";
  res[0].responses?.forEach((response) => {
    result += response.fullTextAnnotation?.text;
  });

  return result;
};

export const inferenceRouter = createTRPCRouter({
  createFlashcards: protectedProcedure
    .input(
      z.object({
        notepage_id: z.string(),
        textInput: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      console.log(convert(input.textInput));

      const prompt = `
      Create flash cards of the following notes for school and academic purposes. 
      For each question or problem there should be a title, the question, of the flash card and a body, the answer, of the flash card which contains notes in bullet point form/
      Respond with a JSON using the exact following format return this only and nothing else.
      "{
         "cards": // array
           [{
             title: // string
             body: // string
           }]
        }
      }"

      Here is an example of a valid JSON response:
      {
        "cards": [
          {
            "title": "Question 1",
            "body": "Answer 1"
          }, {
            "title": "Question 2",
            "body": "Answer 2"
          }
        ]
      }
      You are allowed to use inline LaTeX code but not block code, meaning that your LaTeX should be surrounded by only one $ sign.
      Make sure to double check and make sure that it is valid LaTeX code.
      Also make sure that the body is always a single string and not an array of strings.

      Text Input:
      ${convert(input.textInput)}
      `;
      const inference = await runInference(prompt);
      console.log(inference);
      const res = jsonrepair(inference);
      const res_json: Flashcards = JSON.parse(res) as Flashcards;
      const flashcards = res_json.cards;

      // delete all flashcards
      await ctx.db.flashcard.deleteMany({
        where: {
          notesId: input.notepage_id,
        },
      });

      const notepage = await ctx.db.notePage.update({
        where: {
          id: input.notepage_id,
        },
        data: {
          flashcards: {
            createMany: {
              data: flashcards.map((flashcard) => {
                return {
                  title: flashcard.title,
                  body: flashcard.body,
                };
              }),
            },
          },
        },
      });

      return res_json;
    }),

  getFlashcards: protectedProcedure
    .input(
      z.object({
        notepage_id: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const flashcards = await ctx.db.flashcard.findMany({
        where: {
          notesId: input.notepage_id,
        },
      });

      return flashcards;
    }),

  createSummary: protectedProcedure
    .input(
      z.object({
        notepage_id: z.string(),
        textInput: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const prompt = `
      Please provide a concise and accurate summary of the following notes and academic text that may contain LaTeX code:

      Text Input:
      ${input.textInput}

      Your summary should effectively distill the key points, main ideas, and critical information present in the original text. 
      The summary should be easily understandable and quick and you are allowed to display valid block LaTeX.
      Make sure to validitate and double check your LaTeX code before submitting it.
      `;

      const out = await runInference(prompt);

      // Update the summary in the database
      await ctx.db.notePage.update({
        where: {
          id: input.notepage_id,
        },
        data: {
          summary: out,
        },
      });

      return out;
    }),

  getSummary: protectedProcedure
    .input(
      z.object({
        notepage_id: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const notepage = await ctx.db.notePage.findUnique({
        where: {
          id: input.notepage_id,
        },
      });

      if (!notepage) {
        throw new Error("Notepage not found");
      }

      return notepage.summary;
    }),
  getPDFText: protectedProcedure
    .input(
      z.object({
        pdf_b64: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const buffer = Buffer.from(input.pdf_b64, "base64");
      const images = await fromBuffer(buffer)
        .bulk(-1, {
          responseType: "base64",
        })
        .then((res) => res.map((image) => image.base64));

      let out = "";

      images.forEach((image) => {
        const res = runImageInference(image!).then((res) => {
          out += res;
          return res;
        });
      });

      return out;
    }),
});
