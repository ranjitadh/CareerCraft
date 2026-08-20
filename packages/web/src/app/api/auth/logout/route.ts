import { destroySession } from "@/lib/auth";
import { successResponse } from "@/lib/api-utils";

export async function POST() {
  try {
    await destroySession();
    return successResponse({ message: "Logged out" });
  } catch (error) {
    console.error("Logout error:", error);
    return successResponse({ message: "Logged out" });
  }
}
