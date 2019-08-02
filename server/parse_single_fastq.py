import json
from collections import Counter
import sys
import argparse
from Bio import SeqIO


def parse_args():
    parser = argparse.ArgumentParser(description='Parse a single annotated FASTQ file. Normally called by rampart.js')
    # parser.add_argument("-p", "--reference-panel", help="FASTA of reference sequences (used to find best match)", action="store")
    # parser.add_argument("-c", "--coordinate-reference", help="RAMPART config JSON with a single reference (used for co-ordinates)", action="store", dest="fastq")
    parser.add_argument("-f", "--fastq", help="annotated fastq to parse information from", action="store")
    return parser.parse_args()

def parse_header(header):
    tokens= header.split(' ')
    header_info = {}
    for i in tokens:
        try:
            info = i.split('=')
            header_info[info[0]]=info[1]
        except:
            pass
    return header_info

def parse_fastq(fastq):
    mapping_results =[]
    unmatched = Counter()
    record_index = 0
    first_read_time_stamp=None
    for record in SeqIO.parse(str(fastq),"fastq"):
        
        record_index +=1
        header_info = parse_header(str(record.description))
        if not first_read_time_stamp:
            first_read_time_stamp=header_info["start_time"]
        try:
            identity = header_info["identity"]
        except:
            identity = 100 # add this in future, what's it used for? 
        try:
            start,end = header_info["coords"].split(':')
            barcode = header_info["barcode"]
            read_info = [record_index, barcode, header_info["reference_hit"], start, end, identity]
        except:
            continue
        if header_info["coords"]=="0:0":
            unmatched[barcode]+=1
        else:
            mapping_results.append(read_info)
    return (first_read_time_stamp, unmatched, mapping_results)




if __name__ == '__main__':
    """

    The results are printed to STDOUT to be consumed by a child process of rampart.js.
    Errors to STDOUT will be swallowed; instead write to STDERR and exit with code != 0.
    """
    args = parse_args()
    parse_fastq(str(args.fastq))

    first_read_time_stamp, unmatched, mapping_results = parse_fastq(args.fastq)
    # print(first_read_time_stamp)
    # print(unmatched)
    # # summary = {
    # #     "timeStamp": str(first_read_time_stamp),
    # #     "readData": mapping_results
    # # }
    print(json.dumps(mapping_results))
    # print(json.dumps(mapping_results, indent=2)) # nicer for debugging
    sys.exit(0)
