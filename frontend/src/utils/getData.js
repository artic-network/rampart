import crossfilter from "crossfilter";

const processData = (data) => {
  // arrives as "reference","start","end","identity" (last 3 are ints)
  const asObj = data.map((d) => ({
    reference: d[0],
    start: d[1],
    end: d[2],
    identity: d[3],
    length: d[2] - d[1] + 1,
    location: (d[1] + d[2]) / 2
  }))
  return crossfilter(asObj);
}


export const getData = function getData(changeStatus, changeData) {
  changeStatus("Querying server for initial data");
  fetch("http://localhost:3001/getInitialData")
      .then((res) => res.json())
      .then((res) => {
        changeStatus("Data returned");
        const processedData = res.map((d, i) => ({
          version: 1,
          info: `Nanopore channel ${i}`,
          data: processData(d)
        }));
        changeData(processedData);
      })
      .catch((err) => {
        console.error(err)
        changeStatus("Error fetching or setting initial data from server");
      })
}
