import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminSession, error } from "@/lib/api-helpers";
import fs from "node:fs";
import path from "node:path";

// Validate form data structure
const validateFormData = (formData: any, fileName: string): string | null => {
  if (!formData.id || !formData.title) {
    return `Invalid form data in ${fileName}: Missing ID or title`;
  }
  return null;
};

// Check if form already exists in database
const checkFormExists = async (formId: string, title: string): Promise<string | null> => {
  const existingForm = await prisma.forms.findUnique({
    where: { id: formId },
  });
  
  if (existingForm) {
    return `Form already exists: ${title} (${formId})`;
  }
  return null;
};

// Calculate fields count from form data
const calculateFieldsCount = (formData: any): number => {
  return (
    (formData.inputs?.length || 0) +
    (formData.selections?.length || 0) +
    (formData.multipleChoice?.length || 0) +
    (formData.ratings?.length || 0) +
    (formData.matrices?.length || 0) +
    (formData.netPromoterScores?.length || 0) +
    (formData.separators?.length || 0)
  );
};

// Create form in database
const createFormInDatabase = async (formData: any): Promise<void> => {
  const payloadFieldsCount = calculateFieldsCount(formData);
  
  await prisma.forms.create({
    data: {
      id: formData.id,
      title: formData.title,
      description: formData.description,
      isActive: formData.isActive || false,
      privacyLabel:
        formData.privacyLabel ||
        "I consent to the processing of my personal data and agree to the privacy policy",
      isCompulsory: formData.isCompulsory || false,
      sequence: formData.sequence || [],
      fieldsCount: payloadFieldsCount,
      responsesCount: 0,
      assignedUsersCount: Array.isArray(formData.assignedUsers)
        ? formData.assignedUsers.length
        : 0,
      inputs: {
        create:
          formData.inputs?.map((input: any) => ({
            id: input.id,
            label: input.label,
            required: input.required,
            type: input.type,
          })) || [],
      },
      selections: {
        create:
          formData.selections?.map((selection: any) => ({
            id: selection.id,
            label: selection.label,
            required: selection.required,
            options: selection.options,
          })) || [],
      },
      multipleChoice: {
        create:
          formData.multipleChoice?.map((choice: any) => ({
            id: choice.id,
            label: choice.label,
            required: choice.required,
            maxChoices: choice.maxChoices,
            options: choice.options,
          })) || [],
      },
      ratings: {
        create:
          formData.ratings?.map((rating: any) => ({
            id: rating.id,
            question: rating.question,
            required: rating.required,
            maxRating: rating.maxRating,
            showLabels: rating.showLabels,
            labels: rating.labels,
          })) || [],
      },
      matrices: {
        create:
          formData.matrices?.map((matrix: any) => ({
            id: matrix.id,
            title: matrix.title,
            description: matrix.description,
            required: matrix.required,
            rows: matrix.rows,
            columns: matrix.columns,
          })) || [],
      },
      netPromoterScores: {
        create:
          formData.netPromoterScores?.map((nps: any) => ({
            id: nps.id,
            question: nps.question,
            leftLabel: nps.leftLabel,
            rightLabel: nps.rightLabel,
            required: nps.required,
            maxScore: nps.maxScore,
          })) || [],
      },
      separators: {
        create:
          formData.separators?.map((separator: any) => ({
            id: separator.id,
            title: separator.title,
            description: separator.description,
          })) || [],
      },
    },
  });
};

// Process individual form file
const processFormFile = async (
  file: string,
  exportDir: string
): Promise<{ success?: any; error?: string }> => {
  try {
    const filePath = path.join(exportDir, file);
    const fileContent = fs.readFileSync(filePath, "utf8");
    const formData = JSON.parse(fileContent);

    // Validate form data
    const validationError = validateFormData(formData, file);
    if (validationError) {
      return { error: validationError };
    }

    // Check if form already exists
    const existsError = await checkFormExists(formData.id, formData.title);
    if (existsError) {
      return { error: existsError };
    }

    // Create the form
    await createFormInDatabase(formData);

    console.log(`✅ Seeded form: ${formData.title} (${formData.id})`);
    return {
      success: {
        formId: formData.id,
        fileName: file,
        status: "seeded",
        title: formData.title,
      },
    };
  } catch (error) {
    console.error(`❌ Error seeding form from ${file}:`, error);
    return {
      error: `Error seeding ${file}: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};

export async function POST() {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized", 401);
    const exportDir = path.join(process.cwd(), "form-exports");

    // Check if export directory exists
    if (!fs.existsSync(exportDir)) {
      return error("No form-exports directory found. Please export forms first.", 404);
    }

    // Read all JSON files from the export directory
    const files = fs
      .readdirSync(exportDir)
      .filter((file: any) => file.endsWith(".json"));

    if (files.length === 0) {
      return error("No JSON files found in form-exports directory", 404);
    }

    const results: any[] = [];
    const errors: any[] = [];

    for (const file of files) {
      const result = await processFormFile(file, exportDir);
      
      if (result.success) {
        results.push(result.success);
      } else if (result.error) {
        errors.push(result.error);
      }
    }

    return NextResponse.json({
      message: "Form seeding completed",
      seeded: results.length,
      total: files.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("Error in form seeding process:", err);
    return error("Internal server error", 500);
  }
}
