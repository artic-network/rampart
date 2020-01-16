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

import React, {useState, useReducer, useEffect} from 'react';
import { IoIosArrowForward, IoIosArrowDown } from "react-icons/io";

const messageHeight = 25; // px. Dynamically set here not via CSS.

const PipelineStatus = ({time, name, message, status}) => (
  <p style={{height: messageHeight}} className={status}>
    <span>{name}</span>
    <span>{time}</span>
    {message}
  </p>
);

const PipelineLog = ({socket}) => {
  const [state, dispatch] = useReducer(reducer, new Map());
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    socket.on("pipeline", (msg) => dispatch(msg));
    return () => {
      console.log("TODO: destroy socket listener when <PipelineLog> unmounts");
    };
  }, [socket]);

  return (
    <div className={`log`} style={{height: state.size*messageHeight, maxHeight: messageHeight*10}}>

      <div>
        <span>
          {expanded ?
            <IoIosArrowDown className="icon150" onClick={() => setExpanded(false)}/> :
            <IoIosArrowForward className="icon150" onClick={() => setExpanded(true)}/>
          }
        </span>
        <h3>Pipeline logs</h3>
      </div>
      <div>
        {[...state].map(([uid, data]) => {
          const lastMsg = data.get("messages")[data.get("messages").length-1];
          return <PipelineStatus key={uid} name={data.get("name")} time={lastMsg[0]} message={lastMsg[1]} status={data.get("status")} />
        })}
      </div>

    </div>
  )
}

function reducer(state, msg) {
  const pipelineState = state.has(msg.uid) ?
    state.get(msg.uid) :
    new Map([
      ["status", "unknown"],
      ["messages", []],
      ["name", msg.name]
    ]);
  pipelineState.set("status",
    (msg.type === "init" || msg.type === "success") ? "online" :
    msg.type === "start" ? "running" :
    msg.type === "error" ? "error" :
    msg.type === "pipelineClosed" ? "offline" :
    "unknown"
  );
  pipelineState.get("messages").push([msg.time, msg.content]);
  const newState = new Map(state);
  newState.set(msg.uid, pipelineState);
  return newState;
}

export default PipelineLog;