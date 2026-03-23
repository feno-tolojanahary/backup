import { z } from "zod";

const passwordRules = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/[A-Z]/, "Password must include at least 1 uppercase letter.")
  .regex(/[0-9]/, "Password must include at least 1 number.");

export const signupSchema = z
  .object({
    email: z.string().email("Enter a valid email address."),
    password: passwordRules,
    confirmPassword: z.string(),
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters.")
      .or(z.literal("")),
    companyName: z
      .string()
      .trim()
      .min(2, "Company name must be at least 2 characters.")
      .or(z.literal("")),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match.",
        path: ["confirmPassword"],
      });
    }
  });

export type SignupFormValues = z.infer<typeof signupSchema>;
