// import { api } from "~/utils/api";
import { useSession } from "next-auth/react";
import UserAuthPanel from "~/components/UserAuthPanel";
import { Spinner } from "evergreen-ui";

export default function Home() {
  const { status } = useSession();

  return (
    <main className="min-h-screen font-sans">
      {status === "unauthenticated" && <UserAuthPanel />}
      {status === "authenticated" && <div>You are signed-in</div>}
      {status === "loading" && (
        <div className="flex h-screen w-full items-center justify-center">
          <Spinner />
        </div>
      )}
    </main>
  );
}
