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

import Modal from "../modal";
import React, {useState} from 'react';
import PropTypes from "prop-types";
import { IoIosSave } from "react-icons/io";

/* AS OF OCT 10 THIS FILE IS UNUSED.

It is kept while the `PostProcessingRunner` is being developed as it may use some of
the same design implementations
*/

const SaveDemuxedReads = ({config, socket, sampleName, referenceNames, dismissModal}) => {

  /* -----------    STATE MANAGEMENT    ------------------- */
  const [minReadLen, setMinReadLen] = useState(0);
  const [maxReadLen, setMaxReadLen] = useState(10000000);
  const [outputDirectory, setOutputDirectory] = useState("/Users/naboo/scratch/rampart");
  const refSelInitialState = {};
  referenceNames.forEach((name) => {refSelInitialState[name]=false});
  const [referencesSelected, _setRefSel] = useState(refSelInitialState);

  const send = () => {
    console.log("sending request to save demuxed reads");
    socket.emit('saveDemuxedReads', {sampleName, outputDirectory, filters: {minReadLen, maxReadLen}});
    dismissModal();
  };

  const barcodesMatchingThisSampleName = [];
  Object.keys(config.barcodeToName).forEach((key) => {
    if (key === sampleName) barcodesMatchingThisSampleName.push(key);
    if (config.barcodeToName[key].name === sampleName) barcodesMatchingThisSampleName.push(key);
  });


  return (
    <Modal dismissModal={dismissModal}>
      <h2>Save demuxed reads</h2>
      <p>{`Sample "${sampleName}" comprising barcodes ${barcodesMatchingThisSampleName.join(",")}`}</p>

      <h3>Choose References</h3>
      <p>Only reads with a best hit to these references will be exported</p>
      <p>TODO -- this has no effect currently</p>
      <div className="save-reads-refereences-containter">
        {referenceNames.map((refName) => (
          <div key={refName}>
            {refName}
            <input type="checkbox" value={referencesSelected[refName]} onClick={() => console.log(refName)}/>
          </div>
        ))}
      </div>

      <h3>Choose Read Lengths</h3>
      <p>Only reads between these values will be exported</p>
      Min:
      <input type="text" value={minReadLen} onChange={(e) => setMinReadLen(e.target.value)}/>
      Max:
      <input type="text" value={maxReadLen} onChange={(e) => setMaxReadLen(e.target.value)}/>
      
      <h3>Choose output directory</h3>
      <p>WARNING: currently this must exist, files will be overwritten, and existing files won't be cleared first!</p>
      <input className="wide" type="text" value={outputDirectory} onChange={(e) => setOutputDirectory(e.target.value)}/>

      <button className="modernButton" onClick={send}>
        <div><IoIosSave/><span>save reads</span></div>
      </button>

    </Modal>
  )
};


SaveDemuxedReads.propTypes = {
  referenceNames: PropTypes.array.isRequired,
  dismissModal: PropTypes.func.isRequired,
  sampleName: PropTypes.string.isRequired,
  socket: PropTypes.object.isRequired
};


export default SaveDemuxedReads;