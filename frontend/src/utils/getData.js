
export const getData = function getData(changeStatus, changeData) {
  changeStatus("Querying server for initial data");
  fetch("http://localhost:3001/getInitialData")
      .then((res) => res.json())
      .then((res) => {
        changeStatus("Data returned");
        changeData(res)
      })
      .catch((err) => {
        console.error(err)
        changeStatus("Error fetching or setting initial data from server");
      })
}
