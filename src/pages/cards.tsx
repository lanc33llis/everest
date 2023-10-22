import { useState } from "react";
import { useSession } from "next-auth/react";
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

// display the individual card notes on the page
const Cards = () => {
  const [numBulletNotes, setBulletNotes] = useState(3);
  const { data: session, status } = useSession();
  const [showUserSettings, setShowUserSettings] = useState(false);

  const Something = ({ index }: { index: number }) => {
    const [isShown, setIsShown] = useState(false);

    return (
      <div className="h-fit w-fit">
        <Card className="h-36 w-36" onClick={() => setIsShown(true)}>
          <Card.Content>
            <Card.Header></Card.Header>
            <Card.Meta>Card Meta</Card.Meta>
            <Card.Description> </Card.Description>
          </Card.Content>
        </Card>

        <SideSheet isShown={isShown} onCloseComplete={() => setIsShown(false)}>
          <p>{index}</p>
        </SideSheet>
      </div>
    );
  };

  return (
    <div className="flex flex-wrap gap-8 p-4">
      {Array(numBulletNotes)
        .fill(numBulletNotes)
        .map((_, index) => (
          <Something key={index} index={index} />
        ))}
      <div className="absolute top-0 flex h-16 w-full items-center justify-end px-5">
        <button className="h-[32px]" onClick={() => setShowUserSettings(true)}>
          <Avatar name={session?.user.name} size={32} />
        </button>
      </div>
    </div>
  );
};

export default Cards;
