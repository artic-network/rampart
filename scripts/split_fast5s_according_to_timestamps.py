import os
import sys
import glob
import argparse
import math
import shutil
from collections import defaultdict


def get_initial_timestamp(indir):
    files = glob.glob(os.path.join(indir, "0", "*.fast5"))
    files.sort(key=os.path.getmtime)
    return os.path.getmtime(files[0])

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Split MinKNOW produced fast5 files into time sliced folders')
    parser.add_argument("--n-stop", help="number of directories to process")
    parser.add_argument("indir", help="Directory with a the integer-named folders which themselves contain the fast5s")
    parser.add_argument("outdir", help="Directory where time-sliced fast5s will be copied over to... (contents will be deleted first!)")
    args = parser.parse_args()

    print("Splitting FAST5 files into per-minute time slices")
    t0 = get_initial_timestamp(args.indir)
    groups = defaultdict(list)


    dirs = [dir for dir in glob.glob(os.path.join(args.indir, "*")) if os.path.isdir(dir)]
    dirs.sort(key=lambda x: int(x.split("/")[-1]))
    if args.n_stop:
        dirs = dirs[0:int(args.n_stop)]

    for dir in dirs:
        files = glob.glob(os.path.join(dir, "*.fast5"))
        for f in files:
            offset = int(math.floor((os.path.getmtime(f) - t0)/60))
            key = "t_{}_{}".format(offset, offset+1)
            groups[key].append(f)

    for k, vals in groups.items():
        print(k, "->", len(vals), "fast5 files")


    if os.path.exists(args.outdir):
        shutil.rmtree(args.outdir)
    os.makedirs(args.outdir)

    for subdir, files in groups.items():
        print("Copying {} fast5s to subdirectory {}...".format(len(files), subdir))
        os.makedirs(os.path.join(args.outdir, subdir))
        for f in files:
            shutil.copyfile(f, os.path.join(args.outdir, subdir, os.path.split(f)[-1]))
