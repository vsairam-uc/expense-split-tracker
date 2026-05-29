import { LandingPage } from "@/components/landing-page";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  return <LandingPage isAuthenticated={!!session?.user} />;
}
