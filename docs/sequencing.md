# Running RAMPART for a sequencing run

This document explains how to run RAMPART directly from an ongoing sequencing run (or simulated run).

### Prerequisites:
* The Oxford Nanopore Technology MinKNOW must be installed in order to run the MinION. 
See the [Oxford Nanopore downloads page](https://community.nanoporetech.com/downloads) for instructions.

* Conda should be installed -- [see instructions here](https://conda.io/docs/user-guide/install/index.html).
 
  Conda is a popular environment manager which makes it trivial to install dependencies & software in a fashion that won't break other software you may have installed. While you can run RAMPART without conda, it requires you to install and update all of the other software packages it depends on.

# Live sequencing & basecalling with MinKNOW & Guppy

#### RAMPART set-up
* Create the appropriate `config.json` file (don't worry about the basecalled path)

#### MinKNOW set-up:
*  attach a MinION or set up 
*  start MinKNOW
*  Select the MinION and choose the relevent flowcell

#### Experiment Set-up
* Click the button `New Experiment +`.
* Give the Experiment a name, e.g., `EBOV_3sample`.
* Choose the relevent settings for the pore etc
* The UI will return to the main screen.
* The UI will return to the main screen.
* Select the `Experiment` in the top right of the window (`EBOV_3sample`).
* Under `Basecalling` select `Fast`
* Under `Replay Mode` select `SingleRun`.
* Under `Reads` select `Enable`. Tick raw, but not the events.
* Click the `Update` button and the run should start.

#### Basecalling
* Base-called fastq files will be automatically created in `<MinKNOW_path>/data/reads/<date>_<time>_EBOV_3sample_bulk/fastq/pass` by MinKNOW.

Where `<MinKNOW_path>` is the path to where MinKNOW will be storing its data. This will vary between systems -- on Linux this is likely to be `/var/lib/MinKNOW` and on Mac OS X will be `~/MinKNOW`.

#### Running RAMPART
* `node rampart.js --config <config> --basecalledDir /data/basecalled/<run_name>/<minion_id>/`

