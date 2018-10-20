# Real-time RAMPART testing

This document explains how to run RAMPART directly from an ongoing sequencing run (or simulated run).

Requirements:

   * Guppy (GPU/CPU basecaller)
   * Dogfish (wrapper to drive Guppy from batches of reads)
   * MinKNOW 

All installed on the ARTIC SSD.

## Dogfish installation

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

## Start a MinKNOW run

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

## Basecalling

When the run has started (ensure you enable generation of Reads, with just raw output not Events to save disk space):

Check dogfish is running:

	``dogfish status``
	
Check the dogfish config is correct:

	``dogfish config``
	
	[Config]
	flowcell: FLO-MIN106
	sample: DNA
	postcall: move
	batch_lower: 100
	batch_upper: 4000
	max_reads: 8000
	
Find your run e.g. in ``/var/lib/MinKNOW/data/reads`` and start dogfish watching that folder. Dogfish requires absolute paths to the directory, e.g.:

	cd /var/lib/MinKNOW/data/reads/20181020_1339_EBOV``
	dogfish watch `pwd`

## Benchmarking

I get about 650k kev/s on XPS15 1050Ti (stats are accessible if you run dogfishcall interactively. If it's dramatically slower, most likely the CPU is being used, in which case you either don't have a NVidia GPU or the drivers are not correctly setup.

