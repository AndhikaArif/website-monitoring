import { z } from "zod";

export const loginSchemaFront = z.object({
  username: z.string({ error: "Username is required" }),
  password: z.string({ error: "Password is required" }),
});

export type LoginFormType = z.infer<typeof loginSchemaFront>;
