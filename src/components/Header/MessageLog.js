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

import React, {useState} from 'react';
import { IoIosArrowForward, IoIosArrowDown } from "react-icons/io";

const messageHeight = 25; // px. Dynamically set here not via CSS.

const Message = ({time, message}) => (
  <p style={{height: messageHeight}}>
    <span>{time}</span>
    {message}
  </p>
);

const MessageLog = ({messages}) => {
  const [expanded, setExpanded] = useState(false);
  const messagesToShow = expanded ?
    [...messages].reverse().slice(0, 100) :
    [messages[messages.length-1]];

  return (
    <div className={`log`} style={{height: messagesToShow.length*messageHeight, maxHeight: messageHeight*10}}>
      <span>
        {expanded ?
          <IoIosArrowDown className="icon150" onClick={() => setExpanded(false)}/> :
          <IoIosArrowForward className="icon150" onClick={() => setExpanded(true)}/>
        }
      </span>
      <h3>Server messages</h3>
      <div>
        {messagesToShow.map((m) => (
          <Message time={m[0]} message={m[1]} key={`${m[0]}${m[1]}`}/>
        ))}
      </div>

    </div>
  )
}

export default MessageLog;