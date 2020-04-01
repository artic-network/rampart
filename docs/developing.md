# Developing RAMPART

## Developing the client
This runs a little slower, but the client will update automatically as you modify the source code.
* Start the daemon/server (`node rampart.js ...`) as normal, but add the `--devClient` flag
* Run `npm run start` in a second terminal window
* Open [localhost:3000](http://localhost:3000) in a browser (not 3001)

This hot-reloading ability is not available for the server, so changes to server code require you to kill & restart the server (`node rampart.js`).

## "Live" Bascecalling from a bulkfile


## Releasing a new conda package

> You must be a member of the artic-network anaconda group to be able to release RAMPART.

* Update the version in `package.json`, commit to master, tag & push to github

```bash
git tag -a v1.1.0rc2 -m "version 1.1.0 release candidate 2"
git push --tags
```

This will create the tar.gz like https://github.com/artic-network/rampart/archive/v1.1.0rc2.tar.gz

* Modify `./recipes/conda/meta.yaml` to include the new version, new URL to the above tarball and sha256 of the tarball.
You may generate the hash via:

```bash
wget -O- https://github.com/artic-network/rampart/archive/v1.0.0-alpha.1.tar.gz | shasum -a 256
```

```bash
conda config --set anaconda_upload no
# conda-build purge-all
cd recipes/conda
conda-build .
conda-build . --output 	# see where package is
anaconda login 			# login as user
anaconda upload [--label test] --user artic-network </path/to/conda-package.tar.bz2>
```