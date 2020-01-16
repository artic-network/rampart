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
const maxMessagesPerPipeline = 10;

const Details = ({uid, name, messages}) => {
  const messagesToShow = [...messages].reverse().slice(0, maxMessagesPerPipeline);
  console.log(messagesToShow)
  return (
    <div key={uid}>
      <h3>
        {name}
      </h3>
      {messagesToShow.map((m) => (
        <p key={`${m.time}${m.content}`} style={{height: messageHeight}} className={getStatusFromType(m.type)}>
          <span>{m.time}</span>
          <span>{m.type}</span>
          {m.content}
        </p>
      ))}
    </div>
  );
}

const PipelineLog = ({socket}) => {
  const [state, dispatch] = useReducer(reducer, new Map());
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    socket.on("pipeline", (msg) => dispatch(msg));
    return () => {
      console.log("TODO: destroy socket listener when <PipelineLog> unmounts");
    };
  }, [socket]);

  const statuses = [...state.values()].map((p) => p.get("status"));

  const height = expanded ?
    20 * messageHeight /* TO DO */ :
    messageHeight;

  return (
    <div className={`log`} style={{height, maxHeight: messageHeight*10}}>

      <div>
        <span>
          {expanded ?
            <IoIosArrowDown className="icon150" onClick={() => setExpanded(false)}/> :
            <IoIosArrowForward className="icon150" onClick={() => setExpanded(true)}/>
          }
        </span>
        <h3>Pipeline logs</h3>
      </div>
      {expanded ? (
        <div>
          {[...state].map(([uid, data]) => 
            <Details uid={uid} name={data.get("name")} messages={data.get("messages")} />
          )}
        </div>
       ) : (
        <p>
          <span>{`Running: ${statuses.filter((s) => s==="running").length}`}</span>
          <span>{`Online: ${statuses.filter((s) => s==="online").length}`}</span>
          <span>{`Error: ${statuses.filter((s) => s==="error").length}`}</span>
        </p>
      )}

    </div>
  )
}

function reducer(state, msg) {
  const pipelineState = state.has(msg.uid) ?
    state.get(msg.uid) :
    new Map([ ["messages", []], ["name", msg.name], ["status", "unknown"] ]);
  pipelineState.get("messages").push(msg);
  if (getStatusFromType(msg.type) !== "unknown") {
    pipelineState.set("status", getStatusFromType(msg.type));
  }
  const newState = new Map(state);
  newState.set(msg.uid, pipelineState);
  return newState;
}

/** Map message type to status */
const getStatusFromType = (type) => {
  if (type === "init" || type === "success") return "online";
  if (type === "start") return "running";
  if (type === "error") return "error";
  if (type === "closed") return "offline";
  return "unknown";
}

export default PipelineLog;