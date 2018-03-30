import React from 'react';
import logo from "../images/logo.png";
import { css } from 'glamor'

const child = css({
  width: '100%',
  margin: 'auto'
})

class Header extends React.Component {

  render() {
    return (
      <div {...child}>
        <div style={{float: "left", margin: "10px"}}>
          <a href="http://artic.network">
            <img src={logo} alt={"logo"} width="132"/>
          </a>
        </div>

        <h1>RAMPART</h1>

        <h2>Read Assignment, Mapping, and Phylogenetic Analysis in Real Time</h2>
      </div>
    )

  }
}

export default Header;
