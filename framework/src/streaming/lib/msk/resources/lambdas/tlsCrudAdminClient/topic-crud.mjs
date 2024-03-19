

export async function topicCrudOnEvent (event, admin) {
    switch (event.RequestType) {
        case 'Create':

            console.log(event.ResourceProperties.topics);

            try {

                let kafkaResponse = await admin.createTopics({
                    validateOnly: false,
                    waitForLeaders: event.ResourceProperties.waitForLeaders,
                    timeout: event.ResourceProperties.timeout,
                    topics: event.ResourceProperties.topics,
                });
    
                console.log(kafkaResponse);
    
                await admin.disconnect();
                
                return { 
                    "Data": {
                        "kafkaResponse": kafkaResponse
                    }
                  };

            }
            catch (error) {
                await admin.disconnect();

                throw new Error(`Error creating topics: ${event.ResourceProperties.topics}. Error ${error}`);
            }

        case 'Update':

            console.info(event.RequestType);
            console.info(event.ResourceProperties.topics);

            try {
                
                let updatedTopics = []; 

                event.ResourceProperties.topics.forEach (topic => {
                    updatedTopics.push({
                        topic: topic.topic,
                        count: topic.numPartitions,
                        assignments: undefined
                    });
                });

                await admin.createPartitions({
                    validateOnly: false,
                    timeout: event.ResourceProperties.timeout,
                    topicPartitions: updatedTopics,
                });
    
                await admin.disconnect();
                
                return { 
                    "Data": {
                        "kafkaResponse": true
                    }
                  };

            }
            catch (error) {
                await admin.disconnect();

                throw new Error(`Error updating topics: ${event.ResourceProperties.topics}. Error ${error}`);
            }

        case 'Delete':

            console.info('======Received for Event Delete Topic=======');
            
            console.log(event.ResourceProperties.topics);

            let topics = []; 
            
            event.ResourceProperties.topics.forEach (topic => {
                topics.push(topic.topic);
            });

            
            try {
                await admin.deleteTopics({
                    timeout: event.ResourceProperties.timeout,
                    topics: topics,
                });

                await admin.disconnect();

                return { 
                    "Data": {
                        "kafkaResponse": true
                    }
                  };
            }
            catch (error) {
                await admin.disconnect();

                throw new Error(`Error deleting topics: ${topics}. Error ${error}`);

            }

        default:
            throw new Error(`invalid request type: ${event.RequestType}`);
    }
}

export async function topicCrudIsComplete (event) {
    console.info('isCompleteHandler Invocation');
    console.info(event);

    if (event["Data"]["kafkaResponse"]){
        return { IsComplete: true };
    } else if (!event["Data"]["kafkaResponse"] && event.RequestType == 'Create'){
        throw new Error(`Topic already exists`);
    } 
    else {
        throw new Error('Error during rsource creation or deletion');
    }
}