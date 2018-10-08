import os
import sys
import time
import re
import argparse
import datetime
import threading
import subprocess
from collections import deque

from watchdog.observers import Observer
from watchdog.events import PatternMatchingEventHandler

barcodes = [ "barcode01", "barcode03", "barcode04" ]

count = 0
read_count = 1
date_stamp = ""
read_mappings = []
reference_names = []

def chop_and_barcode(query_path, destination_folder):

	print("Demultiplexing query file: " + query_path);

	path = query_path.split("/")
	destination_path = destination_folder + "/" + "barcoded_" + path[-1]

	command = "porechop --verbosity 1 -i \""+ query_path + "\" -o \""+ destination_path + "\" " + \
		"--discard_middle --require_two_barcodes --barcode_threshold 80 --threads 2 " + \
		"--check_reads 10000 --barcode_diff 5 --barcode_labels"

	return_code = subprocess.call(command, shell=True)


# This thread class watches the file deque and if there are two or more files
# in it then it takes the oldest one and maps it (if there is only one file
# in the deque then it may not have finished writing).
class Chopper(threading.Thread):
	destination_folder = ""
	file_queue = None

	def __init__(self, destination_folder, file_queue):
		self.destination_folder = destination_folder
		self.file_queue = file_queue

		threading.Thread.__init__(self)

	def run (self):
		while True:
			# if there is more than one file in the deque then the first one must
			# have finished writing so is ready to map
			if len(file_queue) > 1:
				chop_and_barcode(file_queue.popleft(), destination_folder)
			time.sleep(0.1)

# The Watcher watches the source folder and if a file is created then it pops
# its name into the deque for the mapping thread to deal with.
class Watcher(PatternMatchingEventHandler):
	patterns = ["*.fastq", "*.fasta"]
	file_queue = None

	def __init__(self, file_queue, *args, **kwargs):
		self.file_queue = file_queue

		super(Watcher, self).__init__(*args, **kwargs)

	def process(self, event):
		"""
		event.event_type
			'modified' | 'created' | 'moved' | 'deleted'
		event.is_directory
			True | False
		event.src_path
			path/to/observed/file
		"""
		# the file will be processed there
		#print(event.src_path, event.event_type)

		if event.event_type == 'created':
			#print("Appending " + event.src_path + " to queue")
			file_queue.append(event.src_path)

	def on_modified(self, event):
		self.process(event)

	def on_created(self, event):
		self.process(event)

def push_existing_files(source_folder, file_queue):
	for filename in os.listdir(source_folder):
		if filename.endswith(".fastq"):
			print("Existing file: " + filename)
			file_queue.append(source_folder + "/" + filename)

if __name__ == '__main__':

	parser = argparse.ArgumentParser(description='A daemon process for trimming and de-multiplexing guppy reads.')
	parser.add_argument('watch_directory', help='path to the reads folder to be watched')
	parser.add_argument('output_directory', help='path to the directory where read mapping files will be written')
	args = parser.parse_args()

	source_folder = args.watch_directory
	destination_folder = args.output_directory

	print("read_porechop_daemon")
	print("      watching: " + source_folder)
	print("   destination: " + destination_folder)
	print()

	file_queue = deque([])

	push_existing_files(source_folder, file_queue)

	# start the thread that processes files push to the stack
	mapper = Chopper(destination_folder, file_queue)
	mapper.start()

	observer = Observer()
	observer.schedule(Watcher(file_queue), path=source_folder, recursive=True)
	observer.start()

	print("Started - waiting for reads")
	print()

	try:
		while True:
			time.sleep(1)
	except KeyboardInterrupt:
		observer.stop()

	observer.join()
