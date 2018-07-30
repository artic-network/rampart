import sys, os
import glob
import random
import shutil
import time

if __name__ == '__main__':
    """This file is only temporary.
    Every 1 second it either passes or writes
    a file to data/real_time_reads/<DATE>
    This file is actually simply a copy of a file in read_files
    See the real read_mapping_daemon for actual reads.
    """

    indir = "./data/read_files/"
    outdir = "./data/real_time_reads/"
    print("Mock read mapping daemon running. Files produced in {}.".format(outdir))

    if not os.path.exists(outdir):
        os.makedirs(outdir)

    # remove any previous real-time-mapping files
    files = glob.glob(outdir + "*")
    for f in files:
        os.remove(f)

    source_files = glob.glob(indir + "*")

    i = 0;
    while True:
        # produce a mapped read around 30% of the time
        if random.random() < 0.3:
            shutil.copyfile(source_files[i], os.path.join(outdir, os.path.basename(source_files[i])))
            i+=1
            if i == len(source_files):
                print("No more JSONs to copy over. EXITING")
                break

        time.sleep(1)
