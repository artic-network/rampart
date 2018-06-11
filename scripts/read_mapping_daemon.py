import sys
import time  
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


class MyHandler(PatternMatchingEventHandler):
	patterns = ["*.fastq", "*.fasta"]
	aligner = None
	destination_folder = ""

	def __init__(self, aligner, channel_name, destination_folder, *args, **kwargs):
		self.aligner = aligner
		self.destination_folder = destination_folder
		super(MyHandler, self).__init__(*args, **kwargs)

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
		print(event.src_path, event.event_type)  
		 
		if event.event_type == 'created':
			map_to_reference(aligner, event.src_path, channel_name, destination_folder)

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
	
	observer = Observer()
	observer.schedule(MyHandler(aligner, channel_name, destination_folder), source_folder)
	observer.start()

	try:
		while True:
			time.sleep(1)
	except KeyboardInterrupt:
		observer.stop()

	observer.join()
            
