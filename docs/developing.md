# Developing RAMPART

## Developing the client
This runs a little slower, but the client will update automatically as you modify the source code.
* Start the daemon/server (`node rampart.js ...`) as normal, but add the `--devClient` flag
* Run `npm run start` in a second terminal window
* Open [localhost:3000](http://localhost:3000) in a browser (not 3001)

This hot-reloading ability is not available for the server, so changes to server code require you to kill & restart the server (`node rampart.js`).