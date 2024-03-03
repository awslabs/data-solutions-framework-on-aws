function handler () {

  #get parameters
  REQUEST_TYPE=$1
  COMMAND=$2
  OLD_COMMAND=$3 
  

  echo "Command: $COMMAND" 1>&2;
  echo "Request Type: $REQUEST_TYPE" 1>&2;
  echo "Old Command: $OLD_COMMAND" 1>&2;

  COMMAND+=" --authorizer-properties zookeeper.connect=${ZK_CONNECTION_STRING} "
  
  if [ "$REQUEST_TYPE" == "Update" ]; then
    OLD_COMMAND=$(echo $OLD_COMMAND | sed 's/ --add / --remove /')
    RESULT=$(sh /var/task/kafka_2.13-3.7.0/bin/kafka-acls.sh $OLD_COMMAND) 1>&2;
    STATUS=$?
    echo "Result Old Command: $RESULT" 1>&2;
    echo "Status Old Command: $STATUS" 1>&2;
    if [ $STATUS -ne 0 ]; then
      exit $STATUS;
    fi
  fi
  
  if [ "$REQUEST_TYPE" == "Delete" ]; then
    COMMAND=$(echo $COMMAND | sed 's/ --add / --remove /')
  fi

  echo "Command Updated: $COMMAND" 1>&2;

  RESULT=$(sh /var/task/kafka_2.13-3.7.0/bin/kafka-acls.sh $COMMAND) 1>&2;
  STATUS=$?
  echo "Status: $STATUS" 1>&2;
  echo "RESULT: $RESULT" 1>&2;
  exit $STATUS;
}