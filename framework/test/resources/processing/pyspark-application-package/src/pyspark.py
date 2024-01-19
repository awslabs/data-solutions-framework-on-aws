# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

from src import pipeline
from pyspark.sql import SparkSession


if __name__ == "__main__":
    spark = SparkSession.builder.appName("DemoApplication").getOrCreate()
