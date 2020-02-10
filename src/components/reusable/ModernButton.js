import styled from 'styled-components';


const ModernButton = styled.button`

    display: block;
    background: ${(props) => props.theme.articRed};
    color: ${(props) => props.theme.articYellow};
    border: 1px solid ${(props) => props.theme.articYellow};
    border-radius: 3px;
    text-decoration: none;
    text-transform: uppercase;
    transition: background 0.3s, color 0.3s;
    cursor: pointer;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.2em;
    padding: 5px;
    margin: 5px;

    :hover {
        border: 1px solid ${(props) => props.theme.articYellow};
        background: ${(props) => props.theme.articYellow};
        color: ${(props) => props.theme.articRed};
    }
    > div {
        display: flex;
        justify-content: space-around;
        align-items: center;
    }
    > div > svg {
        transform: scale(1.4);
        padding: 0px 5px 0px 5px;
    }
    > div > span {
        padding-right: 5px;
    }
`;

export default ModernButton;