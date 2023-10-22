import { z } from "zod";
import * as fs from "fs";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TextServiceClient } from "@google-ai/generativelanguage";
import { jsonrepair } from "jsonrepair";
import { convert } from "html-to-text";
import { pdfToPng } from "pdf-to-png-converter";

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
      if (input.textInput === "") return {};
      const prompt = `
      Generate flash cards from the following notes for school and academic purposes per 100 characters.
      Each flash card must have concise title and body.
      The title must be a question or problem that the student can answer or solve that's related to the notes.
      The body must be a complete answer to the question or problem in the body. You must provide an answer. If you cannot, then do not generate the flash card.
      Respond with a JSON using the exact following format return this only and nothing else.
      "{
         "cards":
           [
            {
              title: string,
              body: string
            },
            ...
          ]
        }
      }"

      Here is an example of a valid JSON response:
      {
        "cards": [
          {
            "title": "What is the capital of France?",
            "body": "Paris"
          }, 
          {
            "title": "2+2=?",
            "body": "4"
          }
        ]
      }
      
      Here is an example of an invalid JSON response:
      \`\`\`json
      {
        "cards": [
          {
            "title": "What is the capital of France?",
            "body": "Paris"
          }, 
          {
            "title": "2+2=?",
            "body": "4"
          }
        ]
      }
      \`\`\`
      You should output only the JSON body and not the JSON specifier at the top.

      You are allowed to use inline LaTeX code but not block code, meaning that your LaTeX should be surrounded by only one $ sign.
      You should always double check to make sure that the LaTeX is valid and renders correctly.
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

      await ctx.db.notePage.update({
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
      if (input.textInput === "") return;
      const prompt = `
      Please provide a concise and accurate summary of the following notes and academic text using Markdown.
      Your summary should effectively distill the key points, main ideas, and critical information present in the original text. 
      Additionally, make sure to correct any grammatical errors and spelling mistakes.
      Additionally, make sure to correct any misconceptions and errors in the original notes to prevent the student from learning misinformation.
      Make sure to double check and make sure that it is valid Markdown code.

      Text Input:
      ${convert(input.textInput)}`;

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
});
