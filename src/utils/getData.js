import { addNewReadsToState, createInitialState } from "./processServerData";

const serverAddress = process.env.NODE_ENV === "development" ? "http://localhost:3001" : "";

export const queryServerForRunConfig = (appState, setAppState) => {
  fetch(`${serverAddress}/requestRunInfo`)
    .then((res) => {
      if (res.status !== 200) throw new Error(`Server return status: ${res.status}`);
      return res;
    })
    .then((res) => res.json())
    .then((jsonData) => {
      const state = createInitialState(jsonData);
      setAppState({
        status: "Connected to server. Awaiting initial read data.",
        viewOptions: appState.viewOptions,
        ...state
      })
    })
    .catch((err) => {
      if (err.message === "Failed to fetch") {
        setAppState({status: "Offline. Querying again in 5s"});
        window.setTimeout(() => queryServerForRunConfig(appState, setAppState), 5000);
      } else {
        console.error("queryServerForRunConfig:", err)
        setAppState({status: "Could not get initial config data (check console)"});
      }
    })
}

export const requestReads = (state, setState) => {
  /* don't fetch before the run info has arrived */
  if (!state.name) return;

  fetch(`${serverAddress}/requestReads`)
    .then((res) => {
      if (res.status !== 200) throw new Error(res.statusText);
      return res;
    })
    .then((res) => res.json())
    .then((json) => {
      setState(addNewReadsToState(state, json))
    })
    .catch((err) => {
      // console.log("requestReads:", err)
      // setState({status: err});
    })
}
