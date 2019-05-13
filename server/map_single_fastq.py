import sys
import re
import json
import argparse
import math
import mappy as mp

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

def create_coordinate_index(coordinate_reference):
    """Initialise minimap2 for 2 different reference FASTAs"""
    ## Parse the (single) reference sequence used to find co-ordinates:
    coordinate_aligner = mp.Aligner(coordinate_reference, best_n=1)
    name, seq, qual = next(mp.fastx_read(coordinate_reference, read_comment=False))
    coordinate_reference_length = len(seq)
    if not coordinate_aligner:
        raise Exception("ERROR: failed to load/build index file '{}'".format(coordinate_reference))

    return (coordinate_aligner, coordinate_reference_length)

def create_reference_index(reference_panel):
    ## Parse the panel of reference sequences used to find the best match
    panel_aligner = mp.Aligner(reference_panel, best_n = 1)
    if not panel_aligner:
        raise Exception("ERROR: failed to load/build index file '{}'".format(reference_panel))

    reference_panel_names = []
    for name, seq, qual in mp.fastx_read(reference_panel, read_comment=False):
        reference_panel_names.append(name)

    return (panel_aligner, reference_panel_names)

def mapper(coordinate_aligner, coordinate_reference_length, panel_aligner, panel_names, fastq_path):
    unmatched = {} # counts of unmatched reads, based on barcode (index)
    mapping_results = []
    first_read_time_stamp = None
    fastqPosition = -1 # read number in FASTQ. zero-based.
    for name, seq, qual, comment in mp.fastx_read(fastq_path, read_comment=True): # read one sequence
        fastqPosition += 1
        # parse the header
        header = re.search(r'barcode=([^\s]+)', comment)
        if header:
            barcode = header.group(1)
        else:
            barcode = "none" # no match

        header = re.search(r'start_time=([^\s]+)', comment)
        if header and not first_read_time_stamp:
            first_read_time_stamp = header.group(1)

        try:
            coord = next(coordinate_aligner.map(seq))
        except StopIteration:
            coord = None

        try:
            panel = next(panel_aligner.map(seq))
        except StopIteration:
            if barcode in unmatched:
                unmatched[barcode] += 1
            else:
                unmatched[barcode] = 1
            continue;

        if coord is not None: # managed to map to the coordinate reference
            start = coord.r_st
            end = coord.r_en
            # print("Coord: start, end", start, end)
        else: # if not aligned to coordinate reference then interpolate
            start = math.floor((coordinate_reference_length * panel.r_st) / panel.ctg_len)
            end = math.floor((coordinate_reference_length * panel.r_en) / panel.ctg_len)
            # print("Ref: len, start, end", coordinate_reference_length, panel.r_st, panel.r_en, panel.ctg_len, start, end)

        # print(name, barcode, panel.ctg, panel_names.index(panel.ctg), coord.r_st, coord.r_en, panel.mlen / panel.blen)
        mapping_results.append(
            # barcode, reference panel match (idx),   start pos,  end pos, reference length,   identity
            [fastqPosition, barcode, panel.ctg, start, end, panel.mlen / panel.blen]
        )
    return (first_read_time_stamp, unmatched, mapping_results)


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
    coordinate_aligner, coordinate_reference_length = create_coordinate_index(args.coordinate_reference)

    # print(coordinates)

    panel_aligner, panel_names = create_reference_index(args.reference_panel)
    first_read_time_stamp, unmatched, mapping_results = mapper(coordinate_aligner, coordinate_reference_length, panel_aligner, panel_names, args.fastq)
    # summary = {
    #     "timeStamp": str(first_read_time_stamp),
    #     "readData": mapping_results
    # }
    print(json.dumps(mapping_results))
    # print(json.dumps(mapping_results, indent=2)) # nicer for debugging
    sys.exit(0)
