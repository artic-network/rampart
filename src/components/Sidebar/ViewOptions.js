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
import { SwatchesPicker } from 'react-color';
import { IoIosCloseCircle, IoMdColorFill } from "react-icons/io";
import { availableColours } from "../../utils/colours";
import { getLogYAxis } from "../../utils/config";
import Toggle from "../toggle";

const ColourPicker = ({currentColour, name, onChange, onCancel}) => {
  return (
    <div className="centerHorizontally">
      <div className="colorPickerContainer">
        <h3>{`Choose colour for ${name}`}</h3>
        <SwatchesPicker
          width={350}
          height={550}
          color={currentColour}
          colors={availableColours}
          onChangeComplete={(c) => {onChange(c.hex)}}
        />
        <button className="modernButton" onClick={onCancel}>
          <div><IoIosCloseCircle/><span>cancel</span></div>
        </button>
      </div>
    </div>
  )
};

const ViewOptions = ({config, setConfig, viewOptions, setViewOptions}) => {
  /* -----------    STATE MANAGEMENT    ------------------- */
  const [colourToPick, setColourToPick] = useState(false); // set to {name: "BC01", key: "sampleColours"} for dev
  const changeColour = (hex) => {
    const {key, name, idx} = colourToPick;
    /* this is in flux as we migrate all the colours from viewOptions to the config */
    if (key === "referenceColours") {
      config.referencePanel[idx].colour = hex; /* probably shouldn't modify in place */
      setColourToPick(false);
      setConfig({config});
      return;
    }
    const newViewOptions = {}; // partial, i.e. will be merged with state in reducer
    newViewOptions[key] = Object.assign({}, viewOptions[key]);
    newViewOptions[key][name] = hex;
    setViewOptions(newViewOptions);
    setColourToPick(false);
  };

  if (!Object.keys(config).length) return (
    <div className={`viewOptions`}>
      <h2>No config set</h2>
    </div>
  );

  /* ---------  RENDER  ------------- */
  if (Object.keys(colourToPick).length) {
    return (
      <div className="viewOptions">
        <ColourPicker currentColour={colourToPick.value} name={colourToPick.name} onChange={changeColour} onCancel={() => setColourToPick(false)}/>
      </div>
    )
  }

  return (
    <div className={`viewOptions`}>

      <h2>Graph options</h2>
      <Toggle
        labelLeft="Log (y) axis"
        handleToggle={() => setConfig({logYAxis: !getLogYAxis(config)})}
        toggleOn={getLogYAxis(config)}
      />

      <h2>{"Sample & Reference colours"}</h2>
      <p>
        <span>{"Click on any colour to change it "}</span>
        <IoMdColorFill className="icon150"/>
      </p>
      {Object.keys(viewOptions.sampleColours).filter((name) => name!=="all").map((name) => {
        return (
          <div key={name} className="colourSwatch">
            <div
              onClick={() => setColourToPick({key: "sampleColours", name, value: viewOptions.sampleColours[name]})}
              style={{backgroundColor: viewOptions.sampleColours[name]}}
            />
            <div>{name}</div>
          </div>
        )
      })}

      {/*<h2>Reference colours:</h2>*/}
      {/*{config.referencePanel.map((info, idx) => (*/}
        {/*<div key={info.name} className="colourSwatch">*/}
          {/*<div*/}
            {/*onClick={() => setColourToPick({key: "referenceColours", name: info.name, idx: idx, value: info.colour})}*/}
            {/*style={{backgroundColor: info.colour}}*/}
          {/*/>*/}
          {/*<div>{`${info.name} (${info.display})`}</div>*/}
        {/*</div>*/}
      {/*))}*/}
    </div>
  )
};

export default ViewOptions


// {Object.keys(viewOptions.referenceColours).map((name) => {
//   return (
//     <div key={name} className="colourSwatch">
//       <div
//         onClick={() => pickColour({key: "referenceColours", name})}
//         style={{backgroundColor: viewOptions.referenceColours[name]}}
//       />
//       <div>{name}</div>
//     </div>
//   )
// })}