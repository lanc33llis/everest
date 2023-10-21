// import { api } from "~/utils/api";
import { useSession } from "next-auth/react";
import UserAuthPanel from "~/components/user-auth-panel";
import { Spinner } from "evergreen-ui";
import { UploadButton } from "~/utils/uploadthing";

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
      
      <UploadButton
        endpoint="imageUploader"
        onClientUploadComplete={(res) => {
          // Do something with the response
          console.log("Files: ", res);
          alert("Upload Completed");
        }}
        onUploadError={(error: Error) => {
          // Do something with the error.
          alert(`ERROR! ${error.message}`);
        }}
      />
      function FileUploaderSingleUploadDemo() {
  const [files, setFiles] = React.useState([])
  const [fileRejections, setFileRejections] = React.useState([])
  const handleChange = React.useCallback((files) => setFiles([files[0]]), [])
  const handleRejected = React.useCallback((fileRejections) => setFileRejections([fileRejections[0]]), [])
  const handleRemove = React.useCallback(() => {
    setFiles([])
    setFileRejections([])
  }, [])
  return (
    <Pane maxWidth={654}>
      <FileUploader
        label="Upload File"
        description="You can upload 1 file. File can be up to 50 MB."
        maxSizeInBytes={50 * 1024 ** 2}
        maxFiles={1}
        onChange={handleChange}
        onRejected={handleRejected}
        renderFile={(file) => {
          const { name, size, type } = file
          const fileRejection = fileRejections.find((fileRejection) => fileRejection.file === file)
          const { message } = fileRejection || {}
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
          )
        }}
        values={files}
      />
    </Pane>

    </main>
  );
}
