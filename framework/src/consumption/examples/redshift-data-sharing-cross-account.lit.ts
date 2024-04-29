import { App, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { RedshiftServerlessNamespace, RedshiftServerlessWorkgroup } from "../lib";
/// !show
class ExampleRedshiftDataSharingCrossAccountAStack extends Stack {
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
    
    const shareName = 'testshare';

    const producerDataAccess = producerWorkgroup.accessData('ProducerDataAccess');
    const createCustomersTable = producerDataAccess.runCustomSQL('CreateCustomerTable', dbName, 'create table public.customers (id varchar(100) not null, first_name varchar(50) not null, last_name varchar(50) not null, email varchar(100) not null)', 'drop table public.customers');

    const newShare = producerWorkgroup.createShare('producer-share', dbName, shareName, 'public', ['public.customers']);
    newShare.newShareCustomResource.node.addDependency(createCustomersTable);
    
    const grantToConsumer = producerWorkgroup.grantAccessToShare('GrantToConsumer', newShare, undefined, "<CONSUMER-ACCOUNT-ID>", true);
    
    grantToConsumer.resource.node.addDependency(newShare);
  }
}

class ExampleRedshiftDataSharingCrossAccountBStack extends Stack {
    constructor(scope: Construct, id: string) {
      super(scope, id)
  
      const dbName = 'defaultdb';
  
      const consumerNamespace = new RedshiftServerlessNamespace(this, 'ConsumerNamespace', {
          name: 'consumer-namespace',
          dbName
      });
        
      const consumerWorkgroup = new RedshiftServerlessWorkgroup(this, 'ConsumerRSWorkgroup', {
          name: 'consumer-workgroup',
          namespace: consumerNamespace
      });
      
      const shareName = 'testshare';
      
      consumerWorkgroup.createDatabaseFromShare('consume-datashare', "db_from_share", shareName, "<PRODUCER NAMESPACE>", "<PRODUCER ACCOUNT>")
    }
  }
/// !hide
const app = new App()
new ExampleRedshiftDataSharingCrossAccountAStack(app, "ExampleRedshiftDataSharingCrossAccountAStack")
new ExampleRedshiftDataSharingCrossAccountBStack(app, "ExampleRedshiftDataSharingCrossAccountBStack")