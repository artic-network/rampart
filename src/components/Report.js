import React from 'react';

const RefMatches = ({data, config}) => {

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
      <RefMatches data={data} config={config}/>
    </div>
  )

}



export default Report;


// data={data}
// referencePanel={config.referencePanel}