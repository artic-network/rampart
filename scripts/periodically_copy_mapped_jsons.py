import sys, os
import glob
import random
import shutil
import time
import argparse

def folder_set_up(outdir):
    if not os.path.exists(outdir):
        os.makedirs(outdir)

    # remove any previous real-time-mapping files
    files = glob.glob(os.path.join(outdir, "*"))
    for f in files:
        if not os.path.isdir(f):
            os.remove(f)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Split MinKNOW produced fast5 files into time sliced folders')
    parser.add_argument("--rate", help="time (in s) between copying JSONs. 60 (default) mimics real time", default=60)
    parser.add_argument("indir", help="Directory with pre-mapped JSONs. Each sub-directory corresponds to 1 minute of fast5 capture")
    parser.add_argument("outdir", help="Directory where JSONs will be copied to. The RAMPART server should watch this. This is commonly rampart/data/real_time_reads/")
    args = parser.parse_args()

    folder_set_up(args.outdir)

    source_folders = [dir for dir in glob.glob(os.path.join(args.indir, "*")) if os.path.isdir(dir)]
    source_folders.sort(key=lambda x: int(os.path.basename(x).split("_")[1]))

    print("Started.")
    time_waited = 0;
    source_idx = 0;
    file_counter = 0;

    # copy the info.json from the first directory
    try:
        shutil.copyfile(os.path.join(source_folders[0], "info.json"), os.path.join(args.outdir, "info.json"))
    except err:
        print("No info.json found!", err)
        sys.exit(2)

    while True:
        time.sleep(1)
        time_waited += 1
        print("\rWaited {}/{}s   ".format(time_waited, args.rate), end="",  flush=True)
        if time_waited >= int(args.rate):
            time_waited = 0
            files = glob.glob(os.path.join(source_folders[source_idx], "*mapped*json"))
            for filename in files:
                shutil.copyfile(filename, os.path.join(args.outdir, "mapped_{}.json".format(file_counter)))
                file_counter += 1

            print("\rAdded {} mapped JSONs to {}".format(len(files), args.outdir))

            source_idx += 1
            if source_idx >= len(source_folders):
                print("No more mapping folders to scan. Exiting.")
                sys.exit(0)
