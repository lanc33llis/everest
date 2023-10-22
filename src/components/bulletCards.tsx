import { SideSheet, Paragraph, Button } from "evergreen-ui";
import React from "react";

const BulletCards = () => {
  const [isShown, setIsShown] = React.useState(false);

  return (
    <div>
      <SideSheet
        isShown={isShown}
        onCloseComplete={() => setIsShown(false)}
        preventBodyScrolling
      >
        <Paragraph margin={40}>Basic Example</Paragraph>
      </SideSheet>

      <Button onClick={() => setIsShown(true)}>Show Basic Side Sheet</Button>
    </div>
  );
};
