import { z } from "zod";

const createUserValidationSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: "Name is required.",
      invalid_type_error: "Name must be a string.",
    }),
    email: z
      .string({ required_error: "Email is required." })
      .email("Invalid email address"),
    phone: z
      .string({
        required_error: "Phone number is required.",
        invalid_type_error: "Phone number must be a string.",
      })
      .optional(),
    password: z
      .string({
        required_error: "Password is required.",
        invalid_type_error: "Password must be a string.",
      })
      .min(6, "Password must be at least 6 characters long."),
  }),
});

const updateUserValidationSchema = z.object({
  body: z.object({
    name: z
      .string({
        invalid_type_error: "Name must be a string.",
      })
      .optional(),

    phone: z
      .string({
        invalid_type_error: "Phone number must be a string.",
      })
      .optional(),
    role: z
      .string({
        invalid_type_error: "Role must be a string.",
      })
      .optional(),

    password: z
      .string({
        invalid_type_error: "Password must be a string.",
      })
      .min(6, "Password must be at least 6 characters long.")
      .optional(),
  }),
});

const updateUserByAdminValidationSchema = z.object({
  body: z.object({
    isActive: z
      .boolean({
        invalid_type_error: "isActive must be a boolean.",
      })
      .optional(),
    role: z
      .string({
        invalid_type_error: "Role must be a string.",
      })
      .optional(),
  }),
});
export const UserValidation = {
  createUserValidationSchema,
  updateUserValidationSchema,
  updateUserByAdminValidationSchema,
};
