import { Avatar, Pagination } from "evergreen-ui";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "~/utils/api";

import { useState } from "react";
import { Card } from "~/components/doc-panel";
import { Col } from "rsuite";

const Dashboard = () => {
  const { data: session } = useSession();

  const [page, setPage] = useState(0);
  const pages = api.pages.getUserPages.useInfiniteQuery({
    limit: 16,
    user: session?.user.id ?? "",
  });

  const numOfPages = Math.max(pages.data?.pages[0]?.numOfPages ?? 0, 1);

  const createNewCard = (): void => {
    console.log("hi");
  };

  return (
    <main className="flex flex-col items-center p-4">
      <div className="flex w-full justify-end">
        <Link href="/settings">
          <Avatar size={32} name={session?.user.name} />
        </Link>
      </div>
      <div className="flex w-full">
        {/* always have create new card */}
        <Col md={6} sm={12}>
          <button className="h-full w-full" onClick={() => createNewCard()}>
            <Card header="New Card" />
          </button>
        </Col>
        {pages.data?.pages[page]?.items.map((card) => (
          <Col md={6} sm={12} key={card.id}>
            <Card header={card.name} />
          </Col>
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
