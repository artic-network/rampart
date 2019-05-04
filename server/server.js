const express = require('express')
const path = require('path')
const http = require('http');
const SocketIO = require('socket.io')
const { initialConnection, setUpIOListeners } = require("./socket");
const { log } = require("./utils");


/**
 * Start a simple express server to deliver the index.html
 * And open a socket (using socket.io) for all communications
 * (this is in preperation for a move to electron, where main-renderer
 * process communication is socket-like)
 */
const run = ({devClient}) => {
  const serverPort = process.env.PORT || 3001;
  const socketPort = process.env.SOCKET || 3002;

  const app = express()
  app.set('port', serverPort);
  const httpServer = http.Server(app);
  httpServer.listen(socketPort);
  const io = SocketIO(httpServer);
  global.io = io;

  if (!devClient) {
    /* serve the html & javascript */
    /* THIS IS FOR THE PRODUCTION, BUILT BUNDLE. USE npm run start FOR DEVELOPMENT */
    // https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/template/README.md#deployment
    app.use(express.static(path.join(__dirname, "..", 'build')));
    app.get('/', function (req, res) {
      res.sendFile(path.join(__dirname, "..", 'build', 'index.html'));
    });
  }

  app.listen(app.get('port'), () => {
    log(`\n\n---------------------------------------------------------------------------`);
    log(`RAMPART daemon running`);
    log(`socket open on port ${socketPort}`);
    if (devClient) {
      log(`Using --devClient -> run "npm run start" to run the client`);
    } else {
      log(`Serving built bundle at http://localhost:${serverPort}`);
    }
    log(`---------------------------------------------------------------------------\n\n`);
  });

  /*     S  O  C  K  E  T     */
  io.on('connection', (socket) => {
    log('client connection detected');
    initialConnection(socket);
    setUpIOListeners(socket);
  });


  return app;
}

module.exports = {
  run
};
