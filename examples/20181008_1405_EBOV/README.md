# Test run of Ebola

Note that we've included the protocol (`artic-ebola-1.1`) necessary for this inside RAMPART.
(You can see this by running `rampart protocols list artic-ebola-1.1 --verbose`.)

### How to run:

Firstly, ensure that the rampart client is built, via `npm run build`.
Secondly,make sure you are in this directory (i.e. `20181008_1405_EBOV`).
Then run
```
rampart run --verbose --protocol artic-ebola-1.1 --clearAnnotated
```

