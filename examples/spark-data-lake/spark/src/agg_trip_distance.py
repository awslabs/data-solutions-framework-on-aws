# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

from pyspark.sql import *
from pyspark.sql.functions import lit, col
from pyspark.sql.types import StringType
import os
from great_expectations.profile.basic_dataset_profiler import BasicDatasetProfiler
from great_expectations.dataset.sparkdf_dataset import SparkDFDataset

def aggregate_trip_distance(df):
    return df.groupBy("trip_distance").count()


def combine_taxi_types(green_df, yellow_df):
    return green_df.withColumn("taxi_type", lit("green")).union(
        yellow_df.withColumn("taxi_type", lit("yellow"))
    )

def profile(df): 
    expectation_suite, validation_result = BasicDatasetProfiler.profile(SparkDFDataset(df.limit(1000)))
    return validation_result

if __name__ == "__main__":
    source_location = os.environ["SOURCE_LOCATION"]
    target_location = os.environ["TARGET_LOCATION"]
    spark = SparkSession.builder.getOrCreate()
    green_df = spark.read.parquet(f"{source_location}/green*")
    yellow_df = spark.read.parquet(f"{source_location}/yellow*")

    green_agg_df = aggregate_trip_distance(green_df)
    yellow_agg_df = aggregate_trip_distance(yellow_df)

    combined_df = combine_taxi_types(green_agg_df, yellow_agg_df)
    combined_df.write.partitionBy("taxi_type").mode("overwrite").parquet(
        f"{target_location}/nyc_taxis/agg_trip_distance/"
    )

    quality_results = profile(combined_df)
    quality_results.save_json(f"{target_location}/nyc_taxis/agg_trip_distance_quality_results.json")
