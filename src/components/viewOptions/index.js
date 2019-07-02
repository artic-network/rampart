import React, {useState} from 'react';
import { SwatchesPicker } from 'react-color';
import { IoIosCloseCircle, IoMdColorFill } from "react-icons/io";
import { availableColours } from "../../utils/colours";
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
}

const ViewOptions = ({viewOptions, setViewOptions}) => {

  /* -----------    STATE MANAGEMENT    ------------------- */
  const [colourToPick, setColourToPick] = useState(false); // set to {name: "BC01", key: "sampleColours"} for dev
  const changeColour = (hex) => {
    const {key, name} = colourToPick;
    const newViewOptions = {}; // partial, i.e. will be merged with state in reducer
    newViewOptions[key] = Object.assign({}, viewOptions[key]);
    newViewOptions[key][name] = hex;
    setViewOptions(newViewOptions);
    setColourToPick(false);
  }
  const pickColour = ({key, name}) => {
    setColourToPick({key, name, value: viewOptions[key][name]})
  }

  console.log(viewOptions)
  // this.props.setViewOptions({logYAxis: !this.props.viewOptions.logYAxis});

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
        handleToggle={() => setViewOptions({logYAxis: !viewOptions.logYAxis})}
        toggleOn={viewOptions.logYAxis}
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
              onClick={() => pickColour({key: "sampleColours", name})}
              style={{backgroundColor: viewOptions.sampleColours[name]}}
            />
            <div>{name}</div>
          </div>
        )
      })}

      <h2>Reference colours:</h2>
      {Object.keys(viewOptions.referenceColours).map((name) => {
        return (
          <div key={name} className="colourSwatch">
            <div
              onClick={() => pickColour({key: "referenceColours", name})}
              style={{backgroundColor: viewOptions.referenceColours[name]}}
            />
            <div>{name}</div>
          </div>
        )
      })}

    </div>
  )
}

export default ViewOptions
