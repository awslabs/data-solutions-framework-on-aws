from src import pipeline
from pyspark.sql import SparkSession


if __name__ == "__main__":
    spark = SparkSession.builder.appName("DemoApplication").getOrCreate()
