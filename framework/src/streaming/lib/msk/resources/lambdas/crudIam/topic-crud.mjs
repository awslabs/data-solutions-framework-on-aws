// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ConfigResourceTypes } from "kafkajs"

function getDifferentConfigEntries(oldEntries, newEntries) {
  if (!oldEntries) {
    return newEntries;
  }

  const differentEntries = [];

  for (const newEntry of newEntries) {
    const oldEntry = oldEntries.find(entry => entry.name === newEntry.name);
    if (!oldEntry || oldEntry.value !== newEntry.value) {
      differentEntries.push(newEntry);
    }
  }

  for (const oldEntry of oldEntries) {
    const newEntry = newEntries.find(entry => entry.name === oldEntry.name);
    if (!newEntry) {
      differentEntries.push(oldEntry);
    }
  }

  return differentEntries;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
          throw new Error(`Error creating topic: ${event.ResourceProperties.topic.topic}`);
        }
        break;
        
      }
      catch (error) {
        // Temp workaround while KafkaJS fixes https://github.com/tulios/kafkajs/issues/815
        if ( error.type == 'LEADER_NOT_AVAILABLE' || error.type == 'UNKNOWN_TOPIC_OR_PARTITION') {
          // Wait a few seconds to get the metadata propagated when using MSK with KRaft mode
          console.log("Waiting 5 seconds to get the metadata propagated and validate again");
          await sleep(5000);
          const allTopics = await admin.listTopics();
          const topicExists = allTopics.includes(event.ResourceProperties.topic.topic);
          if ( topicExists ) {
            console.log(`Topic created: ${event.ResourceProperties.topic.topic}`);
            break;
          } else {
            console.log(`Topic was not created: ${event.ResourceProperties.topic.topic}`);
          }
        }
        console.log(`Error creating topic: ${JSON.stringify(error)}`);
        throw new Error(`Error creating topic: ${JSON.stringify(event.ResourceProperties.topic)}. Error ${JSON.stringify(error)}`);
      }
    
    case 'Update':
    
      console.info(event.ResourceProperties.topic);

      const oldTopic = event.OldResourceProperties.topic;
      const newTopic = event.ResourceProperties.topic;
      let updatedConfigEntries = [];

      // We need to find the attributes that were changed in the update
      if(newTopic.configEntries || oldTopic.configEntries) {
        updatedConfigEntries = getDifferentConfigEntries(oldTopic.configEntries, newTopic.configEntries);
      }

      console.log(updatedConfigEntries);

      console.log("updating topic...");

      console.log({
        type: ConfigResourceTypes.TOPIC,
        name: newTopic.topic,
        configEntries: updatedConfigEntries
    });

      if(updatedConfigEntries) {
        await admin.alterConfigs({
          resources: [{
              type: ConfigResourceTypes.TOPIC,
              name: newTopic.topic,
              configEntries: updatedConfigEntries
          }]
        });
      
      }

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

      await admin.disconnect();
      break;
      
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