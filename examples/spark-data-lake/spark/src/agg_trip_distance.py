# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

from pyspark.sql import *
from pyspark.sql.functions import lit, col
from pyspark.sql.types import StringType
import os
import great_expectations as gx

def aggregate_trip_distance(df):
    return df.groupBy("trip_distance").count()


def combine_taxi_types(green_df, yellow_df):
    return green_df.withColumn("taxi_type", lit("green")).union(
        yellow_df.withColumn("taxi_type", lit("yellow"))
    )

def check_volume(df, nb): 
    context = gx.get_context()
    data_source = context.data_sources.add_spark(name="combined_taxi")
    data_asset = data_source.add_dataframe_asset("combined_taxi_df")
    batch_definition = data_asset.add_batch_definition_whole_dataframe("data_quality_check")
    batch = batch_definition.get_batch(batch_parameters={"dataframe": df})
    expectation = gx.expectations.ExpectTableRowCountToEqual(value=6)
    return batch.validate(expectation)

if __name__ == "__main__":
    yellow_source = os.environ["YELLOW_SOURCE"]
    green_source = os.environ["GREEN_SOURCE"]
    target_database = os.environ["TARGET_DB"]
    target_table = os.environ['TARGET_TABLE']

    spark = SparkSession.builder.getOrCreate()
    green_df = spark.read.parquet(f"{green_source}/*")
    yellow_df = spark.read.parquet(f"{yellow_source}/*")

    green_agg_df = aggregate_trip_distance(green_df)
    yellow_agg_df = aggregate_trip_distance(yellow_df)

    combined_df = combine_taxi_types(green_agg_df, yellow_agg_df)
    combined_df.write.mode("overwrite").saveAsTable(f"{target_database}.{target_table}")

    quality_results = check_volume(combined_df, 10)
    print(quality_results)
