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
import ReactDOM from 'react-dom';
import styled from "styled-components";
import ModernButton from "../reusable/ModernButton";
import CenterHorizontally from "../reusable/CenterHorizontally"
import CenterVertically from "../reusable/CenterVertically"

const Background = styled.div`
    position: fixed;
    left: 0px;
    top: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.8);
    overflow: hidden;
    cursor: pointer;
`;

const Foreground = styled.div`
    min-width: 40vw;
    max-width: 60vw;
    min-height: 20vh;
    max-height: 60vh;
    background: ${(props) => props.theme.articWhite};
    border-radius: 10px;
    color: ${(props) => props.theme.articGreyDark};
    position: relative;
    padding: 10px;
    overflow-x: scroll;
    cursor: auto;

    > button.close-modal {
        position: absolute;
        top: 5px;
        right: 5px;
    }
`;


const Modal = ({children, dismissModal, className}) => {
  return (
    ReactDOM.createPortal(
      (
        <Background onClick={dismissModal}>
          <CenterVertically>
            <CenterHorizontally>
              <Foreground onClick={(e) => e.stopPropagation()}>
                {children}
                <ModernButton className="close-modal" onClick={dismissModal}>close</ModernButton>
              </Foreground>
            </CenterHorizontally>
          </CenterVertically>
        </Background>
      ),
      document.querySelector(`#modalPortal`)
    )
  )
};

export default Modal;
