import { NextRequest, NextResponse } from "next/server";
import { verifyToken, TokenPayload } from "@/lib/auth";
import { sendEmail, isEmailConfigured } from "@/lib/services/emailService";

/**
 * POST /api/admin/test-email
 * Body: { "to": "recipient@example.com" }
 * Sends a test email to verify SendGrid (admin only).
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const user = verifyToken(token) as TokenPayload;

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (!isEmailConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: "Email not configured. Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL.",
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const to = body?.to?.trim();
    if (!to || !to.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Body must include 'to' with a valid email." },
        { status: 400 }
      );
    }

    const result = await sendEmail({
      to,
      subject: "Test email – Heat-Cool Portal",
      text: `This is a test email from your Heat-Cool Savings Portal.\n\nIf you received this, SendGrid is configured correctly.\n\nTime: ${new Date().toISOString()}`,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Test email sent. Check inbox (and spam) for " + to,
        messageId: result.messageId,
      });
    }

    return NextResponse.json(
      { success: false, error: result.error || "Send failed" },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("Test email error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/test-email
 * Returns whether email is configured (admin only).
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const user = verifyToken(token) as TokenPayload;

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      configured: isEmailConfigured(),
      fromEmail: process.env.SENDGRID_FROM_EMAIL || null,
    });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
