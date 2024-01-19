# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

FROM --platform=linux/amd64 public.ecr.aws/amazonlinux/amazonlinux:latest AS base

RUN dnf install -y python3

ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

COPY . .

RUN python3 -m pip install --upgrade pip && \
    python3 -m pip install venv-pack==0.2.0 && \
    python3 -m pip install .

RUN mkdir /output && venv-pack -o /output/pyspark.tar.gz && chmod ugo+r /output/pyspark.tar.gz
