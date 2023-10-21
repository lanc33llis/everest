import { Panel, Placeholder, Row, Col, type PanelProps } from "rsuite";

export const Card = (props: PanelProps) => (
  <Panel {...props} bordered>
    <Placeholder.Paragraph />
  </Panel>
);

const DocPanel = () => (
  <Row>
    <Col md={6} sm={12}>
      <Card />
    </Col>
    {/* <Col md={6} sm={12}>
      <Card />
    </Col>
    <Col md={6} sm={12}>
      <Card />
    </Col>
    <Col md={6} sm={12}>
      <Card />
    </Col> */}
  </Row>
);

export default DocPanel;
