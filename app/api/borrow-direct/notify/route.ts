import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Log the event server-side to confirm it triggered
    console.log("🔔 BORROW DIRECT NOTIFICATION TRIGGERED:", data);

    // TODO: Connect to SendGrid, Resend, or your email provider here.
    // Example:
    // await sendEmail({
    //   to: data.lenderEmail,
    //   subject: `Deal Awarded: $${data.loanAmount} Mortgage`,
    //   html: `Congratulations ${data.lenderName}, your term sheet has been accepted...`
    // });

    return NextResponse.json({ success: true, message: "Notification Sent" });
  } catch (error) {
    console.error("Email API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to send notification" }, { status: 500 });
  }
}