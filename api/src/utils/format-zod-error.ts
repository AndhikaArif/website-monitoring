import { ZodError } from "zod";

export function formatZodError(error: ZodError) {
  return error.issues.reduce(
    (acc, err) => {
      const field = err.path[0] as string;

      if (!acc[field]) acc[field] = [];
      acc[field].push(err.message);

      return acc;
    },
    {} as Record<string, string[]>,
  );
}
