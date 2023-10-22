import { Avatar, Pagination, SideSheet, Spinner, Dialog } from "evergreen-ui";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { api } from "~/utils/api";

import { Plus, PencilRuler } from "lucide-react";

import { useState } from "react";

const Dashboard = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showUserSettings, setShowUserSettings] = useState(false);

  const [page, setPage] = useState(0);
  const pages = api.user.getUserPages.useInfiniteQuery({
    limit: 16,
    user: session?.user.id ?? "",
  });

  if (status === "unauthenticated") {
    void router.push("/");
  }

  const numOfPages = Math.max(pages.data?.pages[0]?.numOfPages ?? 0, 1);

  const createNewCard = () => {
    return (
      <div>
        <Dialog>Enter your file name</Dialog>
      </div>
    );
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4">
      {pages.isLoading && (
        <div className="absolute top-0 z-10 flex h-screen w-full items-center justify-center bg-white">
          <Spinner />
        </div>
      )}
      <div className="flex w-full justify-end">
        <button onClick={() => setShowUserSettings(true)}>
          <Avatar size={32} name={session?.user.name} />
        </button>
        <SideSheet
          isShown={showUserSettings}
          onCloseComplete={() => setShowUserSettings(false)}
          width={320}
        >
          <div>123</div>
        </SideSheet>
      </div>
      <div className="flex w-full grow gap-4 px-24">
        <div className="h-36 w-36">
          <button
            className="flex h-full w-full flex-col items-center rounded border transition-all hover:bg-zinc-50"
            onClick={() => createNewCard()}
          >
            <p className="w-full border-b py-4  text-zinc-500">
              Create New Page
            </p>
            <div className="flex grow items-center justify-center">
              <Plus color="black" />
            </div>
          </button>
        </div>
        {pages.data?.pages[page]?.items.map((card) => (
          <div className="h-36 w-36" key={card.id}>
            <Link
              href={`/dashboard/${card.id}`}
              className="flex h-full w-full flex-col items-center rounded border text-center !no-underline transition-all hover:bg-zinc-50"
            >
              <p className="w-full border-b  py-4 text-zinc-500">{card.name}</p>
              <div className="flex grow items-center justify-center">
                <PencilRuler color="black" />
              </div>
            </Link>
          </div>
        ))}
      </div>
      <Pagination
        page={page}
        totalPages={numOfPages}
        onNextPage={() => setPage((p) => Math.min(p + 1, numOfPages - 1))}
        onPreviousPage={() => setPage((p) => Math.max(p - 1, 0))}
      />
    </main>
  );
};

export default Dashboard;
