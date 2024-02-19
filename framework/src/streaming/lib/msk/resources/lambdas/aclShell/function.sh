function handler () {

  EVENT_DATA=$1

  echo "$EVENT_DATA" 1>&2;

  echo "Zookeper connection string: $ZK_CONNECTION_STRING" 1>&2;

  sh /var/task/kafka_2.13-3.7.0/bin/kafka-acls.sh --version 1>&2;

  sh /var/task/kafka_2.13-3.7.0/bin/kafka-acls.sh --authorizer-properties zookeeper.connect="$ZK_CONNECTION_STRING" --add --allow-principal User\:dummy --operation Write --topic testaclfail 1>&2;

  RESPONSE="{\"PhysicalResourceId\": \"myphysicalresource\"}"

  echo $RESPONSE

}