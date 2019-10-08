import React from "react";
import _throttle from "lodash/throttle";

/**
 * A wrapper component for RAMPART which watches for window resize events
 * (including changing the window zoom) and causes the entire app to
 * remount, thus triggering recalculation of SVG elements etc
 */
class WindowMonitor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {key: 1}
  }
  componentDidMount() {
    window.addEventListener(
      "resize",
      /* lodash throttle invokes resize event at most twice per second
      to let redraws catch up. Could also use debounce for 'wait until resize stops' */
      _throttle(
          () => {this.setState({key: this.state.key+1})},
          500,
          {leading: true, trailing: true}
      )
    );
  }

  render() {
    return (
      <div key={this.state.key}>
        {this.props.children}
      </div>
    )
  }
}

export default WindowMonitor;
