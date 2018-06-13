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

count = 0
read_mappings = []

def create_index(reference_file):
	aligner = mp.Aligner(reference_file, best_n = 1)

	if not aligner:
		raise Exception("ERROR: failed to load/build index file '{}'".format(reference_file))
	
	return aligner

def map_to_reference(aligner, query_path, channel_name, reads_per_file, destination_folder):
	global count
	global read_mappings

	path = query_path.split("/")
	query_file = path[-1]
	barcode = channel_name
	if barcode is None:
		barcode = path[-2]

	if barcode == "unclassified":
		return

	print("Mapping query file: " + query_file + " with barcode: " + barcode);
	
	i = 0
	unmatched = 0
	
	for name, seq, qual, comment in mp.fastx_read(query_path, read_comment=True): # read one sequence
		read_time = re.search(r'start_time=([^\s]+)', comment).group(1)

		try:
			h = next(aligner.map(seq))
		
			start = h.r_st
			end = h.r_en
			identity = h.mlen / h.blen
		
			line = '"{}","{}","{}","{}","{}"\n'.format(barcode, h.ctg, start, end, identity)

			read_mappings.append(line)

			count += 1
			if count >= reads_per_file:
				file_name = 'mapped_' + datetime.datetime.now().isoformat() + '.csv'
				
				print("Reached " + str(reads_per_file) + " reads mapped, writing " + file_name)
				 
				with open(destination_folder + "/" + file_name, 'w') as f:
					f.write('\"channel\",\"reference\",\"start\",\"end",\"identity\"\n')
					for line in read_mappings:
						f.write(line)

				f.close()
				read_mappings = []
				count = 0
		except:
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
	channel_name = ""
	reads_per_file = 100
	destination_folder = ""
	file_queue = None
	
	def __init__(self, aligner, channel_name, reads_per_file, destination_folder, file_queue):
		self.aligner = aligner
		self.channel_name = channel_name
		self.reads_per_file = reads_per_file
		self.destination_folder = destination_folder
		self.file_queue = file_queue

		threading.Thread.__init__(self)
        
	def run (self):
		while True:
			# if there is more than one file in the deque then the first one must
			# have finished writing so is ready to map
			if len(file_queue) > 1:
				map_to_reference(aligner, file_queue.popleft(), channel_name, reads_per_file, destination_folder)				

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
			# print("Appending " + event.src_path + " to queue")
			file_queue.append(event.src_path)

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
	print("Started - waiting for reads")
	print()

	aligner = create_index(reference_file)
	
	file_queue = deque([])
	
	# start the thread that processes files push to the stack
	mapper = Mapper(aligner, channel_name, reads_per_file, destination_folder, file_queue)
	mapper.start()

	observer = Observer()
	observer.schedule(Watcher(file_queue), path=source_folder, recursive=True)
	observer.start()

	try:
		while True:
			time.sleep(1)
	except KeyboardInterrupt:
		observer.stop()

	observer.join()
        
