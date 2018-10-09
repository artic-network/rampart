import os
import sys
import re
import json
import argparse
import mappy as mp
from datetime import datetime
from collections import defaultdict

def parse_args():
    parser = argparse.ArgumentParser(description='Map a single FASTQ file. Normally called by rampart.js')
    parser.add_argument("-p", "--reference-panel", help="FASTA of reference sequences (used to find best match)", action="store")
    parser.add_argument("-c", "--coordinate-reference", help="RAMPART config JSON with a single reference (used for co-ordinates)", action="store")
    parser.add_argument("-f", "--fastq", help="fastq file to map", action="store")
    return parser.parse_args()

def get_fasta_names(path):
    fasta_names = []
    for name, seq, qual in mp.fastx_read(path, read_comment=False):
        fasta_names.append(name)
    return fasta_names

def create_index(coordinate_reference, reference_panel):
    """Initialise minimap2 for 2 different reference FASTAs"""
    ## Parse the (single) reference sequence used to find co-ordinates:
    coordinate_aligner = mp.Aligner(coordinate_reference, best_n=1)
    name, seq, qual = next(mp.fastx_read(coordinate_reference, read_comment=False))
    coordinate_reference_length = len(seq)
    if not coordinate_aligner:
        raise Exception("ERROR: failed to load/build index file '{}'".format(coordinate_reference))

    ## Parse the panel of reference sequences used to find the best match
    panel_aligner = mp.Aligner(reference_panel, best_n = 1)
    if not panel_aligner:
        raise Exception("ERROR: failed to load/build index file '{}'".format(reference_panel))
    reference_panel_names = []
    for name, seq, qual in mp.fastx_read(reference_panel, read_comment=False):
        reference_panel_names.append(name)

    return (coordinate_aligner, coordinate_reference_length, panel_aligner, reference_panel_names)


def mapper(coordinate_aligner, panel_aligner, panel_names, fastq_path):
    unmatched = defaultdict(int) # counts of unmatched reads, based on barcode (index)
    mapping_results = []
    time_stamp = None # the first (?) read's timestamp

    for name, seq, qual, comment in mp.fastx_read(fastq_path, read_comment=True): # read one sequence
        # parse the header
        header = re.search(r'barcode=([^\s]+)', comment)
        if header:
            barcode = header.group(1)
            if barcode == "none": # unknown barcodes get idx of zero
                barcode = 0
            else:
                barcode = int(re.search(r'(\d+)', barcode).group(1))
        else:
            barcode = 0

        header = re.search(r'start_time=([^\s]+)', comment)
        if header:
            time_stamp = datetime.strptime(header.group(1), "%Y-%m-%dT%H:%M:%SZ")

        try:
            coord = next(coordinate_aligner.map(seq))
            panel = next(panel_aligner.map(seq))
        except StopIteration:
            unmatched[barcode] += 1
            continue;

        mapping_results.append(
            # barcode (idx), reference panel match (idx),   start pos,  end pos,    identity
            [barcode, panel_names.index(panel.ctg),         coord.r_st, coord.r_en, panel.mlen / panel.blen]
        )

    return (time_stamp, unmatched, mapping_results)


if __name__ == '__main__':
    """
    This script is pretty simple -- it takes a single FASTQ file and maps it
    twice. Once against a single reference, to get the co-ordinates of the match.
    As long as there is a match, it's then mapped against a panel of references to
    find the "closest" reference.

    The results are printed to STDOUT to be consumed by a child process of rampart.js.
    Errors to STDOUT will be swallowed; instead write to STDERR and exit with code != 0.
    """
    args = parse_args()
    coordinate_aligner, coordinate_reference_length, panel_aligner, panel_names = create_index(args.coordinate_reference, args.reference_panel)
    time_stamp, unmatched, mapping_results = mapper(coordinate_aligner, panel_aligner, panel_names, args.fastq)
    summary = {
        "unmappedReadsPerBarcode": [unmatched[idx] for idx in range(0, max(unmatched.keys())+1)],
        "timeStamp": str(time_stamp),
        "readData": mapping_results
    }
    print(json.dumps(summary))
    sys.exit(0)
