import argparse
from Bio import SeqIO
from collections import defaultdict

def parse_args():
    parser = argparse.ArgumentParser(description='Parse barcode info and minimap paf file, create report.')

    parser.add_argument("--paf_file", action="store", type=str, dest="paf_file")
    parser.add_argument("--annotated_reads", action="store", type=str, dest="reads")

    parser.add_argument("--report", action="store", type=str, dest="report")

    parser.add_argument("--reference_file", action="store", type=str, dest="references")
    parser.add_argument("--reference_options", action="store", type=str, dest="reference_options")

    parser.add_argument("--min_read_length", action="store", type=int, dest="min_read_length")
    parser.add_argument("--max_read_length", action="store", type=int, dest="max_read_length")

    return parser.parse_args()

def parse_reference_options(reference_options):
    #returns a dict of {key:list} pairs containing  
    # csv_header_to_be : list of corresponding read_header_group with optional coordinates
    # e.g. "genogroup" : [["genogroup"]]
    # e.g. "loc_genotype" : [["POL_genogroup",0,5000],["VP_genogroup",5000,7000]]
    columns = reference_options.split(";")
    ref_options = defaultdict(list)
    for i in columns:
        k,v = i.rstrip(']').split("[")
        v = [i.split(':') for i in v.split(",")]
        new_v =[]
        for sublist in v:
            if len(sublist)==3:
                new_v.append([sublist[0],int(sublist[1]),int(sublist[2])])
            else:
                new_v.append(sublist)
        ref_options[k]=new_v
        

    return ref_options, ','+','.join(ref_options.keys())

def parse_reference_file(references):
    #returns a dict of dicts containing reference header information
    #key is seq id i.e. first field of the header string
    ref_info = defaultdict(dict)
    for record in SeqIO.parse(references,"fasta"):
        tokens = record.description.split(' ')
        for i in tokens:
            try:
                info = i.split('=')
                ref_info[record.id][info[0]]=info[1]
                # ref_info['*'][info[0]]='NA'
            except:
                pass
    return ref_info

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

def check_overlap(coords1,coords2):
    list1 = list(range(coords1[0],coords1[1]))
    list2 = list(range(coords2[0],coords2[1]))
    overlap = set(list1).intersection(list2)
    if overlap:
        return True, len(overlap)
    else:
        return False, 0 

def parse_paf(paf, report, reads, min_read_length, max_read_length, reference_options, reference_info):
    #This function parses the input paf file 
    #and outputs a csv report containing information relevant for RAMPART and barcode information
    # read_name,read_len,start_time,barcode,best_reference,start_coords,end_coords,ref_len,matches,aln_block_len,ref_option1,ref_option2
    unmapped = 0

    header_dict=get_barcode_time(reads)

    with open(str(paf),"r") as f:
        for l in f:
            ref_option_string = ""
            tokens=l.rstrip('\n').split()
            read_name,read_len = tokens[:2]
            barcode,start_time=header_dict[read_name]
            ref_hit,ref_len,coord_start,coord_end,matches,aln_block_len=tokens[5:11]

            if ref_hit=='*': #output by minimap2 if read doesn't map
                coord_start,coord_end=0,0
                unmapped +=1
                if reference_options!=None:
                    
                    for k in reference_options:
                        ref_option_string+="NA,"
            else:
                if reference_options!=None:
                    for k in reference_options:
                        if len(reference_options[k]) == 1:
                            ref_option_string += reference_info[ref_hit][k] + ','
                        else:
                            overlap_list = []
                            for i in reference_options[k]:
                                if len(i) == 3:
                                    sub_k,opt_start,opt_end= i
                                    overlap,length = check_overlap((opt_start,opt_end),(int(coord_start),int(coord_end)))
                                    if overlap:
                                        overlap_list.append((reference_info[ref_hit][sub_k],length))
                            best = sorted(overlap_list, key = lambda x : x[1], reverse=True)[0]
                            ref_option_string += best[0] + ','

            if int(read_len) >= min_read_length and int(read_len) <= max_read_length:
                report.write(f"{read_name},{read_len},{start_time},{barcode},{ref_hit},{ref_len},{coord_start},{coord_end},{matches},{aln_block_len}")
                if reference_options!=None:
                    report.write(f",{ref_option_string.rstrip(',')}\n")
                else:
                    report.write("\n")

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
        
        if args.reference_options:
            reference_options,ref_option_header = parse_reference_options(args.reference_options)
            reference_info = parse_reference_file(args.references)
        else:
            reference_options,ref_option_header = None,''
            reference_info = None

        csv_report.write(f"read_name,read_len,start_time,barcode,best_reference,ref_len,start_coords,end_coords,num_matches,aln_block_len{ref_option_header}\n")
        parse_paf(args.paf_file,csv_report,args.reads, args.min_read_length, args.max_read_length,reference_options,reference_info)
