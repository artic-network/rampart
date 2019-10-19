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

import React, {useRef, useState, useReducer} from 'react';
import PropTypes from "prop-types";
import Select from "react-select";
import { IoIosSave } from "react-icons/io";

/* not sure how to do the following in CSS, as the current webpack
transforms mangle all the CSS classnames */
const customReactSelectStyles = {
    option: (provided) => ({
        ...provided,
        color: 'black',
        fontWeight: 600
    })
};

const ArticConfigSelection = ({items, setter, choice}) => (
    <div className="selectDropdown">
        <Select
            placeholder="Select ARTIC premade config:"
            // options={[{label: "Remove selection", value: undefined}, ...items]}
            styles={customReactSelectStyles}
            value={choice}
            onChange={(selection) => setter(selection)}
        />
    </div>
);


/**
 * Handler for dropped files (e.g. FASTA / JSON) to read and store as a string
 * using the provided `setter`.
 * @param {DataTransfer} file
 * @param {string} type
 * @param {function} setter
 */
const handleDroppedFile = (file, type, setter) => {
    const fileNameLower = file.name.toLowerCase() || file.toLowerCase();
    if (
        (type === "refFASTA" && !(fileNameLower.endsWith(".fasta") || fileNameLower.endsWith(".fas") || fileNameLower.endsWith(".mfa"))) ||
        (type === "refJSON" && !fileNameLower.endsWith(".json"))
    ) {
        console.error(`Dropped file ${file.name} has incorrect extension`);
        return;
    }
    const reader = new FileReader();
    reader.onload = function (event) {
        setter(event.target.result);
    };
    reader.onerror = function (event) {
        console.error("Error reading reference FASTA")
        setter(false);
    }
    reader.readAsText(file);
}

const SaveConfig = ({handleClick}) => (
    <button className="modernButton" onClick={handleClick}>
        <div><IoIosSave/><span>save config</span></div>
    </button>
)


const reducer = (prevState, updatedProperty) => ({...prevState, ...updatedProperty});

