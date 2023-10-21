import { signIn } from "next-auth/react";

const UserAuthPanel = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <button onClick={() => signIn("google")}>Google Sign-in</button>
    </div>
  );
};

export default UserAuthPanel;
