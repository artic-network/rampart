import React from 'react';
import { css } from 'glamor';
import CoveragePlot from "./Coverage";
import ReadsOverTime from "./ReadsOverTime";
import ReadsPerChannel from "./ReadsPerChannel";
import ReferenceHeatmap from "./ReferenceHeatmap";
import {channelColours} from "../utils/commonStyles";

const panelContainer = css({
  width: 'calc(100% - 30px)',
  height: "300px",
  minHeight: "300px", // TODO
  boxShadow: '0px 2px rgba(0, 0, 0, 0.14) inset',
  margin: "10px 10px 10px 10px"
})

export const panelTitle = css({
  "fontWeight": "bold",
  "fontSize": "1.3em"
})

const flexRow = css({
  display: "flex",
  'flexDirection': 'row',
  justifyContent: 'space-between',
  height: "calc(100% - 25px)"
})

class OverallSummary extends React.Component {
  render() {
    return (
      <div {...panelContainer}>
        <div {...panelTitle}>
          {`Overall Summary.
          Total reads: ${this.props.nTotalReads}.
          Time elapsed: ${this.props.readsOverTime.slice(-1)[0][0]}s.
          `}
        </div>
        <div {...flexRow}>
          <CoveragePlot
            style={{width: '25%', margin: 'auto', height: "100%"}}
            title={"Coverage"}
            coveragePerChannel={this.props.coveragePerChannel}
            version={this.props.version}
            annotation={this.props.annotation}
            colours={channelColours}
          />
          <ReadsOverTime
            style={{width: '25%', margin: 'auto', height: "100%"}}
            title={"Total reads over time"}
            readsOverTime={this.props.readsOverTime}
            version={this.props.version}
          />
          <ReadsPerChannel
            style={{width: '25%', margin: 'auto', height: "100%"}}
            title={"Total Reads per Channel"}
            readsPerChannel={this.props.readsPerChannel}
            version={this.props.version}
          />
          <ReferenceHeatmap
            style={{width: '25%', margin: 'auto', height: "100%"}}
            title={"Read Mapping Percentages to Reference"}
            refMatchPerChannel={this.props.refMatchPerChannel}
            version={this.props.version}
          />
        </div>
      </div>
    )
  }
}

export default OverallSummary;
