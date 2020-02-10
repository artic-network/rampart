import styled from 'styled-components';


const Container = styled.div`
    position: absolute;
    max-width: 85%;
    overflow-x: scroll;
    height: 95%;
    color: ${(props) => props.theme.articYellow};
    background: ${(props) => props.theme.articGreen};
    padding: 10px;
    border: 3px solid ${(props) => props.theme.articRed};
    border-radius: 10px;
    transition: 0.5s ease-out;
    right: 0px;


    &.closed {
        right: -500px;
    }
    &.open {
        right: 5px;
    }
    .sidebar input.hidden {
        display: none;
    }
    .sidebar .inner {
        height: 100%;
        overflow: scroll;
    }
    .sidebar .topRight {
        position: absolute;
        right: 10px;
        top: 10px;
    }

`

export const ReportContainer = styled.div`
    min-width: 70vw; /* sidebar's max width */

    caption {
        padding-top: 40px;
        text-align: left;
    }
    table {
        border-collapse: collapse;
        border-spacing: 0;
    }
    td {
        border-top: 1px solid ${(props) => props.theme.articYellow};
        border-bottom: 1px solid ${(props) => props.theme.articYellow};
    }
    th {
        border: none;
        padding: 2px 3px 2px 3px;
    }
    td {
        padding: 2px 4px 2px 4px;
    }
    .spaceLeft {
        padding-left: 50px
    }
    div.caption,
    caption {
        color: ${(props) => props.theme.articRed};
        font-size: 1.5em;
        font-weight: 600;
    }
    th.rotate > div {
        /* see https://css-tricks.com/rotated-table-column-headers/ */
        transform: translate(27px, -16px) rotate(315deg); /* magic numbers */
        width: 45px;
    }
    th.rotate > div > span {
        /* the underlining of rotated labels */
        padding: 0px 0px 10px 0px;
        border-bottom: 0.5px dashed ${(props) => props.theme.foregroundColour};
        font-weight: 600;
    }
    th.rotate {
        padding-top: 135px; /* must calculate */
        border: none
    }
`;

export const ConfigContainer = styled.div`
    div.fileDropZone {
        width: 200px;
        height: 24px;
        border: 1px dashed ${(props) => props.theme.articRed};
        display: inline-block;
        margin-right: 20px;
        text-align: center;
        padding-top: 4px;
        font-weight: 600;
    }
    div.fileDropZone.dragging {
        background-color: ${(props) => props.theme.articRed};
    }
    div + button {
        display: inline-block;
    }
    input {
        border-radius: 3px;
        border: 2px solid ${(props) => props.theme.articRed};
        background-color: ${(props) => props.theme.articWhite};
        color: ${(props) => props.theme.articDarkGrey};
        font-size: 16px;
        margin-left: 10px;
        height: 22px;
        padding: 4px;
    }
    label {
        display: block;
        padding: 5px;
    }
    .bcLabel {
        display: inline-block;
        min-width: 100px;
    }
    input.wide {
        width: 90%;
    }
`;

export const FiltersContainer = styled.div`

    .references {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        margin: 0px 20px;
    }
    .references .item {
        padding-right: 30px;
    }
    .references .item > input:checked {
        background-color: ${(props) => props.theme.articRed};
    }

    .slider .rc-slider-track {
        background-color: ${(props) => props.theme.articRed};
    }
    .slider .rc-slider-mark-text-active {
        color: ${(props) => props.theme.articRed};
    }
    .slider .rc-slider-handle {
        border-color: ${(props) => props.theme.articRed};
    }
    .slider .rc-slider-handle:hover {
        border-color: ${(props) => props.theme.articRed};
        background-color: ${(props) => props.theme.articRed};
    }
    .slider .rc-slider-dot-active {
        border-color: ${(props) => props.theme.articRed};
    }
`;



export default Container;