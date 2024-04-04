# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

from src.agg_trip_distance import aggregate_trip_distance, combine_taxi_types, profile
from pyspark.sql import SparkSession


def test():
    spark = (
        SparkSession.builder.master("local[1]")
        .appName("local-tests")
        .config("spark.submit.deployMode", "client")
        .config("spark.executor.cores", "1")
        .config("spark.executor.instances", "1")
        .config("spark.sql.shuffle.partitions", "1")
        .config("spark.driver.bindAddress", "127.0.0.1")
        .getOrCreate()
    )
    sc = spark.sparkContext
    schema = ["trip_distance"]

    green_source_data = (
        sc.parallelize([1.68, 2.54, 1.68, 3.0]).map(lambda x: (x,)).toDF(schema)
    )

    yellow_source_data = (
        sc.parallelize([1.68, 2.54, 1.68, 3.0]).map(lambda x: (x,)).toDF(schema)
    )

    green_agg_df = aggregate_trip_distance(green_source_data)
    assert green_agg_df.count() == 3

    yellow_agg_df = aggregate_trip_distance(yellow_source_data)
    assert yellow_agg_df.count() == 3

    combined_df = combine_taxi_types(green_agg_df, yellow_agg_df)
    assert combined_df.count() == 6

    quality_results = profile(combined_df)
    assert quality_results.statistics["success_percent"] > 90
