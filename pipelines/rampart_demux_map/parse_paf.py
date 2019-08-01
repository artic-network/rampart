import argparse
from Bio import SeqIO
from collections import defaultdict

parser = argparse.ArgumentParser(description='Parse mappings, add to headings and create report.')
parser.add_argument("--paf_file", action="store", type=str, dest="paf_file")
parser.add_argument("--coordinate_paf_file", action="store", type=str, dest="coordinate_paf_file")

parser.add_argument("--report", action="store", type=str, dest="report")
parser.add_argument("--reads", action="store", type=str, dest="reads")

parser.add_argument("--bed_file", action="store", type=str, dest="bed_file")
parser.add_argument("--coord_ref", action="store", type=str, dest="coord_ref")
parser.add_argument("--references", action="store", type=str, dest="references")


parser.add_argument("--reads_out", action="store", type=str, dest="reads_out")
parser.add_argument("--barcoding_report", action="store", type=str, dest="barcoding_report")
parser.add_argument("--dont_write_reads", action='store_true')


args = parser.parse_args()

#make a read_length dictionary-needed for coordinate references

def get_ref_len(coord_ref,panel_ref):
    # Get length information for the coordinate reference and also for the panel of references

    len_dict = {}
    for record in SeqIO.parse(str(panel_ref),"fasta"):
        len_dict[record.id] = len(record)
    for record in SeqIO.parse(str(coord_ref),"fasta"):
        len_dict["coordinate"]= len(record) # maybe parse this from the json in the future
    return len_dict

def get_hits(paf):
    #This function parses the input paf file and returns a dictionary
    #with read name as the key and a tuple of length 3 containing hit information 
    #as the value
    # i.e. hit_dict[read_name]=(reference,start_coords_on_reference,end_coords_on_reference)

    hit_dict = {}
    with open(str(paf),"r") as f:
        for l in f:
            tokens=l.rstrip('\n').split()
            if tokens[5]=='*': #output by minimap2 if read doesn't map
                hit_dict[tokens[0]]=("none",0,0)
            else:
                hit_dict[tokens[0]]=(tokens[5],int(tokens[7]),int(tokens[8]))
    return hit_dict

def get_barcodes(barcoding_report):
    #This function parses the input barcoding_report.csv file and returns a dictionary
    #with read name as the key and barcode information as the value
    # i.e. barcode_dict[read_name]=barcode

    barcode_dict = {}
    with open(str(barcoding_report),"r") as f:
        for l in f:
            tokens=l.rstrip('\n').split(',')
            barcode_dict[tokens[0]]=tokens[1]
    return barcode_dict

def bed_to_amplicons(bed_file):
    # fxn to convert bed file coords to amplicon dict
    # can deal with bed file of more than one primer scheme
    # will only use used if you provide a bed file and want to 
    # infer which amplicon your read is likely to be
    # Assumes the bed file has matching left and right primers one 
    # after the other.

    amp_dict = defaultdict(list)
    amp_dict["none"].append(("none",0,0))
    ref=''
    c=0
    with open(str(bed_file),"r") as f:
        amp_count = 0.5
        for l in f:
            c+=1
            tokens= l.rstrip('\n').split()

            if tokens[0]!=ref:
                ref = tokens[0]
                amp_count=0.5
            else:
                amp_count+=0.5

            primer_name = tokens[3]
            coords = (int(tokens[1]), int(tokens[2]))
            # pool = tokens[4]

            if primer_name.endswith("LEFT"):
                start = coords[0]
            else:
                end = coords[1]
            if c%2==0:
                amp_name = "Amp{}".format(int(amp_count))

                amp_dict[ref].append((amp_name,start,end))
    return amp_dict

def which_amp_overlaps(ref,amp_dict,hit_dict,record):
    # Will identify which amplicon is the most likely
    read_coords = hit_dict[record.id][1:]
    read_set=set(range(read_coords[0],read_coords[1]))

    intersection=[]
    for amp in amp_dict[ref]:
        #structure of amp_dict[ref]:
        #[(Amp1,start,end),(Amp2,start,end)...(AmpN,start,end)]
    
        amp_range= list(range(amp[1],amp[2]))

        span = len(read_set.intersection(amp_range))
        intersection.append((amp[0],span))

    largest_intersection = sorted(intersection, key = lambda x : int(x[1]), reverse=True)[0]

    return largest_intersection

