
// arrives as "channel", "reference","start","end","identity"
// all are INTs except reference (string)
const processData = (d) => ({
  channel: d[0],
  reference: d[1],
  start: d[2],
  end: d[3],
  identity: d[4],
  length: d[3] - d[2] + 1,
  location: (d[2] + d[3]) / 2
})

const timeBetweenUpdates = 2000;

const prefix = process.env.NODE_ENV === "development" ? "http://localhost:3001" : "";

const requestReads = (changeStatusCallback, addDataCallback) => {
  fetch(`${prefix}/requestReads`)
    .then((res) => res.text()) // should never fail
    .then((responseBodyAsText) => {
      try {
        const bodyAsJson = JSON.parse(responseBodyAsText);
        const processedData = bodyAsJson.map((d) => processData(d));
        changeStatusCallback("Periodically fetching reads");
        addDataCallback(processedData);
      } catch (e) {
        console.log(responseBodyAsText)
        changeStatusCallback(responseBodyAsText);
      }
    })
    .catch((err) => {
      console.error("Error in requestReads:", err)
      changeStatusCallback("Error fetching data");
    })
}

export const getData = function getData(changeStatusCallback, setRunInfoCallback, addDataCallback) {
  changeStatusCallback("Querying server for data");

  fetch(`${prefix}/requestRunInfo`)
    .then((res) => res.json())
    .then((jsonData) => {
      // console.log("setting run info to:", jsonData)
      setRunInfoCallback(jsonData);
      changeStatusCallback("Connected. Awaiting initial read data.");
      setInterval(
        () => requestReads(changeStatusCallback, addDataCallback),
        timeBetweenUpdates
      );
    })
    .catch((err) => {
      console.error("Error in requestReads:", err)
      changeStatusCallback("Error fetching or setting initial data from server");
    })
}
