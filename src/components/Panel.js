import React from 'react';
import { css } from 'glamor'
import CoveragePlot from "./Coverage";
import ReadLengthDistribution from "./ReadLengthDistribution";
import ReferenceMatches from "./ReferenceMatches";
import {channelColours} from "../utils/commonStyles";

const panelContainerCollapsed = {
  position: "relative",
  width: "98%",
  height: "30px", // collapsed
  minHeight: "30px", // collapsed
  margin: "10px 10px 10px 10px",
  transition: "height 0.5s ease-out",
  WebkitTransition: "height 0.5s ease-out",
  border: "1px solid gray",
    borderRadius: "5px",
    borderLeft: "5px solid gray",
}

const panelContainerExpanded = {
  ...panelContainerCollapsed,
  height: "350px",
  minHeight: "350px",
}

const ExpandToggle = ({open, callback}) => (
  <div style={{position: "absolute", top: "10px", right: "10px", cursor: "pointer"}} onClick={callback}>
    {open ? "contract" : "expand"}
  </div>
)

const flexRowContainer = css({
  display: "flex",
  'flexDirection': 'row',
  justifyContent: 'space-between',
  height: "calc(100% - 25px)"
})

export const panelTitle = css({
  "fontWeight": "bold",
  "fontSize": "1.3em",
  "paddingLeft": "20px",
})

/* TODO: make this more meaningful - lower 95th percent? */
const averageCoverage = (data) =>
  parseInt(data.reduce((tot, cv) => tot + cv.value, 0) / data.length, 10);

class Panel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: false,
      colour: channelColours[props.channelNumber - 1]
    }
  }
  render() {
    let panelStyles = { ...(this.state.expanded ? panelContainerExpanded : panelContainerCollapsed), ...{ borderColor: this.state.colour} };
    return (
      <div style={panelStyles}>
        <ExpandToggle open={this.state.expanded} callback={() => this.setState({expanded: !this.state.expanded})}/>
        <div {...panelTitle}>
          {`#${this.props.channelNumber} (${this.props.name}).
          ${this.props.reads.size()} reads.
          ${averageCoverage(this.props.coverage)}x coverage.
          `}
        </div>
        {this.state.expanded ? (
          <div {...flexRowContainer}>
            <CoveragePlot
              style={{width: '35%', margin: 'auto', height: "100%"}}
              title={"Coverage"}
              coveragePerChannel={[this.props.coverage]}
              annotation={this.props.annotation}
              version={this.props.version}
              colours={[this.state.colour]}
            />
            <ReadLengthDistribution
              style={{width: '30%', margin: 'auto', height: "100%"}}
              title={"Read Lengths"}
              readLength={this.props.readLength}
              version={this.props.version}
              colour={this.state.colour}
            />
            <ReferenceMatches
              style={{width: '25%', margin: 'auto', height: "100%"}}
              title={"Reference Matches"}
              refMatch={this.props.refMatch}
              version={this.props.version}
              colour={this.state.colour}
            />
          </div>
        ) : null}
      </div>
    )
  }
}

export default Panel;
