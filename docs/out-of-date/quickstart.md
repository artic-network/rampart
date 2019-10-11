# Steps to get RAMPART up and running

## Step 1: Install RAMPART
[See here](installation)

## Step 2: Run an example dataset to familiarise yourself with the 




These instructions describe how to quickly and easily install and run RAMPART with the minimum of setting up. For more detailed instructions for installing and customising RAMPART for particular experiments [see here](installation).

### Prerequisites:
* The Oxford Nanopore Technology MinKNOW must be installed in order to run the MinION. 
See the [Oxford Nanopore downloads page](https://community.nanoporetech.com/downloads) for instructions.

* Conda should be installed -- [see instructions here](https://conda.io/projects/conda/en/latest/user-guide/install/index.html).
 
  Conda is a popular environment manager which makes it trivial to install dependencies & software in a fashion that won't break other software you may have installed. While you can run RAMPART without conda, it requires you to install and update all of the other software packages it depends on.

### Install RAMPART

**Clone the github repo in your preferred location and enter the directory**
```bash
git clone https://github.com/artic-network/rampart.git
```

**Create & activate the conda environment**
```bash
cd rampart
conda env create -f environment.yml
conda activate artic-rampart
```

Whenever you run RAMPART you must be in the "artic-rampart" conda environment. You can enter / leave this environment via:
```bash
conda activate artic-rampart
conda deactivate artic-rampart
```

**Install Node / JavaScript dependencies**
```bash
yarn
```

**Build the JavaScript frontend**
```
npm run build
```

**Ensure it works**
```bash
node rampart.js -h
```

### Running RAMPART

To run RAMPART you should create a new directory for a particular MinION run: 

```bash
mkdir <run_name>
cd <run_name>
```

Where `<run_name>` is the name of the run or experiment. It would probably be sensible to name this directory the same as the experiment name specified in the MinKNOW software.

You will just need provide a set of reference sequences (at least 1) to map the reads against. The simplest way of doing this is to simply put a FASTA format file in the director and name it `references.fasta`. This will automatically be picked up by the annotation script and used to map the reads. This can contain any number of reference sequences and RAMPART will find the closest match.

Then start the rampart server:

```bash
node <rampart_install_path>/rampart.js --basecalledPath <minknow_data_path>/<run_name>/pass
```

Where `<rampart_install_path>` is the path to the RAMPART directory installed above and `<minknow_data_path>` is the path to the place where MinKNOW stores its read data.

