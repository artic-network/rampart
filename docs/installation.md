# Installation

> These instructions are valid for a soon-to-be released version 1.1.0.
If you want to test this before the official release you can do so by replacing step 2 with `conda install -y jameshadfield::rampart=1.1.0`


These instructions assume that you have installed [MinKNOW](https://community.nanoporetech.com/downloads) and are able to run it.


## Install from conda

We also assume that you are using conda -- See [instructions here](https://conda.io/projects/conda/en/latest/user-guide/install/index.html) to install conda on your machine.

### Step 1: Create a new conda environment or install nodejs into your current conda environment

Create a new conda environment and activate it via:

```bash
conda create -n artic-rampart -y nodejs=12 # any version >10 should be fine
conda activate artic-rampart
```

Or install NodeJS into your currently activated environment via:

```bash
conda install -y nodejs=12 # any version >10 should be fine
```

### Step 2: Install RAMPART

```bash
conda install -y artic-network::rampart=1.1.0
```

### Step 3: Install dependencies

Note that you may already have some or all of these in your environment, in which case they can be skipped.
Additionally, some are only needed for certain analyses and can also be skipped as desired.

> If you are installing RAMPART into the [artic-ncov2019](https://github.com/artic-network/artic-ncov2019) conda environment, you will already have all of these dependencies.


Python, biopython, snakemake and minimap2 are required

```bash
conda install -y "python>=3.6"
conda install -y anaconda::biopython 
conda install -y -c conda-forge -c bioconda "snakemake<5.11" # snakemake 5.11 will not work currently
conda install -y bioconda::minimap2=2.17
```

If you are using guppy to demux samples, you don't need Porechop,
however if you require RAMPART to perform demuxing then you must install the ARTIC fork of Porechop:

```bash
python -m pip install git+https://github.com/artic-network/Porechop.git@v0.3.2pre
```

If you wish to use the post-processing functionality available in RAMPART to bin reads, then you'll need `binlorry`:

```bash
python -m pip install binlorry==1.3.0_alpha1
```

### Step 4: Check that it works

```
rampart --help
```

---

## Install from source

(1) Clone the Github repo 

```bash
git clone https://github.com/artic-network/rampart.git
cd rampart
```

(2) Create an activate the conda environment with the required dependencies.
You can either follow steps 1 & 3 above, or use the provided `environment.yml` file via

```bash
conda env create -f environment.yml
conda activate artic-rampart
```

(3) Install dependencies using `npm`

```bash
npm install
```

(4) Build the RAMPART client bundle

```bash
npm run build
```

(5) (optional, but recommended) install rampart globally within the conda environment
so that it is available via the `rampart` command

```bash
npm install --global .
```

Check that things work by running `rampart --help`

