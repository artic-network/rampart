import os
import sys
import glob
import time
import re
import json
import argparse
import operator
import threading
import mappy as mp
from datetime import datetime
from collections import deque
from watchdog.observers import Observer
from watchdog.events import PatternMatchingEventHandler

count = 0
read_count = 1
read_mappings = []
reference_names = []
reference_lengths = {}
matched_counts = None
unmatched_counts = None

def create_index(reference_file):
	aligner = mp.Aligner(reference_file, best_n = 1)

	for name, seq, qual in mp.fastx_read(reference_file, read_comment=False):
		reference_names.append(name)
		reference_lengths[name] = len(seq)

	if not aligner:
		raise Exception("ERROR: failed to load/build index file '{}'".format(reference_file))

	return aligner

def write_info_json(name):
	jsn = {}
	jsn["references"] = reference_names
	jsn["barcodes"] = barcodes
	jsn["name"] = name
	jsn["genome_length"] = reference_lengths[reference_names[0]] # check this...
	with open(os.path.join(destination_folder, "info.json"), 'w') as fh:
		json.dump(jsn, fh, indent=2)


def map_to_reference(aligner, query_path, reads_per_file, destination_folder):
	global count
	global read_count
	global read_mappings
	global reference_names
	global matched_counts
	global unmatched_counts

	path = query_path.split("/")
	query_file = path[-1]

	print("Mapping query file: " + query_file)

	i = 0
	unmatched = 0

	# barcode = default_barcode

	for name, seq, qual, comment in mp.fastx_read(query_path, read_comment=True): # read one sequence
		read_time = re.search(r'start_time=([^\s]+)', comment).group(1)
		# if default_barcode is None:
		barcode = re.search(r'barcode=([^\s]+)', comment).group(1)
		try:
			barcode_index = barcodes.index(barcode)
		except ValueError:
			generic = re.match("^barcode(\d\d)$", barcode)
			if generic:
				barcode_index = int(generic[1])-1
			else:
				raise ValueError('unknown barcode "' + barcode + '"... skipping')

		time_stamp = datetime.strptime(read_time, "%Y-%m-%dT%H:%M:%SZ")

		try:
			count += 1
			read_count += 1

			h = next(aligner.map(seq))

			start = h.r_st
			end = h.r_en
			identity = h.mlen / h.blen
			reference_index = reference_names.index(h.ctg)

			matched_counts[barcode_index] += 1

			record = {
				'time_stamp' : time_stamp,
				'barcode_index' : barcode_index + 1,
				'reference_index' : reference_index + 1,
				'start' : start, 'end' : end, 'identity' : identity }
			read_mappings.append(record)

			if count >= reads_per_file:
				file_name = 'mapped_' + str(read_count) + '.json'

				print("Reached " + str(reads_per_file) + " mapped reads, writing " + file_name)
				print("  matches by barcode [unmatched]:")
				total_matched = 0
				total_unmatched = 0
				for j in range(0, len(barcodes)):
					print("  " + barcodes[j] + ": " + str(matched_counts[j]) + " [" + str(unmatched_counts[j]) + "]")
					total_matched += matched_counts[j]
					total_unmatched += unmatched_counts[j]
				print("  Total: " + str(total_matched) + " [" + str(total_unmatched) + "]")
				print()

				read_mappings.sort(key = operator.itemgetter('time_stamp'))

				first_time_stamp = read_mappings[0]['time_stamp']

				with open(destination_folder + "/" + file_name, 'w') as f:
					f.write("{\n")
					f.write("\t\"timeStamp\": \"" + first_time_stamp.isoformat() + "\",\n")
					f.write("\t\"unmappedReadsPerBarcode\": [")
					first = True
					for unmatched in unmatched_counts:
						if first:
							first = False
						else:
							f.write(", ")
						f.write(str(unmatched))

					f.write("],\n")
					f.write("\t\"readData\": [\n")

					for idx, record in enumerate(read_mappings):
						time_stamp = record['time_stamp']
						time_delta = time_stamp - first_time_stamp
						# if time_delta.seconds > 1000:
						# 	print(time_delta.seconds)
						array = "[{}, {}, {}, {}, {}, {}]".format(
							time_delta.seconds,
							record['barcode_index'],
							record['reference_index'],
							record['start'],
							record['end'],
							record['identity'])
						if idx+1 == len(read_mappings):
							f.write("\t\t{}\n".format(array)) # no trailing comma
						else:
							f.write("\t\t{},\n".format(array))

					f.write("\t]\n")
					f.write("}")

				f.close()

				read_mappings = []
				count = 0
				matched_counts = [0 for x in barcodes]
				unmatched_counts = [0 for x in barcodes]

		except:
			unmatched_counts[barcode_index] += 1
			unmatched += 1
			# print(name + " unmatched")

		i += 1

	print("Finished mapping query file: " + query_file + " - " + str(i) + " reads, " + str(unmatched) + " unmatched")
	#print("Read mappings: " + str(count) + " / " + str(reads_per_file));

