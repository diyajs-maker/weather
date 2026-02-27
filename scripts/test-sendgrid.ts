/**
 * Test SendGrid configuration by sending a single test email.
 * Run: npx tsx scripts/test-sendgrid.ts ajax@yopmail.com
 * Or:  npm run test:sendgrid -- ajax@yopmail.com
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
  const toEmail = process.argv[2];
  if (!toEmail || !toEmail.includes("@")) {
    console.log("\nUsage: npx tsx scripts/test-sendgrid.ts <email@example.com>\n");
    console.log("Example: npx tsx scripts/test-sendgrid.ts ajax@yopmail.com\n");
    process.exit(1);
  }

  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  const devMock = process.env.SENDGRID_DEV_MOCK === "true";

  console.log("\n--- SendGrid test ---");
  console.log("  To:", toEmail);
  console.log("  From (SENDGRID_FROM_EMAIL):", fromEmail || "(not set)");
  console.log("  API key set:", apiKey ? "yes" : "no");
  if (devMock) console.log("  Dev mock: ON (no real email sent, check server console for payload)");

  if (!apiKey || !fromEmail) {
    if (devMock) {
      console.log("\n  Using dev mock – sendEmail will log to console and return success.\n");
    } else {
      console.log("\n❌ Missing SENDGRID_API_KEY or SENDGRID_FROM_EMAIL in .env.local");
      console.log("   Add them, or set SENDGRID_DEV_MOCK=true to test without a key.\n");
      process.exit(1);
    }
  }

  const { sendEmail } = await import("../src/lib/services/emailService");

  const result = await sendEmail({
    to: toEmail,
    subject: "Test email – Heat-Cool Portal",
    text: `This is a test email from your Heat-Cool Savings Portal.\n\nIf you received this, SendGrid is configured correctly.\n\nTime: ${new Date().toISOString()}`,
  });

  if (result.success) {
    console.log("\n✅ Email sent successfully.");
    if (result.messageId) console.log("   Message ID:", result.messageId);
    console.log("   Check inbox (and spam) for:", toEmail);
  } else {
    console.log("\n❌ Send failed:", result.error);
    process.exit(1);
  }
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
