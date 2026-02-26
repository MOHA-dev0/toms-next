import { z } from "zod";

// ============================================================
// Step 1: Basic Info — Validation Schema
// Shared between frontend (UX) and backend (enforcement).
// The backend MUST always run this; the frontend MAY run it.
// ============================================================

export const createDraftQuotationSchema = z.object({
  // ── Channel ────────────────────────────────────────────────
  channel: z.enum(["b2b", "b2c"]).default("b2c"),

  // ── Agency (only relevant for b2b) ────────────────────────
  agency: z.string().optional().nullable(),

  // ── Sales person ──────────────────────────────────────────
  sales: z.string().optional().nullable(),

  // ── Company ───────────────────────────────────────────────
  company: z.string().optional().nullable(),

  // ── Destination(s) ────────────────────────────────────────
  // At least ONE valid (non-empty) destination must be selected.
  destinationCityIds: z
    .array(z.string())
    .min(1, "يجب اختيار وجهة واحدة على الأقل")
    .refine(
      (ids) => ids.some((id) => id.trim().length > 0),
      "يجب اختيار وجهة واحدة على الأقل"
    ),

  // ── Travel dates ──────────────────────────────────────────
  startDate: z
    .string()
    .or(z.date())
    .refine(
      (val) => {
        if (!val) return false;
        const d = new Date(val);
        return !isNaN(d.getTime());
      },
      "تاريخ البداية مطلوب ويجب أن يكون صالحاً"
    ),

  nights: z
    .number({ message: "عدد الليالي مطلوب" })
    .int("يجب أن يكون عدد الليالي رقماً صحيحاً")
    .min(1, "يجب أن يكون عدد الليالي أكبر من صفر"),

  // ── Pax counts ────────────────────────────────────────────
  adults: z.number().int().min(1).default(1),
  children: z.number().int().min(0).default(0),
  infants: z.number().int().min(0).default(0),

  // ── Passengers ────────────────────────────────────────────
  // The FIRST passenger is the "main traveler" — name is required.
  passengers: z
    .array(
      z.object({
        name: z.string().default(""),
        type: z.enum(["adult", "child", "infant"]).default("adult"),
      })
    )
    .min(1, "يجب إضافة مسافر واحد على الأقل")
    .refine(
      (passengers) => {
        const mainTraveler = passengers[0];
        return (
          mainTraveler &&
          typeof mainTraveler.name === "string" &&
          mainTraveler.name.trim().length > 0
        );
      },
      "اسم المسافر الرئيسي مطلوب"
    ),

  // ── Notes (optional) ──────────────────────────────────────
  notes: z.string().optional().nullable(),

  // ── Customer ID (optional, auto-created on backend if missing)
  customerId: z.string().optional().nullable(),
});

// Infer TypeScript type from the schema
export type CreateDraftQuotationInput = z.infer<typeof createDraftQuotationSchema>;

// ============================================================
// Helper: Format Zod errors into a user-friendly object
// ============================================================
export function formatZodErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".");
    // Keep the first error per field path
    if (!fieldErrors[path]) {
      fieldErrors[path] = issue.message;
    }
  }

  return fieldErrors;
}
