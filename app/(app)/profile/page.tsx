import { auth } from "@/lib/auth";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage() {
  const session = await auth();
  const user = session!.user!;

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div className="border-b border-border pb-6">
        <p className="mb-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
          Account
        </p>
        <h1 className="font-heading text-3xl font-medium tracking-tight">
          Settings
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your account.
        </p>
      </div>
      <ProfileForm name={user.name} email={user.email} />
    </div>
  );
}
