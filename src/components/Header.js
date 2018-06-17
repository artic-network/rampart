import React from 'react';
import logo from "../images/logo.png";
import { css } from 'glamor'

const child = css({
  width: '100%',
  margin: 'auto',
  background: '#005C68',
  color: '#F6EECA',
  borderRadius: '5px'
})

class Header extends React.Component {

  render() {
    return (
      <div {...child}>
        <div style={{float: "left", margin: "10px"}}>
          <a href="http://artic.network" target="_blank">
            <img src={logo} alt={"logo"} width="132"/>
          </a>
        </div>

        <h1>RAMPART</h1>

        <h2 style={{marginTop: "-10px"}}>Read Assignment, Mapping, and Phylogenetic Analysis in Real Time</h2>

        <h3 style={{marginTop: "-10px"}}>{`Status: ${this.props.status}`}</h3>
        <h3 style={{marginTop: "-10px"}}>{`Run name: ${this.props.name}`}</h3>

      </div>
    )

  }
}

export default Header;
