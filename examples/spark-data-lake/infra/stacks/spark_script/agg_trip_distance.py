from pyspark.sql import *
from pyspark.sql.functions import lit, col
from pyspark.sql.types import StringType
import os
source_location = os.environ["SOURCE_LOCATION"]
target_location = os.environ["TARGET_LOCATION"]
spark = SparkSession.builder.getOrCreate()
green_df = spark.read.parquet(F"{source_location}/green*")
yellow_df = spark.read.parquet(F"{source_location}/yellow*")
green_agg_df = green_df.groupBy("trip_distance").count()
yellow_agg_df = yellow_df.groupBy("trip_distance").count()

combined_df = green_agg_df.withColumn("taxi_type", lit("green")).union(yellow_agg_df.withColumn("taxi_type", lit("yellow")))
combined_df.write.mode("overwrite").parquet(F"{target_location}/nyc_taxis/agg_trip_distance/")
