import React from 'react';

const ReferenceMatches = ({data, config}) => {
  const refNames = config.referencePanel.map((r) => r.name);
  return (
    <table>
      <caption>Sample name - reference matches</caption>
      <thead className="sideways">
        <tr>
          <th key="space" className="rotate"></th>
          {refNames.map((refName) => (
            <th className="rotate" key={refName}><div><span>{refName}</span></div></th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Object.keys(data).filter((k) => k!=="all").map((name) => {
          return (
            <tr key={name}>
              <th key={"header"}>{name}</th>
              {refNames.map((refName) => {
                if (data[name].refMatches[refName]) {
                  return (
                    <td key={refName}>
                      {`${parseInt(data[name].refMatches[refName], 10)}%`}
                    </td>
                  )
                }
                return (
                  <td key={refName}>-</td>
                )
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const ReadCounts = ({data, config}) => {
  const names = Object.keys(data);

  return (
    <table>
      <caption>Read Counts</caption>
      <thead className="sideways">
        <tr>
          <th/>
          <th>Demuxed</th>
          <th>Mapped</th>
        </tr>
      </thead>
      <tbody>
        {names.map((name) => {
          return (
            <tr key={name}>
              <th>{name}</th>
              <td>{data[name].demuxedCount || 0}</td>
              <td>{data[name].mappedCount || 0}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  );
}

const Report = ({data, config}) => {

  if (!config || !data) {
    return (
      <div className="report">
        <h2>loading</h2>
      </div>
    )
  }

  return (
    <div className="report">
      <ReadCounts data={data} config={config}/>
      <ReferenceMatches data={data} config={config}/>
    </div>
  )

}



export default Report;


// data={data}
// referencePanel={config.referencePanel}