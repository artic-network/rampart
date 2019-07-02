import React from 'react';
import ReactDOM from 'react-dom';


const Modal = ({children, dismissModal, className}) => {
  return (
    ReactDOM.createPortal(
      (
        <div className="modal-background clickable" onClick={dismissModal}>
          <div className="centerVertically">
            <div className="centerHorizontally">
              <div className={`modal-foreground not-clickable ${className}`} onClick={(e) => e.stopPropagation()}>
                {children}
                <button className="modernButton close-modal" onClick={dismissModal}>close</button>
              </div>
            </div>
          </div>
        </div>
      ),
      document.querySelector(`#modalPortal`)
    )
  )
};

export default Modal;
