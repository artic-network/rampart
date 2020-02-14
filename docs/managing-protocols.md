# Managing Protocols

Protocols are at the heart of how RAMPART works -- see [this page](./protocols.md) for a deep-dive into what protocols are and how to configure them.
A number of protocols have been published by the ARTIC network and others, and RAMPART is designed to easily interface with these.


RAMPART starts with just one protocol - the "default" one.
This is good enough to see some basic information on how your sequencing run is going, however things are much better if you have a protocol which is specific to your pathogen.


## Listing available protocols

`rampart protocols list` will list both installed (locally available) protocols and, if you have internet, the protocols in the ARTIC registry.


## Adding a protocol from the registry (still in development)

```
rampart protocols add primalScheme-ebov-3.0.zip
```

## Uploading a protocol to the registry (alpha)

```
s3cmd put --acl-public primalScheme-ebov-3.0.zip s3://artic/rampart-protocols-alpha/
```

Also need to modify the JSON manually, via

```
s3cmd get s3://artic/rampart-protocols-alpha/registry.json
# edit it
s3cmd put --acl-public registry.json s3://artic/rampart-protocols-alpha/
```

## Add a protocol from a local zip file

```
rampart protocols add <protocol-name> --local <path-to-zip-file>
```

## Add a protocol from a URL

```
rampart protocols add <protocol-name> --url <url-of-zip-file>
```

