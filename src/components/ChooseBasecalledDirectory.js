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