unknown=False
unmapped_count=0
coord_unmapped = 0
record_count=0

#The following code parses through the input files 
#It takes the mapping information from the paf file
#Currently the barcode information is taken from the header of the 
#demuxed reads (future: porechop to produce a barcode report).
# This script anticipates that and can take the barcode information 
# from a report either.
# But there is an optional argument to produce a csv report 
# rather than writing the annotated reads

with open(str(args.reads_out),"w") as fw: #file to write reads

    len_dict = get_ref_len(args.coord_ref,args.references)

    if args.bed_file:
        amp_dict=bed_to_amplicons(args.bed_file)

    if args.barcoding_report:
        barcode_dict=get_barcodes(args.barcoding_report)

    if args.report:
        freport=open(args.report, "w")
        if args.bed_file:
            freport.write("Read,Read_Length,Barcode,Reference,Coordinates,Amplicon,Span\n")
        else:
            freport.write("Read,Read_Length,Barcode,Reference,Coordinates\n")

    if args.paf_file:
        hit_dict=get_hits(args.paf_file) #key= read_id, value = (ref,start_on_ref,end_on_ref)
    
    if args.coordinate_paf_file:
        coordinate_hit_dict = get_hits(args.coordinate_paf_file)

    records = []
    for record in SeqIO.parse(str(args.reads),"fastq"):

        record_count+=1
        header = str(record.description)

        if args.coordinate_paf_file:
            try:
                coords=coordinate_hit_dict[record.id][1:]
                header += " coords={}:{}".format(coords[0],coords[1])
            except:
                if args.paf_file: 
                    try:
                        ref_length = len_dict[hit_dict[record.id][0]]
                        length = len_dict["coordinate"]
                        start,end=hit_dict[record.id][1:]
                        start_coord = int(length*(float(start)/ref_length))
                        end_coord = int(length*(float(end)/ref_length))
                        header += " coords={}:{}".format(start_coord,end_coord)

                        coordinate_hit_dict[record.id]=("inferred",start_coord,end_coord)

                    except:
                        coord_unmapped+=1
                        header += " coords={}:{}".format(0,0)
                        coordinate_hit_dict[record.id]=("none",0,0)

        if args.paf_file: 
            try:
                ref=hit_dict[record.id][0]
                header += " reference_hit={}".format(ref)
            except:
                ref="none"
                hit_dict[record.id]=("none",0,0)
                header += " reference_hit=none"
                unmapped_count+=1

        if args.bed_file:
            amp,span = which_amp_overlaps(ref,amp_dict,hit_dict,record)
            header += " amplicon={} span={}".format(amp,span)

        if args.report:
            try:
                if args.barcoding_report:
                    barcode=barcode_dict[record.id]
                else:
                    barcode=[i.split('=')[1] for i in header.split(' ') if i.startswith("barcode=")][0]
            except:
                barcode="Unknown"
                unknown=True
            read_coords = "{}-{}".format(coordinate_hit_dict[record.id][1],coordinate_hit_dict[record.id][2])

            if args.bed_file:
                freport.write("{},{},{},{},{},{},{}\n".format(record.id,len(record),barcode,ref,read_coords,amp,span))
            else:
                freport.write("{},{},{},{},{}\n".format(record.id,len(record),barcode,ref,read_coords))
        
        record.description = header
        records.append(record)
    if not args.dont_write_reads:
        SeqIO.write(records, fw, "fastq")
try:
    prop_unmapped = unmapped_count/record_count
    print("Number of missing reads for coordinate mapping is {}".format(coord_unmapped))
except:
    print("No records, what's going on!!!?")

if prop_unmapped >0.95:
    print("\nWarning: Very few reads have mapped (less than 5%).\n")
elif prop_unmapped > 0.5:
    print("\nWarning: Over half of your reads haven't mapped, perhaps consider using a different reference panel.\n")

if unknown:
    print("\nWarning: Samples haven't got barcode information, you may want to consider demultiplexing.\n")

if args.report:
    freport.close()
