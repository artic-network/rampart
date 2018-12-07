
## How RAMPART works

* MinKNOW & guppy (via dogfish) produce basecalled fastqs
* Rampart demuxes these using porechop, extracts read-times from the sequencing summaries
* Maps twice, once to a single reference sequence to obtain co-ordinates, once against a panel of references to find the closest match.
* Displayed in the browser (port 3001 by default)

