import os
import sys
import time  
from collections import deque
import threading

from watchdog.observers import Observer  
from watchdog.events import PatternMatchingEventHandler
import mappy as mp
import datetime
import re

count = 0
read_mappings = []

def create_index(reference_file):
	aligner = mp.Aligner(reference_file, best_n = 1)

	if not aligner:
		raise Exception("ERROR: failed to load/build index file '{}'".format(reference_file))
	
	return aligner

def map_to_reference(aligner, query_file, channel_name, destination_folder):
	global count
	global read_mappings
	
	print("Mapping query file: " + query_file);
	
	i = 0
	
	for name, seq, qual, comment in mp.fastx_read(query_file, read_comment=True): # read one sequence
		read_time = re.search(r'start_time=([^\s]+)', comment).group(1)

		try:
			h = next(aligner.map(seq))
		
			start = h.r_st
			end = h.r_en
			identity = h.mlen / h.blen
		
			line = '"{}","{}","{}","{}","{}"\n'.format(channel_name, h.ctg, start, end, identity)

			read_mappings.append(line)

			count += 1
			if count == 1000:
				file_name = 'mapped_' + datetime.datetime.now().isoformat() + '.csv'
				
				print("Reached 1000 reads mapped, writing " + file_name)
				 
				with open(destination_folder + "/" + file_name, 'w') as f:
					f.write('\"channel\",\"reference\",\"start\",\"end",\"identity\"\n')
					for line in read_mappings:
						f.write(line)

				f.close()
				read_mappings = []
				count = 0
		except:
			print(name + " unmatched")
		
		i += 1	
	
	print("Finished mapping " + str(i) + " reads in file: " + query_file);

# This thread class watches the file deque and if there are two or more files
# in it then it takes the oldest one and maps it (if there is only one file
# in the deque then it may not have finished writing).
class Mapper(threading.Thread):
	aligner = None
	channel_name = ""
	destination_folder = ""
	file_queue = None
	
	def __init__(self, aligner, channel_name, destination_folder, file_queue):
		self.aligner = aligner
		self.channel_name = channel_name
		self.destination_folder = destination_folder
		self.file_queue = file_queue

		threading.Thread.__init__(self)
        
	def run (self):
		while True:
			# if there is more than one file in the deque then the first one must
			# have finished writing so is ready to map
			if len(file_queue) > 1:
				file = file_queue.popleft()
			
				print("Popping " + file + " from queue - mapping")
				map_to_reference(aligner, file, channel_name, destination_folder)				

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
			print("Appending " + event.src_path + " to queue")
			file_queue.append(event.src_path)

	def on_modified(self, event):
		self.process(event)

	def on_created(self, event):
		self.process(event)
	
if __name__ == '__main__':
	args = sys.argv[1:]

	reference_file = args[0]
	channel_name = args[1]
	source_folder = args[2]
	destination_folder = args[3]

	aligner = create_index(reference_file)
	
	file_queue = deque([])
	
	# start the thread that processes files push to the stack
	mapper = Mapper(aligner, channel_name, destination_folder, file_queue)
	mapper.start()

	observer = Observer()
	observer.schedule(Watcher(file_queue), source_folder)
	observer.start()

	try:
		while True:
			time.sleep(1)
	except KeyboardInterrupt:
		observer.stop()

	observer.join()
        
