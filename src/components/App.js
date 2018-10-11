import React, { Component } from 'react';
import Header from "./Header";
import Footer from "./Footer";
import Panel from "./Panel"
import LoadingStatus from "./LoadingStatus"
import '../styles/global'; // sets global CSS
import '../styles/fonts.css'; // sets global fonts
import '../styles/temporary.css'; // TODO
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
              samples={this.state.samples}
              readsOverTime={this.state.readsOverTime}
              annotation={this.state.annotation}
              references={this.state.references}
              coveragePerSample={this.state.coveragePerSample}
              readCountPerSample={this.state.readCountPerSample}
              refMatchPerSample={this.state.refMatchPerSample}
              version={this.state.dataVersion}
            />
            {this.state.samples.map((sampleName, sampleIdx) => {
              return (
                <Panel
                  key={sampleName}
                  readCount={this.state.readCountPerSample[sampleIdx]}
                  version={this.state.dataVersion}
                  annotation={this.state.annotation}
                  coverage={this.state.coveragePerSample[sampleIdx]}
                  readLength={this.state.readLengthPerSample[sampleIdx]}
                  references={this.state.references}
                  refMatchCounts={this.state.refMatchPerSample[sampleIdx]}
                  referenceMatchAcrossGenome={this.state.referenceMatchAcrossGenome[sampleIdx]}
                  name={sampleName}
                  sampleIdx={sampleIdx}
                  coverageOverTime={this.state.coverageOverTime[sampleIdx]}
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
