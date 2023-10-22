import {
  Avatar,
  Pagination,
  SideSheet,
  Spinner,
  Dialog,
  Textarea,
  Button,
  Pane,
  Tablist,
  Tab,
  Paragraph,
  DashboardIcon,
} from "evergreen-ui";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import { Plus, PencilRuler, GroupIcon } from "lucide-react";
import { useState, useMemo } from "react";
import { Sidenav, Toggle, Nav } from "rsuite";
import SummaryIcon from "@rsuite/icons/Paragraph";
import CornellIcon from "@rsuite/icons/TableColumn";
import QuizIcon from "@rsuite/icons/DocPass";
import CardIcon from "@rsuite/icons/ThreeColumns";

const Dashboard = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [isShown, setIsShown] = useState(false);
  const [isSideShown, setIsSideShown] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [activeKey, setActiveKey] = useState("1");
  const tabs = useMemo(
    () => ["Summary", "Bullet Cards", "Quizzes", "Cornell Notes"],
    [],
  );

  const [page, setPage] = useState(0);
  const pages = api.user.getUserPages.useInfiniteQuery({
    limit: 16,
    user: session?.user.id ?? "",
  });
  const createNewPageMutation = api.user.createPage.useMutation();

  if (status === "unauthenticated") {
    void router.push("/");
  }

  const numOfPages = Math.max(pages.data?.pages[0]?.numOfPages ?? 0, 1);

  const [createNewPageName, setCreateNewPageName] = useState("Untitled");
  return (
    <main className="text-textcolor flex min-h-screen items-center font-sans">
      {pages.isLoading && (
        <div className="absolute top-0 z-10 flex h-screen w-full items-center justify-center bg-white">
          <Spinner />
        </div>
      )}
      <div className="flex h-screen w-full  grow flex-col items-center px-24 pb-4 pt-16">
        <div className="mx-2 mb-4 flex w-full  items-center justify-between">
          <p className="mb-0 text-4xl font-bold">
            Welcome,{" "}
            <span className="font-extrabold">{session?.user.name}</span>
          </p>
          <button onClick={() => signOut()}>Sign out</button>
        </div>
        <div className="flex w-full grow flex-wrap gap-4 ">
          <div className="h-56 w-56">
            <Dialog
              isShown={isShown}
              title="Enter your filename: "
              confirmLabel="Confirm"
              onConfirm={() => {
                setIsShown(false);
                createNewPageMutation.mutate(
                  {
                    name: createNewPageName,
                    content: "",
                    user: session?.user.id ?? "",
                  },
                  {
                    onSuccess: () => {
                      void pages.refetch();
                    },
                  },
                );
              }}
            >
              <input
                name="file name text area"
                placeholder="Enter your filename..."
                value={createNewPageName}
                onChange={(e) => setCreateNewPageName(e.target.value)}
              />
            </Dialog>
            <button
              className="flex h-full w-full flex-col items-center rounded border transition-all hover:bg-zinc-50"
              onClick={() => setIsShown(true)}
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
            <div className="text-textcolor h-56 w-56 font-sans" key={card.id}>
              <Link
                href={`/dashboard/${card.id}`}
                className="flex h-full w-full flex-col items-center rounded border text-center !no-underline transition-all hover:bg-zinc-50"
              >
                <p className="w-full border-b py-4 text-zinc-500">
                  {card.name}
                </p>
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
      </div>
      <SideSheet
        isShown={showUserSettings}
        onCloseComplete={() => setShowUserSettings(false)}
      >
        <Pane display="flex" height={240}>
          <Tablist marginBottom={16} flexBasis={240} marginRight={24}>
            {tabs.map((tab, index) => {
              return (
                <Tab
                  aria-controls={`panel-${tab}`}
                  direction="vertical"
                  // isSelected={index === selectedIndex}
                  key={tab}
                  // onSelect={() => setSelectedIndex(index)}
                >
                  {tab}
                </Tab>
              );
            })}
          </Tablist>
          <Pane padding={16} background="tint1" flex="1">
            {tabs.map((tab, index) => (
              <Pane
                aria-labelledby={tab}
                // aria-hidden={index !== selectedIndex}
                // display={index === selectedIndex ? 'block' : 'none'}
                key={tab}
                role="tabpanel"
              >
                <Paragraph>Panel {tab}</Paragraph>
              </Pane>
            ))}
          </Pane>
        </Pane>
      </SideSheet>
    </main>
  );
};

export default Dashboard;
