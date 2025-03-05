# A modified verion of Corey's Dockerfile from: https://github.com/CorwinAnsley/artifice/blob/main/artifice/docker_rampart/Dockerfile
# This will create a docker container that can run rampart and comes preloaded with the mpvx rampart protocol

# start with an image with conda installed
FROM continuumio/miniconda3 AS compile-image

# set working directory
WORKDIR /data

# install gcc/make for porechop
RUN apt-get update -y && apt-get upgrade -y
RUN apt install build-essential -y --no-install-recommends

# install rampart
# This is a fork of rampart with "nodejs" pinned to 20.7.0
# Using the original rampart environment.yml leads to an npm version issue.
COPY . ./rampart/

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

SHELL ["/bin/bash", "-c"]

WORKDIR /data/rampart

# update npm, install npm packages, build rampart
RUN export NODE_OPTIONS=--openssl-legacy-provider && \
    source /venv/bin/activate && npm install  && \
    npm run build && npm install --global .

# runtime image
FROM debian:buster-slim AS runtime-image

COPY --from=compile-image /data/rampart /data/rampart

# Copy /venv from the previous stage:
COPY --from=compile-image /venv /venv

RUN apt-get update && apt-get install -y procps

# set environment variable PYTHONUNBUFFERED to allow unbuffered log output for artifice
ENV PYTHONUNBUFFERED=1
ENV PATH=/venv/bin:$PATH

SHELL ["/bin/bash", "-c"]
