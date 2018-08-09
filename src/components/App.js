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
        {this.state.readsPerBarcode ? (
          <div>
            <OverallSummary
              nTotalReads={this.state.nTotalReads}
              readsOverTime={this.state.readsOverTime}
              version={this.state.versions.reduce((tot, cv) => tot + cv)}
              annotation={this.state.annotation}
              coveragePerChannel={this.state.coveragePerChannel}
              references={this.state.references}
              readsPerBarcode={this.state.readsPerBarcode}
              refMatchPerBarcode={this.state.refMatchPerBarcode}
            />
            {this.state.readsPerBarcode.map((reads, idx) => (
              <Panel
                key={idx}
                reads={reads}
                version={this.state.versions[idx]}
                annotation={this.state.annotation}
                coverage={this.state.coveragePerChannel[idx]}
                readLength={this.state.readLengthPerChannel[idx]}
                refMatch={this.state.refMatchPerBarcode[idx]}
                name={this.state.barcodes[idx+1]}
                channelNumber={idx+1}
              />
            ))}
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
