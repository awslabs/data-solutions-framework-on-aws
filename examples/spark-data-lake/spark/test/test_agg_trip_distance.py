# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0


from src.agg_trip_distance import aggregate_trip_distance, combine_taxi_types
from pyspark.sql import SparkSession
from pyspark import SparkConf


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
green_source_data = [
  ("jose", "oak", "switch"),
  ("li", "redwood", "xbox"),
  ("luisa", "maple", "ps4"),
]

yellow_source_data = [
  ("jose", "oak", "switch"),
  ("li", "redwood", "xbox"),
  ("luisa", "maple", "ps4"),
]

green_source_df = spark.createDataFrame(green_source_data, ["name", "tree", "gaming_system"])

yellow_source_df = spark.createDataFrame(yellow_source_data, ["name", "tree", "gaming_system"])

green_agg_df = aggregate_trip_distance(green_source_df)

yellow_agg_df = aggregate_trip_distance(yellow_source_df)

combined_df = combine_taxi_types(green_agg_df,yellow_agg_df)

assert True


