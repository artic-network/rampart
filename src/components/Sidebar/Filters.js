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

import React, { useReducer } from 'react';
// import Toggle from "../toggle";
import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';

const Filters = ({config, setConfig, closeSidebar, dataPerSample, combinedData}) => {

    // When this Component loads, check the config for any filters already set and
    // set the internal state to mirror these
    const [state, dispatch] = useReducer(reducer, {config, dataPerSample}, init);
    // console.log("<Filters> internal state:", state)

    return (
        <div className="filters">
            <h2>Filter reads</h2>

            <p>Restrict analysis to these read lengths:</p>
            <div style={{width: 400, margin: "30px 20px 30px 20px"}}>
                <Slider.Range
                    className="slider"
                    allowCross={false}
                    marks={createRangeMarksForReadLengths(state.readLengthBoundsInData)}
                    min={state.readLengthBoundsInData[0]}
                    max={state.readLengthBoundsInData[1]}
                    step={config.display.readLengthResolution}
                    defaultValue={state.readLengthBounds}
                    onAfterChange={(data) => dispatch({type: 'readLengthBounds', data, setConfig})}
                    handle={sliderHandle}
                />
            </div>

            <p>Restrict to reads mapping to these references:</p>
            <div className="references">
                {Object.keys(state.referencesSelected).map((refName) => (
                    <div key={refName} className="item">
                        {refName}
                        <input
                            type="checkbox"
                            defaultChecked={state.referencesSelected[refName]}
                            value={state.referencesSelected[refName]}
                            onChange={() => dispatch({type: 'references', data: refName, setConfig})}
                        />
                    </div>
                ))}
            </div>

            <p>Restrict to reads which map to references with similarity:</p>
            <div style={{width: 400, margin: "30px 20px 30px 20px"}}>
                <Slider.Range
                    className="slider"
                    allowCross={false}
                    marks={{0: "0%", 20: "20%", 40: "40%", 60: "60%", 80: "80%", 100: "100%"}}
                    min={0}
                    max={100}
                    step={5}
                    defaultValue={state.refSimilarity}
                    onAfterChange={(data) => dispatch({type: 'refSimilarity', data, setConfig})}
                    handle={sliderHandle}
                />
            </div>

            <button className="modernButton" onClick={() => dispatch({type: "reset", closeSidebar, setConfig})}>
                reset filters
            </button>

            <p>{`Current filtering results in ${combinedData.mappedCount} reads mapped (${combinedData.processedCount} processed)`}</p>
        </div>
    );

};

function init({config, dataPerSample}) {
    // TODO -- pass in data here to extract appropriate values
    if (!Object.keys(config).length) {
        console.log("FATAL -- THIS HAPPENS WHEN SERVER HASN'T SENT DATA YET")
        return {};
    }
    const readLengthBoundsInData = [0, 2000]; // TODO

    const referencesSelected = {};
    Object.values(dataPerSample).forEach((d) => {
        Object.keys(d.refMatches).filter((n) => n !== "total" && n!== "unmapped").forEach((n) => {
            // TODO - enable unmapped, but it's called something different on the server
            // start with the references unselected unless included in the filter
            referencesSelected[n] = config.display.filters.references && config.display.filters.references.includes(n);
        });
    });

    return {
        readLengthBoundsInData,
        readLengthBounds: [
            config.display.filters.minReadLength || readLengthBoundsInData[0],
            config.display.filters.maxReadLength || readLengthBoundsInData[1]
        ],
        refSimilarity: [
            config.display.filters.minRefSimilarity || 0,
            config.display.filters.maxRefSimilarity || 100,
        ],
        referencesSelected,
        filters: config.display.filters,
    };
}

function reducer(state, action) {
    let newState;
    let filters = {...state.filters}; // represents filter state for the server
    switch (action.type) {
        case 'readLengthBounds':
            newState = {...state, readLengthBounds: action.data};
            if (action.data[0] !== state.readLengthBoundsInData[0]) filters.minReadLength = action.data[0];
            if (action.data[1] !== state.readLengthBoundsInData[1]) filters.maxReadLength = action.data[1];
            break;
        case 'references':
            const referencesSelected = {...state.referencesSelected};
            referencesSelected[action.data] = !referencesSelected[action.data];
            newState = {...state, referencesSelected};
            filters.references = Object.keys(referencesSelected).filter((name) => referencesSelected[name]);
            if (!filters.references.length) {
                delete filters.references;
            }
            break;
        case 'refSimilarity':
            newState = {...state, refSimilarity: action.data};
            if (action.data[0] !== 0) filters.minRefSimilarity = action.data[0];
            if (action.data[1] !== 100) filters.maxRefSimilarity = action.data[1];
            break;
        case 'reset':
            /* instead of modifying state (and getting the slider to update appropriately)
            we just close the sidebar! */
            filters = {};
            action.closeSidebar();
            break;
        default:
            console.error("ERROR: This reducer should not fallthrough.");
            return state;
    }

    console.log("Telling server to update!", filters);
    // Could (should) debounce this, as it's somewhat expensive & will appear laggy
    // As data updates on the server cannot be interrupted
    action.setConfig({filters});
    newState.filters = filters;
    return newState;
}

function createRangeMarksForReadLengths(bounds) {
    const nMarks = 5;
    const step = (bounds[1]-bounds[0]) / (nMarks-1);
    const marks = {};
    for (let i=0; i<nMarks; i++) {
        marks[bounds[0]+step*i] = `${bounds[0]+step*i}bp`;
    }
    return marks;
}

function sliderHandle(props) {
    const { value, dragging, index, ...restProps } = props;
    return (
      <Tooltip
        prefixCls="rc-slider-tooltip"
        overlay={value}
        visible={dragging}
        placement="top"
        key={index}
      >
        <Slider.Handle value={value} {...restProps} />
      </Tooltip>
    );
  };

export default Filters;
