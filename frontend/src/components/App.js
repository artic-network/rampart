import React, { Component } from 'react';
import Header from "./Header";
import Panel from "./Panel"
import LoadingStatus from "./LoadingStatus"
import '../styles/global'; // sets global CSS
import '../styles/fonts.css'; // sets global fonts
import { css } from 'glamor'
import { getData, getDataUpdate } from "../utils/getData"

const container = css({
  display: "flex",
  'flexDirection': 'column'
})

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      channels: [],
      status: "App loading"
    };
    this.changeStatus = (status) => {this.setState({status})}
    this.setData = (data) => {this.setState({channels: data})}
    this.appendData = (data) => {
      this.setState({
        channels: this.state.channels.map((channel, idx) => {
          if (data[idx] && data[idx].length) {
            return {
              version: channel.version + 1,
              info: channel.info,
              data: channel.data.concat(data[idx])
            }
          }
          return channel;
        })
      })
    }
  }

  componentDidMount() {
    getData(this.changeStatus, this.setData, this.appendData);
  }

  generatePanels() {
    return this.state.channels.map((d, i) => (
      <Panel key={i} version={d.version} data={d.data} info={d.info}/>
    ))
  }

  render() {
    return (
      <div {...container}>
        <Header/>
        {this.state.channels.length ?
          this.generatePanels() :
          <LoadingStatus status={this.state.status}/>
        }
      </div>
    )
  }
}

export default App;
