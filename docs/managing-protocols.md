# Managing Protocols

Protocols are at the heart of how RAMPART works -- see [this page](./protocols.md) for a deep-dive into what protocols are and how to configure them.
A number of protocols have been published by the ARTIC network and others, and RAMPART is designed to easily interface with these.


RAMPART starts with just one protocol - the "default" one.
This is good enough to see some basic information on how your sequencing run is going, however things are much better if you have a protocol which is specific to your pathogen.


## Listing (locally) available protocols

Run `rampart protocols list` or `rampart protocols list --verbose`.

If you just want to see one protocol, then run `rampart protocols list <name> --verbose`.

## Adding a protocol

The command `rampart protocols add` allows you to add a protocol to the current rampart set-up.

You can add protocols vis (i) GitHub repositories, (ii) local zip files, (iii) local directories.

#### Examples:

```
rampart protocols add artic-denv2-1.0 https://github.com/artic-network/rampart-denv2/archive/master.zip --verbose --subdir protocol
rampart protocols add artic-nipah-1.0 https://github.com/artic-network/artic-nipah/archive/master.zip --verbose --subdir rampart
rampart protocols add artic-ituri-ebola-2.0 https://github.com/artic-network/artic-ebov/archive/master.zip --verbose --subdir rampart/IturiEBOV
rampart protocols add artic-pan-ebola-2.0 https://github.com/artic-network/artic-ebov/archive/master.zip --verbose --subdir rampart/PanEBOV
rampart protocols add artic-ebola-2.0 https://github.com/artic-network/rampart-ebov/archive/master.zip --verbose --subdir protocol
rampart protocols add artic-polio-1.1 https://github.com/aineniamh/realtime-polio/archive/master.zip --verbose --subdir rampart
```
