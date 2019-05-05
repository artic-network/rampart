import React from 'react';


const ViewOptions = ({viewOptions}) => {

  return (
    <div className="viewOptions">
      <h4>{`log y axis: ${viewOptions.logYAxis}`}</h4>
      <div>{`(TODO: toggle. Can press "l" in the meantime)`}</div>

      <h2>Sample colours:</h2>
      {Object.keys(viewOptions.sampleColours).map((name) => {
        return (
          <div>
            <span>{name}</span>
            <div style={{width: "100px", height: "30px", backgroundColor: viewOptions.sampleColours[name]}}/>
          </div>
        )
      })}

      <h2>Reference colours:</h2>
      {Object.keys(viewOptions.referenceColours).map((name) => {
        return (
          <div>
            <span>{name}</span>
            <div style={{width: "100px", height: "30px", backgroundColor: viewOptions.referenceColours[name]}}/>
          </div>
        )
      })}
    </div>
  )
}

export default ViewOptions
