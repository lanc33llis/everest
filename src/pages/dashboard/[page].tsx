import { useRouter } from "next/router";
import { useEffect, useRef, useState, useCallback } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { api } from "~/utils/api";
import debounce from "lodash/debounce";
import Skeleton from "react-loading-skeleton";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { fromBuffer } from "pdf2pic";
import { readFileSync } from "fs";
import Latex from "react-latex-next";
import { Card } from "semantic-ui-react";
import {
  Button,
  Pane,
  Paragraph,
  SideSheet,
  Avatar,
  Tablist,
  Tab,
} from "evergreen-ui";
import "semantic-ui-css/semantic.min.css";
import { useDropzone } from "react-dropzone";
import SkeletonContainer from "~/components/SkeletonContainer";

const assistanceModes = ["Summaries", "Flashcards", "Cornell Notes"] as const;

const Page = () => {
  const router = useRouter();
  const { page } = router.query;

  const getPageQuery = api.user.getPage.useQuery(
    {
      id: page as string,
    },
    {
      enabled: !!page,
    },
  );
  const getSummaryQuery = api.inference.getSummary.useQuery({
    notepage_id: page as string,
  });
  const getFlashcardsQuery = api.inference.getFlashcards.useQuery({
    notepage_id: page as string,
  });

  const createSummaryMutation = api.inference.createSummary.useMutation();
  const createFlashcardsMutation = api.inference.createFlashcards.useMutation();
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: () => {
      return;
    },
  });

  const [name, setName] = useState(getPageQuery.data?.name);
  useEffect(() => {
    if (getPageQuery.data?.name) {
      setName(getPageQuery.data?.name);
    }
  }, [getPageQuery.data?.name]);

  const [content, setContent] = useState("");
  const [assistanceMode, setAssistanceMode] =
    useState<(typeof assistanceModes)[number]>("Summaries");

  useEffect(() => {
    if (getPageQuery.data?.content) {
      setContent(getPageQuery.data?.content);
    }
  }, [getPageQuery.data?.content]);

  const updatePageMutation = api.user.updatePage.useMutation();

  const editorRef = useRef<Editor>(null);

  // const onPDFUpload = async (file: File) => {
  //   const image = fromBuffer(buffer).bulk(-1, { responseType: "buffer" });
  // };

  const debouncedSave = useCallback(
    debounce((content: string, name: string) => {
      if (page) {
        updatePageMutation.mutate({
          id: page as string,
          name,
          content,
        });
      }
    }, 1000),
    [page],
  );

  const [numBulletNotes, setBulletNotes] = useState(3);

  type FlashCardProps = {
    title?: string;
    description?: string;
  };
  const Flashcard = ({ title = "", description = "" }: FlashCardProps) => {
    const [isShown, setIsShown] = useState(false);

    return (
      <div className="h-fit w-fit">
        <Card className="h-36 w-36" onClick={() => setIsShown(true)}>
          <Card.Content className="flex flex-col">
            <Card.Header>
              <Latex>{title}</Latex>
            </Card.Header>
            <Card.Description className="grow truncate">
              <Latex>{description}</Latex>
            </Card.Description>
            {/* <Card.Meta>Card Meta</Card.Meta> */}
          </Card.Content>
        </Card>

        <SideSheet isShown={isShown} onCloseComplete={() => setIsShown(false)}>
          <p>{title}</p>
          <p>{description}</p>
        </SideSheet>
      </div>
    );
  };

  return (
    <main className="flex h-screen flex-col">
      <div className="flex h-16 w-full items-center gap-4 px-4">
        <Link href="/dashboard">
          <ChevronLeft />
        </Link>
        <input
          value={name}
          className="text-lg font-bold text-[#575757] outline-none transition-colors focus:text-black"
          onChange={(e) =>
            setName(() => {
              debouncedSave(content, e.target.value);
              return e.target.value;
            })
          }
        />
      </div>
      <div className="flex grow gap-8 p-4">
        <div className="h h-full w-[600px]">
          <Editor
            ref={editorRef}
            init={{
              content_css: "/editor.css",
              resize: false,
              height: "100%",
            }}
            value={content}
            onEditorChange={(content) => {
              setContent(() => {
                debouncedSave(content, name!);
                return content;
              });
            }}
          />
        </div>
        <div className=" w-[325px] select-none">
          <Tablist>
            {assistanceModes.map((mode) => (
              <Tab
                key={mode}
                isSelected={mode === assistanceMode}
                onSelect={() => {
                  setAssistanceMode(mode);
                  if (page) {
                    switch (mode) {
                      case "Summaries":
                        createSummaryMutation.mutate(
                          {
                            textInput: content,
                            notepage_id: page as string,
                          },
                          {
                            onSuccess: () => {
                              void getSummaryQuery.refetch();
                            },
                          },
                        );

                        break;
                      case "Flashcards":
                        createFlashcardsMutation.mutate(
                          {
                            textInput: content,
                            notepage_id: page as string,
                          },
                          {
                            onSuccess: () => {
                              void getFlashcardsQuery.refetch();
                            },
                          },
                        );
                        break;
                      case "Cornell Notes":
                        break;
                    }
                  }
                }}
              >
                {mode}
              </Tab>
            ))}
          </Tablist>
          <div className="h-[calc(100vh-6rem)] overflow-y-auto">
            {assistanceMode === "Summaries" && (
              <div>{getSummaryQuery.data}</div>
            )}
            {assistanceMode === "Flashcards" && (
              <SkeletonContainer
                data={getFlashcardsQuery.data}
                loading={createFlashcardsMutation.isLoading}
                loadedComponent={({ data }) => (
                  <div>
                    {data.map((card) => (
                      <Flashcard
                        key={card.id}
                        title={card.title}
                        description={card.body}
                      />
                    ))}
                  </div>
                )}
              />
            )}
            {assistanceMode === "Cornell Notes" && <div>Cornell Notes</div>}
          </div>
          {/* {assistanceMode === "Flashcards" && (
            <div>
              <div className="h-fit w-fit">
                <div className="flex flex-wrap gap-8 p-4">
                  {getFlashcardsQuery.data?.map((card) => {
                    return (
                      <Flashcard
                        key={card.id}
                        title={card.title}
                        description={card.body}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )} */}
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="text-lg">Assistant</h2>
          <Button>Upload a pdf or image</Button>
        </div>
        {/* <Skeleton count={5} height={24} />
          <br />
          <Skeleton count={1} height={200} />
          <br /> 
          <Skeleton count={1} height={100} /> */}
      </div>
    </main>
  );
};

export default Page;
