import React from 'react';


const Footer = () => {
  return (
    <div className="footer">
      {"RAMPART is built by "}
      <a href={"https://twitter.com/hamesjadfield"} target="_blank" rel="noopener noreferrer">James Hadfield</a>
      {", "}
      <a href={"https://twitter.com/pathogenomenick"} target="_blank" rel="noopener noreferrer">Nick Loman</a>
      {" and "}
      <a href={"https://twitter.com/arambaut"} target="_blank" rel="noopener noreferrer">Andrew Rambaut</a>
      {" as part of the "}
      <a href={"http://artic.network"} target="_blank" rel="noopener noreferrer">ARTIC Network</a>
      {" project"}
      <br />{ "Funded through The Wellcome Trust Collaborators Award 206298_A_17_Z."}
    </div>
  )
}

export default Footer;
