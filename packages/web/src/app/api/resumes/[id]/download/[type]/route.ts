import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getPdfPath,
  getLatexPath,
  fileExists,
  readFile,
} from "@/lib/storage";
import {
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
} from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id, type } = await params;

    if (type !== "pdf" && type !== "tex") {
      return errorResponse("Invalid download type. Use 'pdf' or 'tex'.", 422);
    }

    const resume = await prisma.resume.findUnique({ where: { id } });
    if (!resume || resume.userId !== userId) {
      return notFoundResponse();
    }

    const filePath = type === "pdf" ? getPdfPath(userId, id) : getLatexPath(userId, id);

    if (!(await fileExists(filePath))) {
      return errorResponse(`${type.toUpperCase()} file not found`, 404);
    }

    const fileBuffer = await readFile(filePath);
    const contentType = type === "pdf" ? "application/pdf" : "application/x-tex";
    const filename = type === "pdf" ? `${resume.name}.pdf` : `${resume.name}.tex`;

    const arrayBuffer = fileBuffer instanceof Buffer ? fileBuffer.buffer : fileBuffer;
    return new Response(arrayBuffer as ArrayBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    console.error("Download error:", error);
    return errorResponse("Internal server error", 500);
  }
}
