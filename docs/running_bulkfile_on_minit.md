# Running a bulk file playback on the MinIT with Guppy base-calling.

Set up the MinIT with a MinION attached (the configuration flowcell is fine).

To run EBOV validation run bulk file on MinIT.

Copy bulk file to MinITs shared drive:

```bash
cp <bulkfilename>.fast5 /Volumes/data/
```

Connect to MinKNOW interface on the MinIT in a browser.

Select the MinION and choose flowcell FLO-MIN106.

Click the button `New Experiment +`.

Give the Experiment a name, e.g., `EBOV_3sample_bulk`.

Select `Custom Script`, turn on the check box and pick `playback`.

Click the `Start run` button. The UI will return to the main screen.

Select the `Experiment` in the top right of the window (`EBOV_3sample_bulk`).

A `Playback settings` dialog will open.

Under `Path` give the full path (for the MinIT) to the bulk file, `/data/<bulkfilename>.fast5`.

Leave `Replay mode` as `SingleRun`.

Under `Basecalling` select `Enable`.

Under `Basecalling config` select `dna_r9.4_450bps.cfg`.

Under `Reads` select `Disable` (unless you need fast5 reads).

Under `Fastq Reads` select `Enable`.

Click the `Update` button and the run should start.

Base-called fastq files will be put into `/data/reads/<date>_<time>_EBOV_3sample_bulk/fastq/pass`

