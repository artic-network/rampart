# Managing Protocols


We provide a registry for managing different protocols.
This ties in with ARTIC's commitment to publish different protocols.

## Listing (locally) available protocols

Run `rampart protocols list` or `rampart protocols list --verbose` 

## Adding a protocol

The command `rampart protocols add` allows you to add a protocol to the current rampart set-up.

Examples:
```
rampart protocols add artic-denv2-1.0 https://github.com/artic-network/rampart-denv2/archive/master.zip --verbose --subdir protocol
rampart protocols add artic-nipah-1.0 https://github.com/artic-network/artic-nipah/archive/master.zip --verbose --subdir rampart
rampart protocols add artic-ituri-ebola-2.0 https://github.com/artic-network/artic-ebov/archive/master.zip --verbose --subdir rampart/IturiEBOV
rampart protocols add artic-pan-ebola-2.0 https://github.com/artic-network/artic-ebov/archive/master.zip --verbose --subdir rampart/PanEBOV
rampart protocols add artic-polio-1.1 https://github.com/aineniamh/realtime-polio/archive/master.zip --verbose --subdir rampart
```