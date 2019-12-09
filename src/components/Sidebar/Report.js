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

import React from 'react';
import {makeTimeFormatter} from "../../utils/commonFunctions";

const TimeInfo = ({data}) => {
  const timeFormatter = makeTimeFormatter();
  const maxTime = Object.values(data).reduce((maxTime, sampleData) => {
    if (sampleData.temporal.length && sampleData.temporal[sampleData.temporal.length-1].time > maxTime) {
      return sampleData.temporal[sampleData.temporal.length-1].time;
    }
    return maxTime
  }, 0);
  return (
    <div>
      <div className="caption">Time Information</div>
      <div>{`Latest FASTQ indicates run time of ${timeFormatter(maxTime)}`}</div>
    </div>
  )
};

const CurrentCoverageStats = ({data, config}) => {
    const coverageThresholds = config.display.coverageThresholds;
    const names = Object.keys(data).filter((name) => name!=="all");

  return (
    <table>
      <caption>Approx Genome Coverages</caption>
      <thead className="sideways">
        <tr>
          <th/>
                {Object.keys(coverageThresholds).map((label) => {
                    return (
                        <th>{label}</th>
                    );
                }
            )}
        </tr>
      </thead>
      <tbody>
        {names.map((name) => {
          if (!data[name].temporal.length) {
            return (
              <tr key={name}>
              <th>{name}</th>
            </tr>
            )
          }
          const temporalData = data[name].temporal[data[name].temporal.length-1];
          return (
            <tr key={name}>
              <th>{name}</th>
                {Object.keys(temporalData.coverages).map((label) => {
                        return (
                            <td>{temporalData.coverages[label].toFixed(2) + "%"}</td>
                        );
                    }
                )}
            </tr>
          )
        })}
      </tbody>
    </table>
  );
};


const ReferenceMatches = ({data, config}) => {
  const refNames = config.genome.referencePanel.map((r) => r.name);
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
                    const count = parseInt(data[name].refMatches[refName]);
                    const total = parseInt(data[name].refMatches['total']);
                    const percent = (100.0 * count) / total;
                  return (
                    <td key={refName}>
                      {`${percent.toFixed(2)}%`}
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
};

const ReadCounts = ({data, config}) => {
  const names = Object.keys(data);

  const getReadLengths = (readLengths) => {
    if (!readLengths.xyValues.length || readLengths.xyValues[0][0] === null) {
      return {min: "NA", mode: "NA", max: "NA", median: "NA"};
    }
    /* must get rid of the 0 count entries, which are added for viz purposes */
    const xyVals = readLengths.xyValues.filter((xy) => xy[1]!==0);
    const min = xyVals[0][0] | 0;
    const max = xyVals[xyVals.length-1][0] | 0;
    const n = xyVals.reduce((pv, cv) => pv+cv[1], 0);
    const medianIdx = xyVals.reduce(
      (acc, cv, idx) => acc[1]>n/2 ? acc : [idx, acc[1] + cv[1]],
      [0, 0] // [0]: idx, [1]: total of counts seen thus far
    )[0];
    const mode = xyVals.reduce(
      (acc, cv) => acc[1] > cv[1] ? acc : cv,
      [0, 0] // [0]: x value with max count so far, [1]: max count so far
    );
    return {min: min+"bp", max: max+"bp", median: `${xyVals[medianIdx][0]}bp`, mode: `${mode[0]}bp (n=${mode[1]})`}
  };

  return (
    <table>
      <caption>Reads (rounded to 10bp)</caption>
      <thead className="sideways">
        <tr>
          <th/>
          <th>n(mapped)</th>
          <th className="spaceLeft">Min Len</th>
          <th>Max Len</th>
          <th>Median</th>
          <th>Mode</th>
        </tr>
      </thead>
      <tbody>
        {names.map((name) => {
          const readLengths = getReadLengths(data[name].readLengths);
          return (
            <tr key={name}>
              <th>{name}</th>
              <td>{data[name].mappedCount || 0}</td>
              <td className="spaceLeft">{readLengths.min}</td>
              <td>{readLengths.max}</td>
              <td>{readLengths.median}</td>
              <td>{readLengths.mode}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  );
};


const Report = ({dataPerSample, config}) => {

  if (!config || !dataPerSample) {
    return (
      <div className="report">
        <h2>loading</h2>
      </div>
    )
  }

  return (
    <div className="report">
      <TimeInfo data={dataPerSample}/>
      <ReadCounts data={dataPerSample} config={config}/>
      <ReferenceMatches data={dataPerSample} config={config}/>
      <CurrentCoverageStats data={dataPerSample} config={config}/>
    </div>
  )

}

export default Report;