# This thread class watches the file deque and if there are two or more files
# in it then it takes the oldest one and maps it (if there is only one file
# in the deque then it may not have finished writing).
class Mapper(threading.Thread):
	def __init__(self, aligner, reads_per_file, destination_folder, file_queue, die_when_done):
		self.aligner = aligner
		self.reads_per_file = reads_per_file
		self.destination_folder = destination_folder
		self.file_queue = file_queue
		self.die_when_done = die_when_done

		threading.Thread.__init__(self)
		global matched_counts
		global unmatched_counts
		matched_counts = [0 for x in barcodes]
		unmatched_counts = [0 for x in barcodes]

	def run (self):
		while True:
			# if there is more than one file in the deque then the first one must
			# have finished writing so is ready to map
			if len(file_queue) > 1:
				try:
					map_to_reference(aligner, file_queue.popleft(), reads_per_file, destination_folder)
				except ValueError as err:
					print(err)
			elif self.die_when_done:
				print("mapping thread terminating as there are no more reads in the deque & you have elected not to watch the folder.")
				return;
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
			path = event.src_path.split("/")
			print("Appending " + path[-1] + " to queue")
			file_queue.append(event.src_path)

	def on_modified(self, event):
		self.process(event)

	def on_created(self, event):
		self.process(event)

def add_existing_files(source_folder, file_queue):
	print("Scanning source folder for reads already present...")
	for filename in glob.iglob(os.path.join(source_folder, "**", "*.fastq"), recursive=True):
		path = filename.split("/")

		print("\tAppending " + path[-1] + " to queue")

		file_queue.append(filename)
	print()

if __name__ == '__main__':
	parser = argparse.ArgumentParser(description='A daemon process for mapping base-called reads to reference sequences.')
	parser.add_argument("-r", "--reference_file", required=True, help="the path to the file of reference sequences", action="store")
	parser.add_argument("-n", "--reads_per_file", help="the number of read mappings per output file", action="store", type=int, default=1000)
	parser.add_argument("-t", "--title", required=True, help="Name of run", action="store")
	parser.add_argument("-b", "--barcodes", required=True, help="the sample / barcode names. (if not multiplexed then this is a single string)", nargs="+", action="store")
	parser.add_argument(      "--dont_observe", help="Don't watch for new files, just map what's there", action="store_true")
	parser.add_argument("-i", '--watch_directory', required=True, help='path to the reads folder to be watched')
	parser.add_argument("-o", '--output_directory', required=True, help='path to the directory where read mapping files will be written')
	args = parser.parse_args()


	reference_file = args.reference_file
	reads_per_file = args.reads_per_file
	barcodes = ["unused"] + args.barcodes;
	source_folder = args.watch_directory
	destination_folder = args.output_directory
	aligner = create_index(reference_file)

	print()
	print("Read Mapping Daemon")
	print("      run name: " + args.title)
	print("     reference: " + reference_file)
	print("      watching: " + source_folder)
	print("   destination: " + destination_folder)
	print("      barcodes: " + barcodes[0])
	for barcode_name in barcodes[1:]:
		print(' '*16 + barcode_name)
	print("    references: " + reference_names[0])
	for ref_name in reference_names[1:]:
		print(' '*16 + ref_name)
	print(" output coords: " + reference_names[0])
	print(" output length: " + str(reference_lengths[reference_names[0]]))
	print("reads per JSON: " + str(reads_per_file))
	print()

	write_info_json(args.title)

	file_queue = deque([])
	add_existing_files(source_folder, file_queue)

	# start the thread that processes files pulled from the stack
	mapper = Mapper(aligner, reads_per_file, destination_folder, file_queue, args.dont_observe)
	mapper.start()

	if not args.dont_observe:
		# start the observer that watches for new files and pushes them to the stack
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
