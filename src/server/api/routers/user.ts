import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  getUserPages: protectedProcedure
    .input(
      z.object({
        user: z.string(),
        limit: z.number(),
        // cursor is a reference to the last item in the previous batch
        // it's used to fetch the next batch
        cursor: z.string().nullish(),
        skip: z.number().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const items = await ctx.db.notePage.findMany({
        take: input.limit + 1,
        skip: input.skip,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        where: {
          createdById: input.user,
        },
      });

      const numOfPages = Math.floor(items.length / input.limit);

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (items.length > input.limit) {
        const nextItem = items.pop(); // return the last item from the array
        nextCursor = nextItem?.id;
      }

      return {
        items,
        nextCursor,
        numOfPages,
      };
    }),

  createPage: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        content: z.string(),
        user: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const page = await ctx.db.notePage.create({
        data: {
          name: input.name,
          content: input.content,
          createdById: input.user,
        },
      });

      return page;
    }),

  getPage: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const page = await ctx.db.notePage.findUnique({
        where: {
          id: input.id,
        },
      });

      return page;
    }),

  updatePage: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        content: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const page = await ctx.db.notePage.update({
        where: {
          id: input.id,
        },
        data: {
          name: input.name,
          content: input.content,
        },
      });

      return page;
    }),
});
