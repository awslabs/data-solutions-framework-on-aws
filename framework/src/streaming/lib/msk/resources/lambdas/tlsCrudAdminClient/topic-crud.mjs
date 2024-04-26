// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export async function topicCrudOnEvent (event, admin) {
  switch (event.RequestType) {
    case 'Create':
    
      console.log(event.ResourceProperties.topic);
      
      try {
        
        const result = await admin.createTopics({
          validateOnly: false,
          waitForLeaders: event.ResourceProperties.waitForLeaders,
          timeout: event.ResourceProperties.timeout,
          topics: [event.ResourceProperties.topic],
        });
        
        console.log(`Topic created: ${result}`);
        if ( result == false ) {
          throw new Error(`Error creating topic: ${event.ResourceProperties.topic}`);
        }
        break;
        
      }
      catch (error) {
        console.log(`Error creating topic: ${JSON.stringify(error)}`);
        throw new Error(`Error creating topic: ${event.ResourceProperties.topic}. Error ${JSON.stringify(error)}`);
      }
    
    case 'Update':
    
      console.info(event.ResourceProperties.topic);

      const oldTopic = event.OldResourceProperties.topic;
      const newTopic = event.ResourceProperties.topic;

      if ( newTopic.numPartitions > oldTopic.numPartitions ) {
        console.log("creating new partitions...")
        try {
          
          const result = await admin.createPartitions({
            validateOnly: false,
            timeout: event.ResourceProperties.timeout,
            topicPartitions: [{
              topic: newTopic.topic,
              count: newTopic.numPartitions,
              assignments: undefined
            }],
          });
          
          console.log(`Topic partition count updated: ${result}`);
        }
        catch (error) {
          console.log(`Error updating topic number of partitions: ${JSON.stringify(error)}`);
          throw new Error(`Error updating topic number of partitions: ${event.ResourceProperties.topic}. Error ${JSON.stringify(error)}`);
        }
      } else if ( newTopic.numPartitions < oldTopic.numPartitions ) {
        throw new Error(`Error updating topics: number of partitions can't be decreased`);
      }

      // if (newTopic.replicationFactor > oldTopic.replicationFactor || newTopic.replicaAssignment !== oldTopic.replicaAssignment) {
      //   console.log(`Error updating topics: replication factor update is not supported`);
      // }

      // if (newTopic.configEntries !== oldTopic.configEntries) {
      //   console.log(`Error updating topics: configuration entries update is not supported`);
      // }
      
      // if (newTopic.replicationFactor > oldTopic.replicationFactor || newTopic.replicaAssignment !== oldTopic.replicaAssignment) {
      //   if (newTopic.replicaAssignment === oldTopic.replicaAssignment) {
      //     throw new Error(`Error updating topics: replication can only be increased by providing replicas assignment`);
      //   } else {
      //     console.log("updating partitions assignment...")
      //     try {
      //       const result = await admin.alterPartitionReassignments({
      //         validateOnly: false,
      //         timeout: event.ResourceProperties.timeout,
      //         topics: [{
      //           topic: newTopic.topic,
      //           partitionAssignment: newTopic.replicaAssignment,
      //         }],
      //       });
  
      //       console.log(`Topic replication factor updated: ${result}`);
      //       await admin.disconnect();
      //       break;
      //     }
      //     catch (error) {
      //       await admin.disconnect();
      //       console.log(`Error updating topic replication factor: ${JSON.stringify(error)}`);
      //       throw new Error(`Error updating topic replication factor: ${event.ResourceProperties.topic}. Error ${JSON.stringify(error)}`);
      //     }
      //   }
      // }
      
    case 'Delete':
        
      console.log(event.ResourceProperties.topic);
      
      try {
        const result = await admin.deleteTopics({
          timeout: event.ResourceProperties.timeout,
          topics: [event.ResourceProperties.topic.topic],
        });
        
        console.log(`Topic deleted: ${result}`);
        break;
      }
      catch (error) {
        console.log(`Error deleting topic: ${error.errorMessage}`);
        console.log(`Error deleting topic: ${error.message}`);
        if (error.errorMessage.includes('topics is not defined')) {
          console.log('Topic is not defined, skipping...');
          break;
        }
        console.log(`Error deleting topic: ${JSON.stringify(error)}`);
        throw new Error(`Error deleting topics: ${event.ResourceProperties.topic}. Error ${JSON.stringify(error)}`);
        
      }
      
    default:
      throw new Error(`invalid request type: ${event.RequestType}`);
  }
}