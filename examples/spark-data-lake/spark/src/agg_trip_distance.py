# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

from pyspark.sql import *
from pyspark.sql.functions import lit, col
from pyspark.sql.types import StringType
import os


def aggregate_trip_distance(df) :
  return df.groupBy("trip_distance").count()

def combine_taxi_types(green_df, yellow_df) :
  return green_df.withColumn("taxi_type", lit("green")).union(yellow_df.withColumn("taxi_type", lit("yellow")))

if __name__ == "__main__":
  source_location = os.environ["SOURCE_LOCATION"]
  target_location = os.environ["TARGET_LOCATION"]
  spark = SparkSession.builder.getOrCreate()
  green_df = spark.read.parquet(F"{source_location}/green*")
  yellow_df = spark.read.parquet(F"{source_location}/yellow*")

  green_agg_df = aggregate_trip_distance(green_df)
  yellow_agg_df = aggregate_trip_distance(yellow_df)

  combined_df = combine_taxi_types(green_agg_df, yellow_agg_df)
  combined_df.write.mode("overwrite").parquet(F"{target_location}/nyc_taxis/agg_trip_distance/")

