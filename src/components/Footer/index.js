/*
 * Copyright (c) 2019-2025 ARTIC Network http://artic.network
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

import React from 'react';
import styled from 'styled-components';
import { version } from '../../../package.json';

const Container = styled.div`
  width: 80%;
  margin: auto;
  font-size: 18px;
  text-align: center;
  padding-top: 20px;
  padding-bottom: 20px;
  font-weight: 300;
`;

const Footer = () => {
    return (
        <Container>
            {`RAMPART v${version} is built by `}
            James Hadfield
            {", "}
            <a href={"https://aineotoole.co.uk"} target="_blank" rel="noopener noreferrer">Áine O'Toole</a>
            {", "}
            <a href={"https://pathogenomenick.bsky.social"} target="_blank" rel="noopener noreferrer">Nick Loman</a>
            {" and "}
            <a href={"https://arambaut.bsky.com"} target="_blank" rel="noopener noreferrer">Andrew Rambaut</a>
            {" as part of the "}
            <a href={"http://artic.network"} target="_blank" rel="noopener noreferrer">ARTIC Network</a>
            {" project"}
            <br />{ "Funded through The Wellcome Trust Collaborators Award 206298_A_17_Z."}
        </Container>
    )
}

export default Footer;
