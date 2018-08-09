import React, { Component } from 'react';
import Header from "./Header";
import Footer from "./Footer";
import Panel from "./Panel"
import LoadingStatus from "./LoadingStatus"
import '../styles/global'; // sets global CSS
import '../styles/fonts.css'; // sets global fonts
import { css } from 'glamor'
import { requestRunInfo, requestReads } from "../utils/getData"
import OverallSummary from "./OverallSummary";

const container = css({
  display: "flex",
  'flexDirection': 'column'
})
const timeBetweenUpdates = 2000;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      status: "App Loading",
    };
  }
  componentDidMount() {
    requestRunInfo(this.state, this.setState.bind(this));
    setInterval(
      () => requestReads(this.state, this.setState.bind(this)),
      timeBetweenUpdates
    )
  }
  component
  render() {
    return (
      <div {...container}>
        <Header status={this.state.status} name={this.state.name} />
        {this.state.startTime ? (
          <div>
            <OverallSummary
              readsOverTime={this.state.readsOverTime}
              annotation={this.state.annotation}
              references={this.state.references}
              coveragePerBarcode={this.state.coveragePerBarcode}
              readCountPerBarcode={this.state.readCountPerBarcode}
              refMatchPerBarcode={this.state.refMatchPerBarcode}
              version={this.state.dataVersion}
            />
            {this.state.barcodes.map((name, barcodeIdx) => {
              if (barcodeIdx === 0) return null;
              return (
                <Panel
                  key={name}
                  readCount={this.state.readCountPerBarcode[barcodeIdx]}
                  version={this.state.dataVersion}
                  annotation={this.state.annotation}
                  coverage={this.state.coveragePerBarcode[barcodeIdx]}
                  readLength={this.state.readLengthPerBarcode[barcodeIdx]}
                  refMatch={this.state.refMatchPerBarcode[barcodeIdx]}
                  name={name}
                  barcodeIdx={barcodeIdx}
                />
              )
            })}
          </div>
        ) : (
          <LoadingStatus status={this.state.status}/>
        )}
        <Footer/>
      </div>
    )
  }
}

export default App;
