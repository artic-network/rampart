import styled from 'styled-components';

export const Container = styled.div`
    margin: auto;
    height: 100%;
    max-height: 350px;
    position: relative;
    width: ${(props) => props.width};
`;

export const Title = styled.div`
    text-align: center;
    font-weight: 300;
    font-size: 1.0em;
    white-space: nowrap;
    padding-right: 25px; /* to stop icon overlap */
`;

export const HoverInfoBox = styled.div`
    z-index: 20;
    position: absolute;
    border-radius: 5px;
    padding: 5px;
    margin: auto;
    background-color: ${(props) => props.theme.lightMode ? props.theme.articGreen : props.theme.articRed};
    color: ${(props) => props.theme.articWhite};
    pointer-events: none;
    visibility: hidden;
    font-size: 14px;
    font-weight: 700;
    overflow-wrap: break-word;
    max-width: ${(props) => props.width};
`;

export default Container;