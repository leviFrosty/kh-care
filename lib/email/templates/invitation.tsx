import { SUPPORT_EMAIL } from "..";

export default function InvitationEmail({
  teamName,
  inviteUrl,
}: {
  teamName: string;
  inviteUrl: string;
}) {
  return (
    <div>
      <h1>You've been invited to join KH Care</h1>
      <p>
        {teamName} has invited you to join their team on KH Care. Please click
        this link and set up your account to start simplifying your maintenance
        life.{" "}
      </p>
      <a href={inviteUrl}>Accept Invitation</a>
      <p>
        If you have any questions or concerns, please contact us at{" "}
        {SUPPORT_EMAIL}.
      </p>
    </div>
  );
}