const Config = ({config, setConfig, closeSidebar}) => {
    /* since changing config is done on the server (the client just displays
     * it) we want to maintain a copy here, and then send it to the server
     * when we're all done */
    const [modifiedConfig, setModifiedConfig] = useReducer(reducer, JSON.parse(JSON.stringify(config)));
    const refPanelChooser = useRef();
    const [refPanelDropperHover, setRefPanelDropperHover] = useState(false);
    const [refPanelFileDropped, setRefPanelFileDropped] = useState(undefined);
    const refConfigChooser = useRef();
    const [refConfigDropperHover, setRefConfigDropperHover] = useState(false);
    const [refConfigFileDropped, setRefConfigFileDropped] = useState(undefined);
    const [refConfigArticSelection, setRefConfigArticSelection] = useState(undefined);

    /* data checks to avoid trying to render things before it's appropriate */
    if (!Object.keys(config).length) {
        return (
            <p>Can't display config before we get one from the server!</p>
        );
    }

    const submit = () => {
        console.log(modifiedConfig);
        setRefPanelFileDropped(false);
        setRefConfigFileDropped(false);
        const dataForServer = {config: modifiedConfig, refFasta: refPanelFileDropped, refJsonString: refConfigFileDropped};
        if (refConfigArticSelection) {
            dataForServer.refJsonPath = refConfigArticSelection.value;
        }
        setConfig(dataForServer);
        closeSidebar();
    }

    return (
        <div className="config" onDrop={(e) => {e.preventDefault()}}>

            <h1>Set Config</h1>
            <p style={{maxWidth: "600px"}}>
                {`Select the configuration to run RAMPART. At a minimum you need to provide a path to the folder
          where the basecalled reads are being put and a FASTA file with one or more reference sequences
          in it. These options can also be set on the command-line or in the config files. Once started,
          these options can't be changed.`}
            </p>
            <p>Click "save config" when you've made modifications</p>

            <SaveConfig handleClick={submit}/>

            <h2>Experiment Title{modifiedConfig.run.title ? ": " + modifiedConfig.run.title : ""}</h2>
            { !modifiedConfig.run.title ? (
                <label>
                    <input
                        type="text"
                        className="wide"
                        value={modifiedConfig.run.title}
                        onChange={(event) => {setModifiedConfig({title: event.target.value})}}
                    />
                </label>
            ) : (
                <div/>
            )
            }

            <h2>Basecalled read folder</h2>
            {modifiedConfig.run.basecalledPath ? (
                <div>{`${modifiedConfig.run.basecalledPath}`}</div>
            ) : refConfigFileDropped ? (
                <div>Path set -- click submit</div>
            ) : (refConfigArticSelection && refConfigArticSelection.value) ? (
                <ArticConfigSelection items={modifiedConfig.exampleConfigPaths} setter={setRefConfigArticSelection} choice={refConfigArticSelection}/>
            ) : (
                <div>
                    {/*<ArticConfigSelection items={modifiedConfig.exampleConfigPaths} setter={setRefConfigArticSelection} choice={refConfigArticSelection}/>*/}
                    <div
                        className={`fileDropZone ${refConfigDropperHover ? "dragging" : ""}`}
                        onDragEnterCapture={() => setRefConfigDropperHover(true)}
                        onDragOver={(e) => {e.preventDefault()}}
                        onDragExitCapture={() => setRefConfigDropperHover(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setRefPanelDropperHover(false);
                            handleDroppedFile(e.dataTransfer.files[0], "refFasta", setRefConfigFileDropped);
                        }}
                    >
                        drop folder here
                    </div>
                    <button className="modernButton" onClick={() => refConfigChooser.current.click()}>
                        choose file
                    </button>
                    <input
                        className="hidden"
                        type='file'
                        ref={refConfigChooser}
                        onChange={(e) => {handleDroppedFile(e.target.files[0], "refJSON", setRefConfigFileDropped);}}
                    />
                </div>
            )
            }

            <h2>Reference Panel (FASTA)</h2>
            {modifiedConfig.run.referencesPanel ? (
                <div>{`${modifiedConfig.run.referencesPanel}`}</div>
            ) : refPanelFileDropped ? (
                <div>File loaded -- click submit!</div>
            ) : (
                <div>
                    <div
                        className={`fileDropZone ${refPanelDropperHover ? "dragging" : ""}`}
                        onDragEnterCapture={() => setRefPanelDropperHover(true)}
                        onDragOver={(e) => {e.preventDefault()}}
                        onDragExitCapture={() => setRefPanelDropperHover(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setRefPanelDropperHover(false);
                            handleDroppedFile(e.dataTransfer.files[0], "refFASTA", setRefPanelFileDropped);
                        }}
                    >
                        drop FASTA here
                    </div>
                    <button className="modernButton" onClick={() => refPanelChooser.current.click()}>
                        choose file
                    </button>
                    <input
                        className="hidden"
                        type='file'
                        ref={refPanelChooser}
                        onChange={(e) => {handleDroppedFile(e.target.files[0], "refFasta", setRefPanelFileDropped);}}
                    />
                </div>
            )
            }

            <h2>Barcodes</h2>
            {Object.keys(modifiedConfig.run.barcodeNames)
                .sort((a, b) => modifiedConfig.run.barcodeNames[a].order > modifiedConfig.run.barcodeNames[b].order ? 1 : -1)
                .map((barcodeName) => {
                    return (
                        <label key={barcodeName}>
                            <div className={"bcLabel"}>
                                {`${barcodeName}`}
                            </div>
                            <input
                                type="text"
                                value={modifiedConfig.run.barcodeNames[barcodeName].name}
                                onChange={(event) => {
                                    modifiedConfig.run.barcodeNames[barcodeName].name = event.target.value;
                                }}
                            />
                            {/* TODO -- add ordering box / dragger here */}
                        </label>
                    );
                })}


            <SaveConfig handleClick={submit}/>

        </div>
    )
}

Config.propTypes = {
    config: PropTypes.object.isRequired,
    setConfig: PropTypes.func.isRequired
};


export default Config;
