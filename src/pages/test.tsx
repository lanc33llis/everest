import { api } from "~/utils/api";

export default function Home() {
  const res = api.post.something.useSubscription({
    prompt: "2 + 2 is what?",
  });

  return (
    <main className="min-h-screen font-sans">
      {/* {res?.data?.summary[0].predictions?.map((predict) => (
        <p key={predict.stringValue}>{predict.stringValue}</p>
      ))} */}
      {JSON.stringify(res)}
    </main>
  );
}
