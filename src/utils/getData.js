
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

const requestReads = (changeStatusCallback, addDataCallback) => {
  fetch("http://localhost:3001/requestReads")
    .then((res) => res.text()) // should never fail
    .then((responseBodyAsText) => {
      try {
        const bodyAsJson = JSON.parse(responseBodyAsText);
        const processedData = bodyAsJson.map((d) => processData(d));
        addDataCallback(processedData);
      } catch (e) {
        console.log(e)
        // console.log("requestReads -> response:", responseBodyAsText)
      }
    })
    .catch((err) => {
      console.error("Error in requestReads:", err)
      changeStatusCallback("Error fetching or setting initial data from server");
    })
}

export const getData = function getData(changeStatusCallback, addDataCallback) {
  changeStatusCallback("Querying server for data");
  requestReads(changeStatusCallback, addDataCallback);
  setInterval(
    () => requestReads(changeStatusCallback, addDataCallback),
    timeBetweenUpdates
  );
}
