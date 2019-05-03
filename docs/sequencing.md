# Real-time RAMPART testing

This document explains how to run RAMPART directly from an ongoing sequencing run (or simulated run).

Requirements:

   * Guppy (GPU/CPU basecaller)
   * Dogfish (wrapper to drive Guppy from batches of reads)
   * MinKNOW 

# Dogfish set-up
If running from the ARTIC SSD, this will be pre-configured, so skip to the next section.

	apt install ont-dogfish

### Set up paths

As ``sudo``:

	mkdir -p /data/basecalled
	mkdir -p /var/log/dogfish
	chown ubuntu /data/basecalled
	chown ubuntu /data/basecalled

### Run in background:

Edit ``/etc/systemd/system/dogfish.service`` accordingly.

Edit the line ``User=grid`` to read:

	User=ubuntu
	
Edit the dogfishcall line and change the -d parameter to read:

	-d "auto"

Start in background:

	sudo systemctl daemon-reload
	sudo service dogfishd start

### Run dogfish interactively

	dogfish call -o /data/basecalled -d ‘nvidia:gpu:0’ -l /var/log/dogfish

### Check it's working (after the run has started)
When the run has started (ensure you enable generation of Reads, with just raw output not Events to save disk space):

Check dogfish is running:

	dogfish status
	
Check the dogfish config is correct:

	dogfish config
	
	[Config]
	flowcell: FLO-MIN106
	sample: DNA
	postcall: move
	batch_lower: 100
	batch_upper: 4000
	max_reads: 8000
	
Find your run e.g. in ``/var/lib/MinKNOW/data/reads`` and start dogfish watching that folder. Dogfish requires absolute paths to the directory.


# Live sequencing & basecalling with MinKNOW & Guppy


RAMPART set-up
* Create the appropriate `config.json` file (don't worry about the basecalled path)

MinKNOW set-up:
*  attach a MinION or set up 
*  start MinKNOW
*  Select the MinION and choose the relevent flowcell

Dogfish _it's important to set this up before the sequencing starts_
* `dogfish watch /var/lib/MinKNOW/data/reads`


Experiment Set-up
* Click the button `New Experiment +`.
* Give the Experiment a name, e.g., `EBOV_3sample`.
* Choose the relevent settings for the pore etc
* The UI will return to the main screen.
* The UI will return to the main screen.
* Select the `Experiment` in the top right of the window (`EBOV_3sample`).
* Under `Basecalling` select `Disable`
* Under `Replay Mode` select `SingleRun`.
* Under `Reads` select `Enable`. Tick raw, but not the events.
* Click the `Update` button and the run should start.

Basecalling
* Base-called fastq files will be auomatically created in `/var/lib/MinKNOW/data/reads/<date>_<time>_EBOV_3sample_bulk/fastq/pass` by dogfish

RAMPART
* `node rampart.js --config <config> --basecalledDir /data/basecalled/<run_name>/<minion_id>/`


### Benchmarking

I get about 650k kev/s on XPS15 1050Ti (stats are accessible if you run dogfishcall interactively.
If it's dramatically slower, most likely the CPU is being used, in which case you either don't have a NVidia GPU or the drivers are not correctly set up.




# Running bulk file playback with Guppy base-calling.

Paths you'll need:
* The absolute path to the bulkfile (`*.fast5`)

Run as above (live sequencing & calling), with with these additions:
* Name the experiment, choose something like `EBOV_3sample_playback`
* In the experiment setup, select `Custom Script`, turn on the check box and pick `playback`.
* When you open the experiment, you'll need to provide the absolute path to the bulkfile


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


# Enabling a simulated device for playback without a MinION connected

If you don’t have a MinION set up a simulated device

Edit ``/opt/ONT/MinKNOW/conf/app_conf``

Find the line:

	"simulated_device": false
	
And replace with:

	"simulated_device": true
		
Reboot and start MinKNOW:

	/opt/ui/MinKNOW
	
You should now have a simulated MinION called 'X1' which can be used to run bulk files.

Run the bulk file as usual.