
# Bioinformatics pipelines in RAMPART


## Read annotation pipeline

### De-multiplexing

### Reference mapping

### Options

- require_two_barcodes (default true)
- discard_middle (default true)
- split_reads (default false)
- discard_unassigned (default true) 
  > keep unassigned, change to --discard_unassigned if you don't want to see unbarcoded reads
- barcode_set [native | rapid | all] (default native)
- limit_barcodes_to [BC01, BC02, ...] (default no limits)
- barcode_threshold <threshold> (default 80)
- barcode_diff <differences> (default 5)

In `protocol.json` or `run_configuration.json`
```json
annotationOptions: {
  "require_two_barcodes": "false",
  "barcode_set": "rapid",
  "limit_barcodes_to": "BC04,BC05"
}
```

`<option>=<value>` with no spaces

```json
--annotationOptions require_two_barcodes=false barcode_set=rapid limit_barcodes_to=BC04,BC05
```
