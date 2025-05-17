import { Resend } from "resend";
import InvitationEmail from "./templates/invitation";

export const resend = new Resend(process.env.RESENT_API_KEY!);

export const SUPPORT_EMAIL = "support@kh-care.com";

export async function sendInvitationEmail(
  email: string,
  teamName: string,
  inviteUrl: string,
) {
  const FROM_EMAIL =
    process.env.NODE_ENV === "production"
      ? SUPPORT_EMAIL
      : "onboarding@resend.dev";

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `${teamName} invited you to join KH Care!`,
    react: InvitationEmail({ teamName, inviteUrl }),
  });
}
