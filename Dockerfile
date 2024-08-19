# A modified verion of Corey's Dockerfile from: https://github.com/CorwinAnsley/artifice/blob/main/artifice/docker_rampart/Dockerfile
# This will create a docker container that can run rampart and comes preloaded with the mpvx rampart protocol

RUN apt install build-essential -y --no-install-recommends

# copy in protocol files
RUN git clone https://github.com/artic-network/rampart-mpxv

# install rampart
# This is a fork of rampart with "nodejs" pinned to 20.7.0
# Using the original rampart environment.yml leads to an npm version issue.
RUN git clone https://github.com/artic-network/rampart.git

# create rampart environment
RUN conda env create -f /data/rampart/environment.yml

# Install conda-pack:
RUN conda install -c conda-forge conda-pack

# Use conda-pack to create a standalone enviornment
# in /venv:
RUN conda-pack -n artic-rampart -o /tmp/env.tar && \
  mkdir /venv && cd /venv && tar xf /tmp/env.tar && \
  rm /tmp/env.tar

# We've put venv in same path it'll be in final image,
# so now fix up paths:
RUN /venv/bin/conda-unpack

#removing git files and example data to save space in final image
RUN rm -rf /data/rampart/.git && rm -rf /data/rampart/example_data

SHELL ["/bin/bash", "-c"]

WORKDIR /data/rampart

# update npm, install npm packages, build rampart
RUN export NODE_OPTIONS=--openssl-legacy-provider && \
    source /venv/bin/activate && npm install  && \
    npm run build && npm install --global .

# runtime image
FROM debian:buster-slim AS runtime-image

COPY --from=compile-image /data/rampart /data/rampart
COPY --from=compile-image /data/rampart-mpxv /data/rampart-mpxv

# Copy /venv from the previous stage:
COPY --from=compile-image /venv /venv

WORKDIR /data/run_data/

# set environment variable PYTHONUNBUFFERED to allow unbuffered log output for artifice
ENV PYTHONUNBUFFERED=1

# create directories to mount the basecalled directory and protocol
RUN mkdir -p /data/run_data/basecalled && \
mkdir -p /data/run_data/protocol && \
cp -a /data/rampart/default_protocol/.  /data/run_data/protocol

SHELL ["/bin/bash", "-c"]

# run rampart
ENTRYPOINT source /venv/bin/activate && if ["$BARCODES" == ""] ; \
then rampart --protocol /data/run_data/protocol --ports ${PORT_ONE} ${PORT_TWO} --basecalledPath /data/run_data/basecalled  --clearAnnotated; \
else rampart --protocol /data/run_data/protocol --ports ${PORT_ONE} ${PORT_TWO} --basecalledPath /data/run_data/basecalled --barcodeNames ${BARCODES} --clearAnnotated ; fi
