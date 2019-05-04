import React from 'react';
import PropTypes from "prop-types";


const Config = ({data, config, setConfig, socket}) => {

  /* can't render anything useful if we haven't gotten the config from the server! */
  if (!config) {
    return (
      <p>Can't display config before we get one from the server!</p>
    );
  }


  const barcodesSeen = Object.keys(data);

  const submit = () => {
    console.log("sending new config to server")
    socket.emit('config', config);
  }

  return (
    <div>

      <h1>Set Config</h1>
      <p>Click submit when you've made modifications</p>

      <h2>Experiment Title</h2>
      <label>
        <input
          type="text"
          value={config.title}
          onChange={(event) => {setConfig(Object.assign({}, config, {title: event.target.value}))}}
        />
      </label>

      <h2>Reference Config (JSON)</h2>
      {config.reference ? (
        <div>{`Reference: ${config.reference.label}, ${config.reference.length}bp`}</div>
      ) : (
        <label>
          <input
            type="text"
            value={config.referenceConfigPath}
            onChange={(event) => {setConfig(Object.assign({}, config, {referenceConfigPath: event.target.value}))}}
          />
        </label>
      )}

      <h2>Reference Panel (FASTA)</h2>
      {config.referencePanel ? 
        config.referencePanel.map((refObj) => (
          <div key={refObj.name}>
            {`Name: ${refObj.name}${refObj.description ? `, description: ${refObj.description}` : ""}`}
          </div>

        ))
      : (
        <label>
          <input
            type="text"
            value={config.referencePanelPath}
            onChange={(event) => {setConfig(Object.assign({}, config, {referencePanelPath: event.target.value}))}}
          />
        </label>
      )}

      <h2>Barcodes</h2>
      {config.barcodes.map((bc) => {
        return (
          <label key={bc}>
            <div className={"bcLabel"}>
              {`${bc} (${barcodesSeen.includes(bc) ? "seen" : "unseen"})`}
            </div>
            <input
              type="text"
              value={config.barcodeToName[bc]}
              onChange={(event) => {
                const barcodeToName = config.barcodeToName;
                barcodeToName[bc] = event.target.value;
                setConfig(Object.assign({}, config, {barcodeToName}));
              }}
            />
          </label>
        );
      })}


      <button className="modernButton" onClick={submit}>save config</button>

    </div>
  )
}

Config.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
  setConfig: PropTypes.func.isRequired,
  socket: PropTypes.func.isRequired
};


export default Config;



/* For reference, we can add a file picker, but it's impossible to get the absolute path
(security reasons). We could load the file and send it over a socket and then process it
in the server, but that's for a later dat.

const inputFile = useRef(null) 

<input
  type='file'
  ref={inputFile}
  style={{display: 'none'}}
  onChange={(event) => {console.log(event.target.files[0]); setConfig(Object.assign({}, config, {referenceConfigPath: event.target.files[0].name}))}}
/>
<button onClick={() => inputFile.current.click()}>
  select file
</button>
*/