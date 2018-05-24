# rampart
Read Assignment, Mapping, and Phylogenetic Analysis in Real Time

## Status
in development

## How to run locally
* install `node` (I recommend via `nvm`) and `yarn` (e.g. `brew install yarn --without-node`)
* `yarn` to install packages (dependencies of the server and the frontend)
* `npm run server &` which starts the server (to deliver reads)
* `npm run start` which starts the frontend (available at [http://localhost:3000/](http://localhost:3000/))

## How to deploy (Proof of principle)
* heroku remote: https://git.heroku.com/artic-rampart.git
* simply push to this github address - heroku will
  * install dependencies
  * run `npm run heroku-postbuild`, which is just `npm run build`
  * run `npm run server` via the `Procfile` which serves the build bundle
