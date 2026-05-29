import { getFriendsData } from "@/lib/actions/friends";
import { auth } from "@/lib/auth";
import { CreateGroupForm } from "@/components/create-group-form";

export default async function NewGroupPage() {
  const session = await auth();
  const { friends } = await getFriendsData();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New group</h1>
        <p className="text-muted-foreground">
          Create a group to track shared expenses
        </p>
      </div>
      <CreateGroupForm
        friends={friends}
        currentUserId={session!.user!.id}
      />
    </div>
  );
}
