# RAMPART
Read Assignment, Mapping, and Phylogenetic Analysis in Real Time

**Status: Working, Unpublished**

Time is crucial in outbreak analysis, and recent advancements in sequencing prep now mean that sequencing is the bottleneck for many pathogens.
Furthermore, the small size of many pathogens mean that insightful sequence data is obtained in a matter of minutes.
RAMPART run concurrently with MinION sequencing of such pathogens.
It provides a real-time overview of genome coverage and reference matching for each barcode.
(Consensus sequence creation and phylogenetic placement is currently under development.)

RAMPART is primarily designed to work with amplicon-based primer schemes (e.g. for [ebola](https://github.com/artic-network/primer-schemes)), but may be used with most other datasets.


![](docs/overview.gif)



## Documentation

* [How it works](docs/overview.md)
* [Config file](docs/config.md)
* [Installation](docs/installation.md)
* [Instructions for sequencing & basecalling](docs/sequencing.md)
* [Running RAMPART](docs/run.md)
