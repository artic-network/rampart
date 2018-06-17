import React from 'react';
import { css } from 'glamor'

const child = css({
  width: '80%',
  margin: 'auto',
  fontSize: "18",
  textAlign: "center",
  paddingTop: "20px",
  paddingBottom: "20px",
  fontWeight: 300
})

class Header extends React.Component {

  render() {
    return (
      <div {...child}>
        {"RAMPART is built by "}
        <a href={"https://twitter.com/hamesjadfield"} target="_blank" >James Hadfield</a>
        {", "}
        <a href={"https://twitter.com/pathogenomenick"} target="_blank" >Nick Loman</a>
        {" and "}
        <a href={"https://twitter.com/arambaut"} target="_blank" >Andrew Rambaut</a>
        {"."}
      </div>
    )
  }
}

export default Header;
