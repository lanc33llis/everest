import React from "react";
import { useSession } from "next-auth/react";
import UserAuthPanel from "~/components/user-auth-panel";
import { Spinner } from "evergreen-ui";
import { useRouter } from "next/router";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  if (status === "authenticated") void router.push("/dashboard");

  return (
    <main className="min-h-screen font-sans">
      {status === "unauthenticated" && <UserAuthPanel />}
      {status === "loading" && (
        <div className="flex h-screen w-full items-center justify-center">
          <Spinner />
        </div>
      )}
    </main>
  );
}
