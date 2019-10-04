import argparse
from Bio import SeqIO
from collections import defaultdict

def parse_args():
    parser = argparse.ArgumentParser(description='Parse barcode info and minimap paf file, create report.')

    parser.add_argument("--paf_file", action="store", type=str, dest="paf_file")
    parser.add_argument("--annotated_reads", action="store", type=str, dest="reads")

    parser.add_argument("--report", action="store", type=str, dest="report")
    return parser.parse_args()

def parse_read_header(header):
    #returns a dict of {key:value} pairs containing all 
    #" key=value" strings present on the read header

    tokens= header.split(' ')
    header_info = {}
    for i in tokens:
        try:
            info = i.split('=')
            header_info[info[0]]=info[1]
        except:
            pass
    return header_info

def get_barcode_time(reads):
    #This function parses the fastq file and returns a dictionary
    #with read name as the key and barcode information as the value
    # i.e. barcode_dict[read_name]=barcode

    header_dict = {}
    for record in SeqIO.parse(str(reads),"fastq"):
        header = parse_read_header(str(record.description))
        try:
            barcode = header["barcode"]
            start_time = header["start_time"]
        except:
            barcode = 'none'
            start_time = header["start_time"]

        header_dict[record.id]=(barcode, start_time)
        
    return header_dict

def parse_paf(paf,report,reads):
    #This function parses the input paf file 
    #and outputs a csv report containing information relevant for RAMPART and barcode information
    # read_name,read_len,start_time,barcode,best_reference,start_coords,end_coords,ref_len,matches,aln_block_len
    unmapped = 0

    header_dict=get_barcode_time(reads)

    with open(str(paf),"r") as f:
        for l in f:
            tokens=l.rstrip('\n').split()
            read_name,read_len = tokens[:2]
            barcode,start_time=header_dict[read_name]
            ref_hit,ref_len,coord_start,coord_end,matches,aln_block_len=tokens[5:11]

            if ref_hit=='*': #output by minimap2 if read doesn't map
                coord_start,coord_end=0,0
                unmapped +=1
            
            report.write("{},{},{},{},{},{},{},{},{},{}\n".format(read_name,read_len,start_time,barcode,ref_hit,ref_len,coord_start,coord_end,matches,aln_block_len))

    try:
        prop_unmapped = unmapped / len(header_dict)
        print("Proportion unmapped is {}".format(prop_unmapped))
        if prop_unmapped >0.95:
            print("\nWarning: Very few reads have mapped (less than 5%).\n")
    except:
        print("Probably can't find the records.") #division of zero the error

if __name__ == '__main__':

    args = parse_args()

    with open(str(args.report), "w") as csv_report:

        csv_report.write("read_name,read_len,start_time,barcode,best_reference,ref_len,start_coords,end_coords,num_matches,aln_block_len\n")
        parse_paf(args.paf_file,csv_report,args.reads)
