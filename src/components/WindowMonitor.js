/*
 * Copyright (c) 2019 ARTIC Network http://artic.network
 * https://github.com/artic-network/rampart
 *
 * This file is part of RAMPART. RAMPART is free software: you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version. RAMPART is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 * See the GNU General Public License for more details. You should have received a copy of the GNU General Public License
 * along with RAMPART. If not, see <http://www.gnu.org/licenses/>.
 *
 */

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
