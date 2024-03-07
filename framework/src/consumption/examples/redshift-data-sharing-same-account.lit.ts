import { App, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { RedshiftServerlessNamespace, RedshiftServerlessWorkgroup } from "../lib";
/// !show
class ExampleRedshiftDataSharingSameAccountStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id)

    const dbName = 'defaultdb';

    const producerNamespace = new RedshiftServerlessNamespace(this, 'ProducerNamespace', {
        name: 'producer-namespace',
        dbName
    });
    
    const producerWorkgroup = new RedshiftServerlessWorkgroup(this, 'ProducerRSWorkgroup', {
        name: 'producer-workgroup',
        namespace: producerNamespace
    });

    const consumerNamespace = new RedshiftServerlessNamespace(this, 'ConsumerNamespace', {
        name: 'consumer-namespace',
        dbName
    });
      
    const consumerWorkgroup = new RedshiftServerlessWorkgroup(this, 'ConsumerRSWorkgroup', {
        name: 'consumer-workgroup',
        namespace: consumerNamespace
    });
    
    const shareName = 'testshare';

    const producerDataAccess = producerWorkgroup.accessData('ProducerDataAccess');
    const createCustomersTable = producerDataAccess.runCustomSQL('CreateCustomerTable', dbName, 'create table public.customers (id varchar(100) not null, first_name varchar(50) not null, last_name varchar(50) not null, email varchar(100) not null)', 'drop table public.customers');

    const producerDataSharing = producerWorkgroup.dataSharing('producer-datasharing');
    const newShare = producerDataSharing.createShare('producer-share', dbName, shareName, 'public', ['public.customers']);
    newShare.node.addDependency(createCustomersTable);
    
    const grantToConsumer = producerDataSharing.grant('GrantToConsumer', {
      databaseName: dbName,
      dataShareName: shareName,
      namespaceId: consumerNamespace.namespaceId,
    });
    
    grantToConsumer.node.addDependency(newShare);
    grantToConsumer.node.addDependency(consumerNamespace);
    
    const consumerDataSharing = consumerWorkgroup.dataSharing('consumer-datasharing');
    const consumeShare = consumerDataSharing.createDatabaseFromShare('consume-datashare', {
      databaseName: dbName,
      dataShareName: shareName,
      newDatabaseName: 'shared_db',
      namespaceId: producerNamespace.namespaceId,
    });
    
    consumeShare.node.addDependency(grantToConsumer);
  }
}
/// !hide
const app = new App()
new ExampleRedshiftDataSharingSameAccountStack(app, "ExampleRedshiftDataSharingSameAccountStack")