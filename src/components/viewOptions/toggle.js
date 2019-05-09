import React from 'react';


const Toggle = ({labelLeft, labelRight, toggleOn, handleToggle}) => (
  <div className="toggle">

    <span>
      {labelLeft}
    </span>

    <label>
        <span className="background"/>
        <input type="checkbox" onClick={handleToggle} value={toggleOn}/>
        <span className={`slider round`}/>
    </label>

    <span>
      {labelRight}
    </span>

  </div>
)

export default Toggle;