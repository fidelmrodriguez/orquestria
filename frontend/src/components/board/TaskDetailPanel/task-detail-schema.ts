import { z } from "zod";

export const commentSchema = z.object({
  message: z.string().min(2, "Escreva um comentário antes de enviar.")
});

export type CommentForm = z.infer<typeof commentSchema>;
