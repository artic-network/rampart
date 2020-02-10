import styled from 'styled-components';


const HeaderContainer = styled.div`

    width: 100%;
    margin: auto;
    background-color: ${(props) => props.theme.articGreen};
    color: ${(props) => props.theme.articYellow};
    border-radius: 5px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    min-height: 155px;

    /* Following transferred from the rampart.css -- can be turned into
    styled components as desired */

    .logo {
        float: left;
        margin: 5px;
        margin-right: 20px;
    }
    .title {
        white-space: nowrap;
        overflow: hidden;
    }
    .buttons {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        margin-left: auto;
        padding: 20px 10px 20px 0;
        min-width: 125px;
    }
    h3 {
        margin: 2px;
        font-weight: normal;
    }
    .log {
        display: flex;
        flex-direction: row;
        overflow-x: hidden;
        overflow-y: scroll;
        width: 100%;
        padding-top: 5px;
        -moz-transition: height 1s ease-in-out;
        -webkit-transition: height 1s ease-in-out;
        -o-transition: height 1s ease-in-out;
        transition: height 1s ease-in-out;
    }
    .log h3 {
        margin: -3px 20px 0px 10px;
        display: inline;
    }
    span.chevron {
        cursor: pointer;
        padding-left: 10px;
    }
    /* Individual messages are paragraphs */
    .log p {
        margin: 0;
    }
    .log p > span {
        display: inline-block;
        width: 100px;
    }

`;

export const PipelineContainer = styled.div`
    border: thin solid ${(props) => props.theme.themeTextColour};
    width: 99%;
    border-radius: 5px;
    padding: 5px 0px 3px 0px;
    margin-bottom: 5px;
    overflow-x: hidden;
    overflow-y: scroll;
    max-height: 200px;

    background-color: ${(props) =>
        props.status === "error" ? props.theme.articRed :
        props.status === "running" ? props.theme.articGreenLight :
        null
    };

    h3 {
        margin: -3px 20px 0px 7px;
        width: 20%;
        overflow-x: hidden;
    }
    .topRow {
        display: flex;
        flex-direction: row;
    }
    .msg {
        padding-left: 40px;
    }
    .padright {
        padding-right: 20px;
    }
    .rightIcon {
        margin-left: auto;
        padding-right: 10px;
    }
`;

export default HeaderContainer;