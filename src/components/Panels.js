import React from 'react';
// import PropTypes from "prop-types";
import SamplePanel from "./SamplePanel"
import OverallSummaryPanel from "./OverallSummaryPanel";

const Panels = ({dataPerSample, combinedData, viewOptions, config, openConfigSidebar, socket}) => {
    if (!dataPerSample || !combinedData) {
        return (
            <h1>????</h1>
        );
    }

    return (
        <>
            <OverallSummaryPanel
                viewOptions={viewOptions}
                combinedData={combinedData}
                dataPerSample={dataPerSample}
                key={"overall"}
                config={config}
            />
            {Object.keys(dataPerSample).map((name) => (
                <SamplePanel
                    sampleName={name}
                    sampleData={dataPerSample[name]}
                    sampleColour={viewOptions.sampleColours[name]}
                    key={name}
                    viewOptions={viewOptions}
                    reference={config.reference}
                    socket={socket}
                    config={config}
                />
            ))}
        </>
    )
}


export default Panels;
