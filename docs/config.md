
## Config file(s)
There is one config file which defines details about the current run (e.g. barcodes, names etc) and a second config file which defines the reference genome, including gene annotations, amplicon positions etc.
The second config file is normally provided as part of the ARTIC toolkit and shouldn't need modification -- see `./EBOV/configuration.json` for the currently used example.

The run-specific config file currently looks like:
```
{
  "name": Run name
  "referenceConfigPath": path to the second (ARTIC-provided) config file
  "referencePanelPath": path to a FASTA of reference genomes
  "samples": [
      {
          "name": sample name
          "description": sample description
          "barcodes": array of barcodes associated with sample, e.g. [ "BC01" ]
      },
      ...
    ],
  "basecalledPath": path to the directory with guppy-produced FASTQs
  "demuxedPath": path to the directory to save demuxed FASTQs
}
```

* All paths are relative to the config file.
* The basecalled path can be overridden by the command line argument `--basecalledDir`
* The barcodes (e.g. "BC01") are those produced by porechop

