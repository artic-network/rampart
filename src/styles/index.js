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

/**
 * RAMPART used (until around v1.0.5) a single CSS stylesheet.
 * This was problematic for a few reasons:
 * (1) we dynamically create some colours (e.g. panel colours, reference
 * colours) so we were already mixing-and-matching global CSS and CSS-in-JS
 * (2) The global CSS sheet was becoming hard to maintain, due to never
 * starting with a clear set of elements
 * (3) It couldn't support using UI themes (e.g. light vs dark themes).
 * 
 * Moving to styled components allows all CSS to be via JS, whilst
 * still being able to use CSS syntax. This starts by simply porting everything
 * to `createGlobalStyle`. In the future, element specific things (e.g. header,
 * sidebar, charts etc) can move to their own styled component.
 */

import styled, { createGlobalStyle } from 'styled-components';

export const palette = {
    articGreyDark: "#333330",
    articGreenDark: "#02292e",
    articGreen: "#005c68",
    articGreenLight: "#22968B",
    articBlue: "#5097BA",
    articRedDark: "#803c38",
    articRed: "#e06962",
    articYellow: "#F6EECA",
    articYellowGrey: "#E6DFC1", // taken from andrew's rampart logo
    articWhite: "#fffcf2"
}

/* Styles we wish for everything in RAMPART to inherit */
export const GlobalStyle = createGlobalStyle`

    body {
        overflow-x: hidden;
        font-family: "Lato", serif;
        background: ${(props) => props.theme.lightMode ? props.theme.articWhite : props.theme.articGreenDark};
        color: ${(props) => props.theme.lightMode ? props.theme.articGreyDark : props.theme.articYellow};
    }

    .clickable {
        cursor: pointer;
    }

    h1 {
        font-weight: 600;
        font-size: 2em;
    }

    div {
        font-weight: normal;
        font-size: 1em;
    }

    a {
        text-decoration: none;
        color: ${(props) => props.theme.articBlue};
        cursor: pointer;
        font-weight: 600;
        font-size: 94%;
    }

    /* ------------------------ I C O N S --------------------- */
    .icon150 {
        transform: scale(1.5);
    }
    .icon120 {
        transform: scale(1.2);
    }
    .iconCenterVertically {
        height: 100%;
    }


    /* -------------- RIGHT CLICK MENU ---------------------*/
    .react-contextmenu--visible > .react-contextmenu-item {
        background-color: ${(props) => props.theme.articWhite};
        border: 1px solid ${(props) => props.theme.articRed};
        color: ${(props) => props.theme.articRed};
        font-weight: 600;
        padding: 2px 4px 2px 4px;
        cursor: pointer;
    }
    .react-contextmenu-item:hover {
        background-color: ${(props) => props.theme.articRed};
        color: ${(props) => props.theme.articWhite};
    }
    .react-contextmenu--visible > .react-contextmenu-item:first-of-type {
        border-top-right-radius: 5px;
        border-top-left-radius: 5px;
    }
    .react-contextmenu--visible > .react-contextmenu-item:last-of-type {
        border-bottom-right-radius: 5px;
        border-bottom-left-radius: 5px;
    }



    /* --------------------- D3 --------------------- */
    .axis text,
    text.axis {
        fill: ${(props) => props.theme.lightMode ? props.theme.articGreyDark : props.theme.articYellow}; /* not color as it's SVG */
        font-size: 12px;
    }
    .legend > text {
        fill: ${(props) => props.theme.lightMode ? props.theme.articGreyDark : props.theme.articYellow}; /* not color as it's SVG */
    }
    rect.amplicon {
        stroke: white;
        stroke-width: 0.5px;
        fill: darkgray;
    }
    rect.amplicon + text, rect.gene + text {
    }
    rect.gene {
        fill: ${(props) => props.theme.lightMode ? props.theme.articYellowGrey : props.theme.articGreen};
    }
    rect.gene + text {
        font-size: 11px;
        fill: ${(props) => props.theme.lightMode ? props.theme.articGreyDark : props.theme.articYellow}; /* not color as it's SVG */
    }
    .axis path,
    .axis line {
        fill: none;
        stroke-width: 1px;
        shape-rendering: auto;
    }
    /* used in the reference stream graph hover box */
    span.hoverColourSquare {
        display: inline-block;
        width: 30px;
        height: 15px;
    }
    span.hoverColourSquare + span {
        display: inline-block;
    }
    .maxCoverageLine {
        stroke: ${(props) => props.theme.lightMode ? props.theme.articGreyDark : props.theme.articYellow};
        stroke-width: 0.75px;
    }

`

export const AppContainer = styled.div`
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
`;
