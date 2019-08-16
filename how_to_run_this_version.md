
# INSTALLATION

> NOTE: this assumes you have installed RAMPART by following [these instructions](installation.md)

# RUNNING AN EXAMPLE

There is an example protocol in `example_protocols/EBOV/` and some suitable data in `example_data/20181008_1405_EBOV/`.

The working directory should be setup for that specific run of the MinION:

```
cd example_data/20181008_1405_EBOV/
```

This has a `run_configuration.json` file with all the configuration for the current run (primarily mappings of barcodes to sample names):

```
{
  "title": "EBOV Validation Run",
  "basecalledPath": "fastq/pass",
  "samples": [
    {
      "name": "Mayinga",
      "description": "",
      "barcodes": [ "BC01" ]
    },
    {
      "name": "Kikwit",
      "description": "",
      "barcodes": [ "BC03" ]
    },
    {
      "name": "Makona",
      "description": "",
      "barcodes": [ "BC04" ]                                                                        
    },
    {
      "name": "Negative Control",
      "description": "",
      "barcodes": [ "BC02" ]
    }
  ]
}
```

There is also 10 fastq files from this run in `fastq/pass` to act as test data.

The run rampart on this data you would use the following command line:

```
node ../../rampart.js --protocol ../../example_protocols/EBOV
``` 

These options can be overridden on the command line - e.g.: `--basecalledPath ~/MinKNOW/data/reads/myrun/pass` or `--annotationsPath someAnnotations`.

Other options are:

```
  --title TITLE         experiment title
  --basecalledPath BASECALLEDPATH
                        path to basecalled FASTQ directory (default: don't 
                        annotate FASTQs)
  --annotatedPath ANNOTATEDPATH
                        path to destination directory for annotation CSVs - 
                        will be created if it doesn't exist (default: '.
                        /annotations')
  --barcodeNames BARCODENAMES [BARCODENAMES ...]
                        specify mapping of barcodes to sample names - e.g. 
                        'BC01=Sample1' (can have more than one barcode 
                        mapping to the same name)
  --annotationConfig ANNOTATIONCONFIG [ANNOTATIONCONFIG ...]
                        pass through config options to the annotation script 
                        (key=value pairs)

Runtime commands:
  Options to specify how RAMPART behaves

  --clearAnnotated      remove any annotation files present when RAMPART 
                        starts up (force re-annotation of all FASTQs)
  --simulateRealTime SIMULATEREALTIME
                        simulate real-time annotation with given delay 
                        between files
```


