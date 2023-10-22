// import { Pane, SideSheet, Paragraph, Button } from "evergreen-ui";

import { Button, Pane, Paragraph, SideSheet } from "evergreen-ui";
// import DocPanel from "~/components/doc-panel";

// NOTE: Generally dont import react as a whole, import what you need from react
import { useState } from "react";

interface BulletCardProps {
  className?: string;
}

const BulletCards = ({ className = "", ...props }: BulletCardProps) => {
  const [isShown, setIsShown] = useState(false);

  // for the bullets have it wrapped by the sidesheet
  // also dynamically generate this for the number of bullets given by back end

  // <Button onClick={() => setIsShown(true)}>Show Basic Side Sheet</Button>

  return (
    <Pane
      onClick={() => setIsShown(true)}
      padding={16}
      background="tint1"
      flex="1"
      {...props}
    >
      <SideSheet
        isShown={isShown}
        onCloseComplete={() => setIsShown(false)}
        preventBodyScrolling
      >
        <Paragraph margin={40}>Basic Example</Paragraph>
      </SideSheet>
    </Pane>
  );
};

export default BulletCards;
