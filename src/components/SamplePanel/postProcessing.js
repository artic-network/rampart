import React, {useState} from 'react';
import PropTypes from "prop-types";
import Modal from "../modal";
import { IoMdPlay } from "react-icons/io";


export const getPostProcessingMenuItems = (config, setPostProcessingState) => {
    return config.pipelines["post-processing"].map((obj) => ({
        label: obj.name,
        callback: () => setPostProcessingState(obj)
    }));
}


export const PostProcessingRunner = ({pipeline, dismissModal, socket, sampleName}) => {
  if (!pipeline) return null;

  const send = () => {
    console.log("triggerPostProcessing")
    socket.emit('triggerPostProcessing', {pipeline, sampleName});
    dismissModal();
  }

  return (
    <Modal dismissModal={dismissModal}>
      <h2>Pipeline Triggering Modal</h2>
      <h2>{pipeline.name}</h2>
      <p>options and settings here...</p>
      <button className="modernButton" onClick={send}>
        <div><IoMdPlay/><span>TRIGGER</span></div>
      </button>
    </Modal>
  )
}

PostProcessingRunner.propTypes = {
  dismissModal: PropTypes.func.isRequired,
  sampleName: PropTypes.string.isRequired,
  pipeline: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]).isRequired,
  socket: PropTypes.object.isRequired
};
