
# Examples

Right now there are 2 pre-basecalled example datasets available in the GitHub repo.

> NOTE: this assumes you have installed RAMPART by following [these instructions](old_installation.md)

While it's possible to specify all options & files using the GUI in RAMPART, we provide the full command line options here for simplicity.

## Ebola 

This is a sample of the data collected during an EBOV Validation Run.

```bash
cd rampart
node rampart.js 
  --basecalledDir ./examples/EBOV/data/basecalled/ 
  --demuxedDir ./examples/EBOV/data/demuxed/ 
  --referenceConfigPath ./examples/EBOV/EBOV_v1.0.json 
  --referencePanelPath ./examples/EBOV/reference-genomes.fasta
```

If you'd like to specify the experiment title & barcode names (which can also be done in the GUI) then add these command arguments:
```
  --title "EBOV validation run"
  --barcodeNames BC01=Mayinga BC02=NegativeControl BC03=Kikwit BC04=Makona
```

![](overview.png)


## Norovirus 

This is a sample of the data collected during a Norovirus typing experiment

```bash
cd rampart
node rampart.js 
  --basecalledDir ./examples/noro/data/basecalled/ 
  --demuxedDir ./examples/noro/data/demuxed/ 
  --referenceConfigPath ./examples/noro/annotation.json
  --referencePanelPath ./examples/noro/reference-genomes.fasta
  --title "Norovirus Typing"
```
