import os
import sys
import time  
import re
import argparse
import datetime
import threading
from collections import deque

from watchdog.observers import Observer  
from watchdog.events import PatternMatchingEventHandler
import mappy as mp

barcodes = [ "barcode01", "barcode03", "barcode04", "unclassified" ]

count = 0
read_count = 1
time_stamp = ""
read_mappings = []
reference_names = []
unmatched_counts = [0, 0, 0, 0]

def create_index(reference_file):
	aligner = mp.Aligner(reference_file, best_n = 1)

	print("Reading references:")
	
	for name, seq, qual in mp.fastx_read(reference_file, read_comment=False):
		print(name)
		reference_names.append(name)

	print()

	if not aligner:
		raise Exception("ERROR: failed to load/build index file '{}'".format(reference_file))
	
	return aligner

def map_to_reference(aligner, query_path, barcode, reads_per_file, destination_folder):
	global count
	global read_count
	global time_stamp
	global read_mappings
	global reference_names
	global unmatched_counts

	path = query_path.split("/")
	query_file = path[-1]

	print("Mapping query file: " + query_file + " with barcode: " + barcode);
	
	i = 0
	unmatched = 0
	
	for name, seq, qual, comment in mp.fastx_read(query_path, read_comment=True): # read one sequence
		read_time = re.search(r'start_time=([^\s]+)', comment).group(1)
		if time_stamp == "":
			time_stamp = read_time
		
		if barcode not in barcodes:
			raise ValueError('unknown barcode')
	
		barcode_index = barcodes.index(barcode)

		try:
			h = next(aligner.map(seq))
		
			start = h.r_st
			end = h.r_en
			identity = h.mlen / h.blen
			reference_index = reference_names.index(h.ctg) + 1		
			
			line = "\t\t[{}, {}, {}, {}, {}],\n".format(barcode_index + 1, reference_index, start, end, identity)

			read_mappings.append(line)

			count += 1
			read_count += 1
			if count >= reads_per_file:
				file_name = 'mapped_' + str(read_count) + "_" + date_stamp + '.json'
				
				print("Reached " + str(reads_per_file) + " reads mapped, writing " + file_name)
				 
				with open(destination_folder + "/" + file_name, 'w') as f:
					f.write("json {")
					f.write("\t\"timeStamp\": \"{}\",".format(time_stamp))
					f.write("\t\"unmappedReadsPerBarcode\": [")
					first = True
					for unmatched in unmatched_counts:
						if first:
							first = False
						else:
							f.write(", ")	
						f.write(str(unmatched))
						
					f.write("], ")
					f.write("\t\"readData\": [")
					
					# "3-d array, first index: barcode number, 2nd index: read number, 3rd index: [ref#, start base, end base, identity]
					for line in read_mappings:
						f.write(line)

					f.write("\t]")
					f.write("}")

				f.close()
				read_mappings = []
				time_stamp = ""
				count = 0
				unmatched_counts = [0, 0, 0]
		except:
			unmatched_counts[barcode_index] += 1
			unmatched += 1
			print(name + " unmatched")
		
		i += 1	
	
	print("Finished mapping " + str(i) + " reads, " + str(unmatched) + " unmatched");
	#print("Read mappings: " + str(count) + " / " + str(reads_per_file));

# This thread class watches the file deque and if there are two or more files
# in it then it takes the oldest one and maps it (if there is only one file
# in the deque then it may not have finished writing).
class Mapper(threading.Thread):
	aligner = None
	reads_per_file = 100
	destination_folder = ""
	file_queue = None
	
	def __init__(self, aligner, reads_per_file, destination_folder, file_queue):
		self.aligner = aligner
		self.reads_per_file = reads_per_file
		self.destination_folder = destination_folder
		self.file_queue = file_queue

		threading.Thread.__init__(self)
        
	def run (self):
		while True:
			for barcode in barcodes:
				# if there is more than one file in the deque then the first one must
				# have finished writing so is ready to map
				if len(file_queues[barcode]) > 1:
					map_to_reference(aligner, file_queues[barcode].popleft(), barcode, reads_per_file, destination_folder)	
				time.sleep(100)			

# The Watcher watches the source folder and if a file is created then it pops
# its name into the deque for the mapping thread to deal with.
class Watcher(PatternMatchingEventHandler):
	patterns = ["*.fastq", "*.fasta"]
	file_queues = None

	def __init__(self, file_queues, *args, **kwargs):
		self.file_queues = file_queues
		
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
			barcode = path[-2]

			print("Appending " + event.src_path + " to queue for barcode, " + barcode)
			file_queues[barcode].append(event.src_path)

	def on_modified(self, event):
		self.process(event)

	def on_created(self, event):
		self.process(event)
	
if __name__ == '__main__':	
	parser = argparse.ArgumentParser(description='A daemon process for mapping base-called reads to reference sequences.')
	parser.add_argument("-r", "--reference_file", help="the path to the file of reference sequences", action="store")
	parser.add_argument("-n", "--reads_per_file", help="the number of read mappings per output file", action="store", type=int, default=1000)
	parser.add_argument("-b", "--barcode", help="the label of the sample if not using de-multiplexed directories", action="store")
	parser.add_argument("-m", "--multiplexed", help="is the data multiplexed - use the directories as barcode names", action="store_true")
	parser.add_argument('watch_directory', help='path to the reads folder to be watched')
	parser.add_argument('output_directory', help='path to the directory where read mapping files will be written')
	args = parser.parse_args()

	reference_file = args.reference_file
	reads_per_file = args.reads_per_file
	channel_name = args.barcode
	source_folder = args.watch_directory
	destination_folder = args.output_directory
	
	print("read_mapping_daemon")
	print("     reference: " + reference_file)
	print("      watching: " + source_folder)
	print("   destination: " + destination_folder)
	if not args.multiplexed:
		print("       barcode: " + channel_name)
	print("reads_per_file: " + str(reads_per_file))
	print()

	aligner = create_index(reference_file)
	
	file_queues = {}

	for barcode in barcodes:
		file_queues[barcode] = deque([])
	

	# start the thread that processes files push to the stack
	mapper = Mapper(aligner, reads_per_file, destination_folder, file_queues)
	mapper.start()

	observer = Observer()
	observer.schedule(Watcher(file_queues), path=source_folder, recursive=True)
	observer.start()

	print("Started - waiting for reads")
	print()

	try:
		while True:
			time.sleep(1)
	except KeyboardInterrupt:
		observer.stop()

	observer.join()
        
