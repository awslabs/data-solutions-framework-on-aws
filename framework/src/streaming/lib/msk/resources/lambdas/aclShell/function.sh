function handler () {

  EVENT_DATA=$1

  echo "$EVENT_DATA" 1>&2;

  #echo "Zookeper connection string: $ZK_CONNECTION_STRING" 1>&2;

  #using jq parse EVENT_DATA to get parameters
  COMMAND=$(echo "$EVENT_DATA" | jq -r '.ResourceProperties.command') 
  REQUEST_TYPE=$(echo "$EVENT_DATA" | jq -r '.RequestType')

  echo "Command: $COMMAND" 1>&2;
  echo "Command: $REQUEST_TYPE" 1>&2;

  COMMAND+=" --authorizer-properties zookeeper.connect=${ZK_CONNECTION_STRING} "
  
  if [ "$REQUEST_TYPE" != "Create" ]; then
    COMMAND=$(echo $COMMAND | sed 's/ --add / --remove /')
  fi
  
  echo "Command Updated: $COMMAND" 1>&2;

  RESULT=$(sh /var/task/kafka_2.13-3.7.0/bin/kafka-acls.sh $COMMAND) 1>&2;
  STATUS=$?
  echo "Status: $STATUS" 1>&2;
  echo "RESULT: $RESULT" 1>&2;
  exit $STATUS;
}