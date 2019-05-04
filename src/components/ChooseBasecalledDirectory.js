import React from 'react';


const ChooseBasecalledDirectory = () => {

  return (
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
  )

}



export default ChooseBasecalledDirectory;