import { api } from "~/utils/api";
import { UploadButton } from "~/utils/uploadthing";
import { useState } from "react";
import { fromBuffer } from "pdf2pic";

export default function Home() {
  const [file, setFile] = useState<File | null>();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files === null) return;
    if (event.target.files[0] === undefined) return;
    const extension = event.target.files[0]?.name.split(".").pop();
    if (extension === undefined || extension != "pdf") return;
    setFile(event.target.files[0]);

    const arrayBuffer = (await file?.arrayBuffer()) ?? new ArrayBuffer(0);
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    // const images = fromBuffer(buffer).bulk(-1, { responseType: "buffer" });

    // console.log(images);
  };

  return (
    <main className="min-h-screen font-sans">
      <form>
        <h1>React File Upload</h1>
        <input type="file" onChange={handleUpload} />
        <button type="submit">Upload</button>
      </form>
    </main>
  );
}
