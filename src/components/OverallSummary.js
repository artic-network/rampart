import React from 'react';
import { css } from 'glamor';
import CoveragePlot from "./Coverage";
import ReadsOverTime from "./ReadsOverTime";
import ReadsPerSample from "./ReadsPerSample";
import ReferenceHeatmap from "./ReferenceHeatmap";

const panelContainer = css({
  width: 'calc(100% - 30px)',
  height: "350px", /* adjusting these will also adjust the graphs */
  minHeight: "350px",
  margin: "10px 10px 10px 10px"
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
        <div {...flexRow}>
          <CoveragePlot
            style={{width: '35%', margin: 'auto', height: "100%"}}
            showReferenceMatches={false}
            coverage={this.props.coveragePerSample}
            colours={this.props.sampleColours}
            version={this.props.version}
            annotation={this.props.annotation}
            viewOptions={this.props.viewOptions}
          />
          <ReadsOverTime
            style={{width: '22%', margin: 'auto', height: "100%"}}
            title={"Total reads over time"}
            readsOverTime={this.props.readsOverTime}
            version={this.props.version}
            viewOptions={this.props.viewOptions}
          />
          <ReadsPerSample
            style={{width: '18%', margin: 'auto', height: "100%"}}
            title={"Reads per Sample"}
            readCountPerSample={this.props.readCountPerSample}
            version={this.props.version}
            colours={this.props.sampleColours}
            viewOptions={this.props.viewOptions}
          />
          <ReferenceHeatmap
            style={{width: '25%', margin: 'auto', height: "100%"}}
            title={"Reference Matches"}
            references={this.props.references}
            samples={this.props.samples}
            refMatchPerSample={this.props.refMatchPerSample}
            version={this.props.version}
            viewOptions={this.props.viewOptions}
          />
        </div>
      </div>
    )
  }
}

export default OverallSummary;
