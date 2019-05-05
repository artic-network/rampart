import React, {useState, useEffect} from 'react';


const ChooseBasecalledDirectory = ({socket, changePage}) => {
  const [basecalledPath, basecalledPathSetter] = useState("/Users/naboo/github/artic-network/rampart/examples/EBOV/data/basecalled");
  const [demuxedPath, demuxedPathSetter] = useState("/Users/naboo/github/artic-network/rampart/examples/EBOV/data/demuxed");
  const [basecalledPathExists, basecalledPathExistsSetter] = useState(false);
  const [demuxedPathExists, demuxedPathExistsSetter] = useState(false);
  useEffect(() => {
    socket.on("doesPathExist", ({path, exists}) => {
      // console.log(path, exists, path === basecalledPath, basecalledPath)
      if (path === basecalledPath) {
        basecalledPathExistsSetter(exists);
      }
      if (path === demuxedPath) {
        demuxedPathExistsSetter(exists);
      }
    });
    // do we need to clean up this listener?
  });
  const setBasecalledPath = (newVal) => {
    socket.emit("doesPathExist", {path: newVal});
    basecalledPathSetter(newVal);
  }
  const setDemuxedPath = (newVal) => {
    socket.emit("doesPathExist", {path: newVal});
    demuxedPathSetter(newVal);
  }

  const submit = () => {
    const clientData = {basecalledPath, demuxedPath};
    console.log("sending basecalledAndDemuxedPaths", clientData)
    socket.emit('basecalledAndDemuxedPaths', clientData);
    changePage("loading");
  }

  return (
    <div className="centerVertically startUp">

      <h1>Please set basecalled directory to watch:</h1>

      <label>
        <input type="text" value={basecalledPath} onChange={(event) => setBasecalledPath(event.target.value)} />
      </label>
   
      <h1>Please set demuxed directory:</h1>

      <label>
        <input type="text" value={demuxedPath} onChange={(event) => setDemuxedPath(event.target.value)} />
      </label>

      {(!basecalledPathExists || !demuxedPathExists) ? (
        <p>Please enter valid paths -- 🐛🐞 </p>
      ) : (
        <p>Paths valid -- 🐛🐞</p>
      )}
      
      <button className="modernButton" onClick={submit}>lets go!</button>

    </div>
  )
}



export default ChooseBasecalledDirectory;


/*
<div>
<h1>choose basecalled directory</h1>
<p>
  This means the server doesn't know where to find basecalled files.
</p>
<p>
  Here we'll have a input box where you can define it here and inform the server
</p>
<p>
  For now, make sure to run the server with the "--basecalledDir" option and "--demuxedDir"
</p>
</div>
*/