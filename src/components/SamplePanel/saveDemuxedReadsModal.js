import Modal from "../modal";
import React, {useState} from 'react';
import PropTypes from "prop-types";
import { IoIosSave } from "react-icons/io";



const SaveDemuxedReads = ({config, socket, sampleName, referenceNames, dismissModal}) => {

  /* -----------    STATE MANAGEMENT    ------------------- */
  const [minReadLen, setMinReadLen] = useState(0);
  const [maxReadLen, setMaxReadLen] = useState(10000000);
  const [outputDirectory, setOutputDirectory] = useState("/Users/naboo/scratch/rampart");
  const refSelInitialState = {};
  referenceNames.forEach((name) => {refSelInitialState[name]=false});
  const [referencesSelected, _setRefSel] = useState(refSelInitialState)

  const send = () => {
    console.log("sending request to save demuxed reads")
    socket.emit('saveDemuxedReads', {sampleName, outputDirectory, filters: {minReadLen, maxReadLen}});
    dismissModal();
  }

  const barcodesMatchingThisSampleName = [];
  Object.keys(config.barcodeToName).forEach((key) => {
    if (key === sampleName) barcodesMatchingThisSampleName.push(key);
    if (config.barcodeToName[key].name === sampleName) barcodesMatchingThisSampleName.push(key);
  })


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
}


SaveDemuxedReads.propTypes = {
  referenceNames: PropTypes.array.isRequired,
  dismissModal: PropTypes.func.isRequired,
  sampleName: PropTypes.string.isRequired,
  socket: PropTypes.object.isRequired
};


export default SaveDemuxedReads;