# RAMPART
Read Assignment, Mapping, and Phylogenetic Analysis in Real Time.


RAMPART runs concurrently with MinKNOW and shows you demuxing / mapping results in real time.

![](docs/images/main.png)


## Motivation
Time is crucial in outbreak analysis, and recent advancements in sequencing prep now mean that sequencing is the bottleneck for many pathogens.
Furthermore, the small size of many pathogens mean that insightful sequence data is obtained in a matter of minutes.
RAMPART run concurrently with MinION sequencing of such pathogens.
It provides a real-time overview of genome coverage and reference matching for each barcode.

RAMPART was originally designed to work with amplicon-based primer schemes (e.g. for [ebola](https://github.com/artic-network/primer-schemes)), but this isn't a requirement.



## Documentation

* [Installation](docs/installation.md)
* [Running an example dataset & understanding the visualisations](docs/examples.md)
* [Setting up for your own run](docs/setting-up.md)
* [Configuring RAMPART using protocols](docs/protocols.md)
* [Debugging when things don't work](docs/debugging.md)
* [Notes relating to RAMPART development](docs/developing.md)

### Quick install

You can (re)deploy rampart after installing [miniconda3](https://docs.conda.io/en/latest/miniconda.html) by issuing:
```
./utils/redeploy_rampart.sh
```

## Status

RAMPART is in development with a publication forthcoming.
Please [get in contact](https://twitter.com/hamesjadfield) if you have any issues, questions or comments.


## RAMPART has been deployed to sequence:

* [Yellow Fever Virus in Brazil](https://twitter.com/Hill_SarahC/status/1149372404260593664)
* [ARTIC workshop in Accra, Ghana](https://twitter.com/george_l/status/1073245364197711874)
