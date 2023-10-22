import { z } from "zod";
import * as fs from "fs";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

import { v1beta1 } from "@google-cloud/aiplatform";
import { env } from "~/env.mjs";
import EventEmitter from "events";

const gauth = JSON.parse(fs.readFileSync("./gauth.json").toString()) as {
  client_email: string;
  private_key: string;
};

import { observable } from "@trpc/server/observable";

const aiplatformClient = new v1beta1.PredictionServiceClient({
  apiEndpoint: "us-east1-aiplatform.googleapis.com",
  credentials: gauth,
});

const ee = new EventEmitter();

const callCreateBatchPredictionJob = async ({ prompt }: { prompt: string }) => {
  const endpoint = `projects/${env.GOOGLE_PROJECT_ID}/locations/${env.GOOGLE_LOCATION}/endpoints/${env.GOOGLE_ENDPOINT_ID}`;

  const res = await aiplatformClient.predict({
    endpoint: endpoint,
    instances: [
      {
        structValue: {
          fields: {
            prompt: { stringValue: prompt },
          },
        },
      },
    ],
  });

  return res;
};

const system_prompt = `
You are a helpful, respectful and honest assistant. Always answer as helpfully as possible, while being safe. Your answers should not include any harmful, unethical, racist, sexist, toxic, dangerous, or illegal content. Please ensure that your responses are socially unbiased and positive in nature.
If a question does not make any sense, or is not factually coherent, explain why instead of answering something not correct. If you don't know the answer to a question, please don't share false information.`;

export const postRouter = createTRPCRouter({
  something: publicProcedure
    .input(
      z.object({
        prompt: z.string(),
      }),
    )
    .subscription(({ input }) => {
      return observable<string>((emit) => {
        const endpoint = `projects/${env.GOOGLE_PROJECT_ID}/locations/${env.GOOGLE_LOCATION}/endpoints/${env.GOOGLE_ENDPOINT_ID}`;

        const stream = aiplatformClient.serverStreamingPredict({
          endpoint,
          inputs: [
            {
              structVal: {
                fields: {
                  structVal: {
                    prompt: { stringVal: [input.prompt] },
                  },
                },
              },
            },
          ],
        });

        stream.on("data", (data: string) => {
          emit.next(data);
        });

        const onAdd = (data: string) => {
          emit.next(data);
        };

        return () => {
          stream.off("add", onAdd);
        };
      });
    }),
  generateSummary: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(async ({ input }) => {
      //const prompt = `Summarize the following study notes in a clear and accurate way.
      //Use bullet points to highlight the main points and sub-points.
      //Use simple and concise language to explain the concepts. Include relevant examples and diagrams if necessary.
      //${input.text} `;

      const prompt = `${system_prompt} what is 2+2"`;

      const output = await callCreateBatchPredictionJob({ prompt });

      return {
        summary: output,
      };
    }),
});
