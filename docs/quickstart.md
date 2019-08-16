# Quickstart for installing and running RAMPART

These instructions describe how to quickly and easily install and run RAMPART with the minimum of setting up. For more detailed instructions for installing and customising RAMPART for particular experiments [see here](installation).

### Install RAMPART

**Clone the github repo in your preferred location and enter the directory**
```bash
git clone https://github.com/artic-network/rampart.git
cd rampart
```

**Create & activate the conda environment**
```bash
conda env create -f environment.yml
source activate artic-rampart
```

Whenever you run RAMPART you must be in the "artic-rampart" conda environment. You can enter / leave this environment via:
```bash
source activate artic-rampart # some systems use `conda activate artic-rampart`
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

### Install Porechop (used for demuxing reads)
_Make sure you are still in the "artic-rampart" conda environment -- you can run `conda env list` to check_

```bash
cd .. # leave the RAMPART directory
git clone https://github.com/rambaut/Porechop.git
cd Porechop/
python setup.py install
cd ..
```
Check `porechop` is available on the command line by running `porechop -h`.

