import React, { Component } from 'react';
import crossfilter from "crossfilter"
import Header from "./Header";
import Panel from "./Panel"
import LoadingStatus from "./LoadingStatus"
import '../styles/global'; // sets global CSS
import '../styles/fonts.css'; // sets global fonts
import { css } from 'glamor'
import { getData, getDataUpdate } from "../utils/getData"
import OverallSummary from "./OverallSummary";
const container = css({
  display: "flex",
  'flexDirection': 'column'
})


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: undefined,
      status: "App loading",
      multiplex: 12 /*TODO don't hardcode */
    };
    this.changeStatus = (status) => {this.setState({status})}
    this.addData = (newData) => {
      this.setState(this.calcNewState(newData))
    }
  }
  calcNewState(newData) {
    console.time("calcNewState")
    const newState = {};
    if (!this.state.data) {
      /* must initialise! */
      newState.data = newData;
      newState.startTime = Date.now();
      newState.nTotalReads = newData.length;
      newState.readsOverTime = [[0, newData.length]];
      const dataPerChannel = [...Array(this.state.multiplex)].map(() => []);
      newData.forEach((res) => {
        dataPerChannel[res.channel-1].push(res); /* [0] is channel 1. How could this possible cause bugs?!? */
      })
      newState.readsPerChannel = dataPerChannel.map((d) => crossfilter(d));
      newState.versions = dataPerChannel.map(() => 1);
      /* we need to create dimensions / groups for each of the graphs.
      This only needs to be done once - it automagically updates! */
      newState.coveragePerChannel = newState.readsPerChannel.map((r) =>
        r.dimension((d) => d.location)
          .group((d) => Math.ceil(d/100)*100) /* this makes a histogram with x values (bases) rounded to closest 100 */
          .all()
      )
      newState.readLengthPerChannel = newState.readsPerChannel.map((r) =>
        r.dimension((d) => d.length)
          .group((d) => Math.ceil(d/10)*10) /* this makes a histogram with x values (bases) rounded to closest 10 */
          .all()
      )
      newState.refMatchPerChannel = newState.readsPerChannel.map((r) =>
        r.dimension((d) => d.reference)
          .group((d) => d)
          .all()
      )
    } else {
      /* a data update */
      newState.data = this.state.data.concat(newData);
      newState.nTotalReads = newState.data.length;
      newState.readsOverTime = this.state.readsOverTime;
      newState.readsOverTime.push([
        parseInt((Date.now() - this.state.startTime) / 1000, 10),
        this.state.nTotalReads
      ])
      const newDataPerChannel = [...Array(this.state.multiplex)].map(() => []);
      newData.forEach((res) => {
        newDataPerChannel[res.channel-1].push(res);
      })
      /* crossfilter doesn't need any state updates since it's all links */
      newState.versions = newDataPerChannel.map((d, i) => {
        if (d.length) {
          this.state.readsPerChannel[i].add(d);
          return this.state.versions[i] + 1;
        }
        return this.state.versions[i];
      })
    }
    console.timeEnd("calcNewState")
    return newState;
  }
  componentDidMount() {
    getData(this.changeStatus, this.addData);
  }

  generatePanelsOrDisplayLoadingStatus() {
    if (!this.state.data) {
      return (
        <LoadingStatus status={this.state.status}/>
      )
    }
    return this.state.readsPerChannel.map((reads, idx) => (
      <Panel
        key={idx}
        reads={reads}
        version={this.state.versions[idx]}
        coverage={this.state.coveragePerChannel[idx]}
        readLength={this.state.readLengthPerChannel[idx]}
        refMatch={this.state.refMatchPerChannel[idx]}
        channelNumber={idx+1}
      />
    ))
  }

  render() {
    return (
      <div {...container}>
        <Header/>
        status: {this.state.status}
        <br/>
        reads: {this.state.data ? this.state.data.length : "none yet"}
        <br/>
        {this.state.data ? (
          <div>
            <OverallSummary
              nTotalReads={this.state.nTotalReads}
              readsOverTime={this.state.readsOverTime}
              version={this.state.versions.reduce((tot, cv) => tot + cv)}
              coveragePerChannel={this.state.coveragePerChannel}
              readLengthPerChannel={this.state.readLengthPerChannel}
              refMatchPerChannel={this.state.refMatchPerChannel}
            />
            {this.state.readsPerChannel.map((reads, idx) => (
              <Panel
                key={idx}
                reads={reads}
                version={this.state.versions[idx]}
                coverage={this.state.coveragePerChannel[idx]}
                readLength={this.state.readLengthPerChannel[idx]}
                refMatch={this.state.refMatchPerChannel[idx]}
                channelNumber={idx+1}
              />
            ))}
          </div>
        ) : (
          <LoadingStatus status={this.state.status}/>
        )}
      </div>
    )
  }
}

[0, 1, 2, 3].reduce(function (accumulator, currentValue) {
  return accumulator + currentValue;
}, 0);

// <Panel key={"overview"} version={d.version} data={d.data} info={d.info}/>

// {this.state.channels.length ?
//   this.generatePanels() :
//   <LoadingStatus status={this.state.status}/>
// }

export default App;
