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

import React, {useState, useReducer, useEffect, useCallback} from 'react';
import { IoIosArrowDropdownCircle, IoIosArrowDropupCircle, IoIosAlert, IoIosCloseCircle } from "react-icons/io";
import { PipelineContainer } from "./styles";

// const messageHeight = 25; // px. Dynamically set here not via CSS.
// const maxMessagesPerPipeline = 10;

const Pipeline = ({pipelineKey: key, data, socket}) => {
  const [expanded, setExpanded] = useState(false);
  const terminate = useCallback(() => {
    console.log("Instructing server to terminate pipeline ", key);
    socket.emit('terminatePostProcessing', {key});
  }, [key, socket]);

  const messages = [...data.get("messages")].reverse()
  if (!messages.length) return null;
  const status = data.get("status");



  return (
    <PipelineContainer status={status} key={key}>

      <div className="topRow">

        <span className="chevron">
          {expanded ? 
            <IoIosArrowDropupCircle className="icon150" onClick={() => setExpanded(false)}/> :
            <IoIosArrowDropdownCircle className="icon150" onClick={() => setExpanded(true)}/>
          }
        </span>

        <h3>{`Pipeline: ${data.get("name")}`}</h3>


        <span>{status}</span>
        
        {status === "running" ? (
          <span className="rightIcon clickable">
            <IoIosCloseCircle className="icon150" color="#e06962" onClick={terminate}/>
          </span>
        ) : status === "error" ? (
          <span className="rightIcon">
            <IoIosAlert className="icon150" color="#F6EECA" />
          </span>
        ) : null }


      </div>

      {expanded ? messages.map((m) => (
        <div className="msg" key={`${m.time}${m.content}`}>
          <span className="padright">{m.time}</span>
          <span className="padright">{m.type}</span>
          {m.content}
        </div>
      )) : null}

    </PipelineContainer>
  )
}


const PipelineLog = ({socket}) => {
  const [state, dispatch] = useReducer(reducer, new Map());
  useEffect(() => {
    socket.on("pipeline", (msg) => dispatch(msg));
    return () => {
      console.log("TODO: destroy socket listener when <PipelineLog> unmounts");
    };
  }, [socket]);
  return (
    <div>
      {[...state].map(([key, data]) => (
        <Pipeline key={key} pipelineKey={key} data={data} socket={socket}/>
      ))}
    </div>
  );
}

function reducer(state, msg) {
  if (!msg) return state;

  const pipelineState = state.has(msg.key) ?
    state.get(msg.key) :
    new Map([ ["messages", []], ["name", msg.name], ["status", "unknown"] ]);
  pipelineState.get("messages").push(msg);
  if (getStatusFromType(msg.type) !== "unknown") {
    pipelineState.set("status", getStatusFromType(msg.type));
  }
  const newState = new Map(state);
  newState.set(msg.key, pipelineState);
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