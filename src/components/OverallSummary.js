import React from 'react';
import { css } from 'glamor';
import CoveragePlot from "./Coverage";
import ReadsOverTime from "./ReadsOverTime";
import ReadsPerBarcode from "./ReadsPerBarcode";
import ReferenceHeatmap from "./ReferenceHeatmap";
import { sum } from "d3-array";
import {barcodeColours} from "../utils/commonStyles";

const panelContainer = css({
  width: 'calc(100% - 30px)',
  height: "350px", /* adjusting these will also adjust the graphs */
  minHeight: "350px",
  margin: "10px 10px 10px 10px"
})

export const panelTitle = css({
  "fontWeight": "bold",
  "fontSize": "1.3em",
  "paddingLeft": "20px"
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
          Total reads: ${sum(this.props.readCountPerBarcode)}.
          Time elapsed: ${this.props.readsOverTime.slice(-1)[0][0]}s.
          `}
        </div>
        <div {...flexRow}>
          <CoveragePlot
            style={{width: '35%', margin: 'auto', height: "100%"}}
            title={"Coverage"}
            coverage={this.props.coveragePerBarcode}
            colours={barcodeColours}
            version={this.props.version}
            annotation={this.props.annotation}
          />
          <ReadsOverTime
            style={{width: '22%', margin: 'auto', height: "100%"}}
            title={"Total reads over time"}
            readsOverTime={this.props.readsOverTime}
            version={this.props.version}
          />
          <ReadsPerBarcode
            style={{width: '18%', margin: 'auto', height: "100%"}}
            title={"Total Reads per Barcode"}
            readCountPerBarcode={this.props.readCountPerBarcode}
            version={this.props.version}
          />
          <ReferenceHeatmap
            style={{width: '25%', margin: 'auto', height: "100%"}}
            title={"Read Mapping Percentages to Reference"}
            references={this.props.references}
            refMatchPerBarcode={this.props.refMatchPerBarcode}
            version={this.props.version}
          />
        </div>
      </div>
    )
  }
}

export default OverallSummary;
