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

import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
    margin: 0 auto;
    font-weight: 100;
`;
const LeftText = styled.span`
    padding-right: 10px;
    font-size: 1em;
`;
const RightText = styled.span`
    padding-left: 10px;
    font-size: 1em;
`;
const Box = styled.label`
    display: inline-block;
    position: relative;
    width: 30px;
    height: 18px;
    top: 3px;
`;
const InnerSpan = styled.span`
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    height: 18px;
    border-radius: 18px;
    cursor: pointer;
`;
const Background = styled(InnerSpan)`
    width: 34px;
    background-color: ${(props) => props.unselectedColour ? props.unselectedColour :
        props.theme.lightMode ? props.theme.articGreyDark : props.theme.articGreen
    };
`;
const Slider = styled(InnerSpan)`
    width: 18px;
    right: 0px;
    background-color: ${(props) => props.theme.articBlue};
    -webkit-transition: .4s;
    transition: .4s;
`;
const Input = styled.input`
    display: none;
    &:checked ~ ${Slider} {
        transform: translateX(16px);
    }
    &:checked ~ ${Background} {
        background-color: ${(props) => props.selectedColour ? props.selectedColour : props.theme.articYellowGrey};
    }
`;


const Toggle = ({labelLeft, labelRight, toggleOn, handleToggle}) => (
  <Container>
        <LeftText>{labelLeft}</LeftText>
        <Box>
            <Input type="checkbox" onClick={handleToggle} value={toggleOn}/>
            <Background/>
            <Slider/>
        </Box>
        <RightText>{labelRight}</RightText>
  </Container>
)

export default Toggle;