import {
  Pane,
  FileUploader,
  FileCard,
  type FileRejection,
  MimeType,
} from "evergreen-ui";
// import { Button, Divider, Form, Grid, Segment } from "semantic-ui-react";
import { TextareaField } from "evergreen-ui";
import { useCallback, useState, useRef } from "react";
import "@aws-amplify/ui-react/styles.css"; // styles for divider
import { Flex, Text, Divider } from "@aws-amplify/ui-react";
// import React from "react";

import { Editor } from "@tinymce/tinymce-react";

const SplitBox = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [fileRejections, setFileRejections] = useState<FileRejection[]>([]);
  const handleChange = useCallback(
    (files: File[]) => setFiles([files[0]!]),
    [],
  );
  const handleRejected = useCallback(
    (fileRejections: FileRejection[]) =>
      setFileRejections([fileRejections[0]!]),
    [],
  );
  const handleRemove = useCallback(() => {
    setFiles([]);
    setFileRejections([]);
  }, []);

  const editorRef = useRef<Editor>(null);
  const log = () => {
    if (editorRef.current) {
      console.log(editorRef.current.editor?.getContent());
    }
  };

  return (
    <Flex direction="row" justifyContent="space-around">
      <Editor ref={editorRef} onChange={() => log()} />

      <Divider label="OR" orientation="vertical" />

      <Pane maxWidth={654}>
        <FileUploader
          label="Upload PDF File"
          description="You can upload 1 PDF file. File can be up to 50 MB."
          maxSizeInBytes={50 * 1024 ** 2}
          maxFiles={1}
          acceptedMimeTypes={[MimeType.pdf]}
          onChange={handleChange}
          onRejected={handleRejected}
          renderFile={(file: File) => {
            const { name, size, type } = file;
            const fileRejection = fileRejections.find(
              (fileRejection) => fileRejection.file === file,
            );
            const { message } = fileRejection ?? {};

            return (
              <FileCard
                key={name}
                isInvalid={fileRejection != null}
                name={name}
                onRemove={handleRemove}
                sizeInBytes={size}
                type={type}
                validationMessage={message}
              />
            );
          }}
          values={files}
        />
      </Pane>
    </Flex>
  );
};

export default SplitBox;
