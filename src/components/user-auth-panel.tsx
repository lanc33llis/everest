import { signIn } from "next-auth/react";
import { Button } from "evergreen-ui";

const UserAuthPanel = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <Button height={56} onClick={() => signIn("google")}>
        Sign in
      </Button>
    </div>
  );
};

export default UserAuthPanel;
