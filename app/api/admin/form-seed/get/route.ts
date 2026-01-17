import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminSession, error } from "@/lib/api-helpers";
import fs from "node:fs";
import path from "node:path";

export async function GET() {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized", 401);
    // Hardcoded array of form IDs to export
    const formIds = [
      "3084168d-0fc4-427a-89ae-08d7656f9b63",
      "6609998b-e097-4e25-8bc8-9f85876cb454",
      "02ed3dca-7a07-4fb8-bf2b-bde096b7fa10",
    ];

    const exportDir = path.join(process.cwd(), "form-exports");

    // Create export directory if it doesn't exist
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const results: any[] = [];
    const errors: string[] = [];

    for (const formId of formIds) {
      try {
        // Get the form with all related data
        const form = await prisma.forms.findUnique({
          where: { id: formId },
          include: {
            inputs: true,
            selections: true,
            multipleChoice: true,
            ratings: true,
            matrices: true,
            netPromoterScores: true,
            separators: true,
          },
        });

        if (!form) {
          errors.push(`Form not found: ${formId}`);
          continue;
        }

        // Save form data to JSON file
        const fileName = `${formId}.json`;
        const filePath = path.join(exportDir, fileName);

        fs.writeFileSync(filePath, JSON.stringify(form, null, 2));

        results.push({
          formId,
          fileName,
          status: "exported",
          title: form.title,
        });

        console.log(`✅ Exported form: ${form.title} (${formId})`);
      } catch (error) {
        console.error(`❌ Error exporting form ${formId}:`, error);
        errors.push(
          `Error exporting ${formId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return NextResponse.json({
      message: "Form export completed",
      exported: results.length,
      total: formIds.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("Error in form export process:", err);
    return error("Internal server error", 500);
  }
}
