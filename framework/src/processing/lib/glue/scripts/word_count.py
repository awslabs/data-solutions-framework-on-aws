import sys
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job

# Define the expected arguments
args = getResolvedOptions(sys.argv, ['JOB_NAME', 'input_path', 'output_path'])

sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

spark._jsc.hadoopConfiguration().set("spark.hadoop.mapreduce.outputcommitter.factory.class", "org.apache.hadoop.mapred.FileOutputCommitterFactory")
spark._jsc.hadoopConfiguration().set("mapred.output.committer.class", "org.apache.hadoop.mapred.DirectFileOutputCommitter")

# Get the input and output paths from the arguments
input_path = args['input_path']
output_path = args['output_path']

# Sample word count program
# Read data from S3
lines = spark.read.text(input_path).rdd.map(lambda r: r[0])

# Count words
counts = lines.flatMap(lambda line: line.split(" ")) \
              .map(lambda word: (word, 1)) \
              .reduceByKey(lambda a, b: a + b)

# Save result to S3
counts.saveAsTextFile(output_path)

job.commit()