import { defineCollection, z } from "astro:content";

const projects = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    org: z.string().optional(),
    year: z.string(),
    role: z.string(),
    disciplines: z.array(z.enum(["development", "3d", "engineering"])),
    tags: z.array(z.string()),
    summary: z.string(),
    image: z.string(),
    featured: z.boolean().default(false),
    order: z.number().default(0),
    links: z
      .array(
        z.object({
          label: z.string(),
          href: z.string(),
        }),
      )
      .optional(),
    gallery: z
      .array(
        z.object({
          type: z.enum(["tour", "image", "video"]),
          group: z.string(),
          src: z.string(),
          poster: z.string().optional(),
          title: z.string().optional(),
          ratio: z.enum(["16/9", "4/3", "square"]).default("16/9"),
        }),
      )
      .optional(),
  }),
});

export const collections = { projects };