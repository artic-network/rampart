import os
import sys
import argparse
from datetime import datetime
import re

lines_per_read = 4

if __name__ == '__main__':

	parser = argparse.ArgumentParser(description='A simple script to divide up a fastq dile into multiple fastq files.')
	parser.add_argument("-i", "--input_file", required=True, help="path to the input fastq file", action="store")
	parser.add_argument("-o", "--output_directory", required=True, help="path to the directory where the files will be written", action="store")
	parser.add_argument("-n", "--reads_per_file", help="number of reads in each output file", action="store", type=int, default=1000)
	args = parser.parse_args()

	source_file = args.input_file
	destination_folder = args.output_directory
	reads_per_file = args.reads_per_file

	reads = []

	with open(source_file, "r") as ins:
		count = 0
		read = {
			"lines": []
		}

		for line in ins:
			read["lines"].append(line)
			count += 1
			if count == lines_per_read:
				header = re.search(r'start_time=([^\s]+)', read["lines"][0])
				read["time"] = datetime.strptime(header.group(1), "%Y-%m-%dT%H:%M:%SZ").timestamp()
				reads.append(read)
				count = 0
				read = {
					"lines": []
				}
	print("Read", len(reads), "reads from", source_file)

	print("Sorting...")
	reads.sort(key=lambda x: x["time"])



	file_number = 0
	count = 0
	
	file_name = destination_folder + "/fastq_" + str(file_number).zfill(3) + ".fastq"
	file = open(file_name, "w") 
	#print("Writing file:", file_name)

	for read in reads:
		for line in read["lines"]:
			file.write(line)

		count += 1

		if count == reads_per_file:
			file.close()

			count = 0
			file_number += 1
			file_name = destination_folder + "/fastq_" + str(file_number).zfill(3) + ".fastq"
			file = open(file_name, "w") 
			#print("Writing file:", file_name)
	
	file.close()
	print("Written", file_number + 1, "files")

