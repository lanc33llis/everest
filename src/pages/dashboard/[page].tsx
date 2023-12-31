import { useRouter } from "next/router";
import { useEffect, useRef, useState, useCallback } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { api } from "~/utils/api";
import debounce from "lodash/debounce";
import Skeleton from "react-loading-skeleton";
import { ChevronLeft, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { fromBuffer } from "pdf2pic";
import { readFileSync } from "fs";
import Latex from "react-latex-next";
import { Card } from "semantic-ui-react";
import Markdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { UploadButton } from "~/utils/uploadthing";

import {
  Button,
  Pane,
  Paragraph,
  SideSheet,
  Avatar,
  Tablist,
  Tab,
  Spinner,
} from "evergreen-ui";
import "semantic-ui-css/semantic.min.css";
import { useDropzone } from "react-dropzone";
import SkeletonContainer from "~/components/SkeletonContainer";

const assistanceModes = ["Summaries", "Flashcards"] as const;

const Page = () => {
  const router = useRouter();
  const { page } = router.query;

  const getPageQuery = api.user.getPage.useQuery(
    {
      id: page as string,
    },
    {
      enabled: !!page,
      refetchInterval: 2500,
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
              <Markdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {title}
              </Markdown>
            </Card.Header>
            <Card.Description className="grow">
              <Markdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {description}
              </Markdown>
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
      <div className="mt-2 flex h-16 w-full items-center gap-4 px-4">
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
        <div className="relative mb-4 h-full min-w-[700px]">
          <div className="absolute right-4 z-20 flex ">
            <UploadButton
              className="gap-0 pt-3 outline-none ut-button:h-fit ut-button:w-fit ut-button:rounded ut-button:bg-transparent ut-button:px-2 ut-button:py-1 ut-button:text-zinc-600 ut-button:transition-all ut-button:hover:bg-blue-200 ut-allowed-content:h-0"
              content={{
                button() {
                  return "Upload PDF";
                },
                allowedContent() {
                  return "";
                },
              }}
              endpoint="pdfUploader"
              input={{
                notepageId: page as string,
              }}
              onClientUploadComplete={() => getPageQuery.refetch()}
            />
            <UploadButton
              className="gap-0 pt-3 outline-none ut-button:h-fit ut-button:w-fit ut-button:rounded ut-button:bg-transparent ut-button:px-2 ut-button:py-1 ut-button:text-zinc-600 ut-button:transition-all ut-button:hover:bg-blue-200 ut-allowed-content:h-0"
              content={{
                button() {
                  return "Upload Image";
                },
                allowedContent() {
                  return "";
                },
              }}
              endpoint="imageUploader"
              input={{
                notepageId: page as string,
              }}
              onClientUploadComplete={() => getPageQuery.refetch()}
            />
          </div>
          <Editor
            ref={editorRef}
            init={{
              content_css: "/editor.css",
              resize: false,
              height: "100%",
              menubar: "edit view insert format",
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
        <div className="grow select-none">
          <Tablist
            paddingBottom={8}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <div>
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
                      }
                    }
                  }}
                >
                  {mode}
                </Tab>
              ))}
            </div>
            <button
              className="rounded p-2 transition-all hover:bg-zinc-200"
              onClick={() => {
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
              }}
            >
              <RefreshCcw size={14} />
            </button>
          </Tablist>
          <div className="h-[calc(100vh-9rem)] overflow-y-auto pt-4">
            {assistanceMode === "Summaries" && (
              <SkeletonContainer
                data={getSummaryQuery.data}
                loading={createSummaryMutation.isLoading}
                skeletonProps={{
                  height: 100,
                  count: 3,
                }}
                loadedComponent={({ data }) => (
                  <Markdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {getSummaryQuery.data}
                  </Markdown>
                )}
              />
            )}
            {assistanceMode === "Flashcards" && (
              <SkeletonContainer
                data={getFlashcardsQuery.data}
                loading={createFlashcardsMutation.isLoading}
                skeletonProps={{
                  height: 100,
                  count: 3,
                }}
                loadedComponent={({ data }) => (
                  <div className="flex flex-col items-center gap-4 p-2">
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
      </div>
    </main>
  );
};

export default Page;
