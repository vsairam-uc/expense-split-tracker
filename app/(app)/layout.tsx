import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { auth } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <>
      <AppNav userName={session.user.name} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-4 pb-24 sm:px-4 sm:py-6 md:pb-6">
        {children}
      </main>
    </>
  );
}
