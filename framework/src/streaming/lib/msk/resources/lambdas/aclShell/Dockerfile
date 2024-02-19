FROM public.ecr.aws/lambda/provided:al2023

RUN dnf install java-21-amazon-corretto-headless tar gzip -y
RUN curl -L0 https://downloads.apache.org/kafka/3.7.0/kafka_2.13-3.7.0.tgz --output /var/task/kafka.tgz

RUN tar -xvf kafka.tgz

# Copy custom runtime bootstrap
COPY bootstrap /var/runtime/bootstrap

# Copy function code
COPY function.sh /var/task/function.sh

RUN chmod 755 /var/runtime/bootstrap
RUN chmod 755 /var/task/function.sh

RUN echo ${LAMBDA_TASK_ROOT}

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "function.handler" ]
