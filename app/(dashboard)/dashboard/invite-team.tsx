"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Loader2, PlusCircle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { use, useActionState } from "react";
import { inviteTeamMember } from "@/app/(login)/actions";
import { useUser } from "@/lib/auth";
import { Perm, RoleName, TeamDataWithMembers } from "@/lib/db/schema";
import { canUserPerformAction } from "@/lib/auth/permissions";
import { getTeamForUser } from "@/lib/db/queries";

type ActionState = {
  error?: string;
  success?: string;
};

export function InviteTeamMember({
  teamData,
}: {
  teamData: TeamDataWithMembers;
}) {
  const { userPromise } = useUser();
  const user = use(userPromise);
  const canInvite =
    user && canUserPerformAction(user.id, teamData.id, Perm.INVITE_USER);
  const canSetPermissions =
    user &&
    canUserPerformAction(user.id, teamData.id, Perm.SET_USER_PERMISSIONS);
  const [inviteState, inviteAction, isInvitePending] = useActionState<
    ActionState,
    FormData
  >(inviteTeamMember, { error: "", success: "" });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Team Member</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={inviteAction} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter email"
              required
              disabled={!canInvite}
            />
          </div>
          <div>
            <Label>Role</Label>
            <RadioGroup
              defaultValue="member"
              name="role"
              className="flex space-x-4"
              disabled={!canInvite || !canSetPermissions}
            >
              {Object.values(RoleName).map((role, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={role} id={role} />
                  <Label htmlFor={role}>{role}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          {inviteState?.error && (
            <p className="text-red-500">{inviteState.error}</p>
          )}
          {inviteState?.success && (
            <p className="text-green-500">{inviteState.success}</p>
          )}
          <Button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white"
            disabled={isInvitePending || !canInvite}
          >
            {isInvitePending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Inviting...
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Invite Member
              </>
            )}
          </Button>
        </form>
      </CardContent>
      {!canInvite && (
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            You must be a team owner or admin to invite new members.
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
