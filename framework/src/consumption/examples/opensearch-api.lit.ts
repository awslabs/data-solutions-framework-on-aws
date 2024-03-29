import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';


class ExampleOpenSearchApiStack extends cdk.Stack {

  constructor(scope: Construct, id: string , props:cdk.StackProps) {

    super(scope, id, props);
    /// !show
    const osCluster = new dsf.consumption.OpenSearchCluster(this, 'MyOpenSearchCluster',{
      domainName:"mycluster",
      samlEntityId:'<IdpIdentityId>',
      samlMetadataContent:'<IdpOpenSearchApplicationMetadataXml>',
      samlMasterBackendRole:'<IAMIdentityCenterAdminGroupId>',
      deployInVpc:false,
      dataNodeInstanceType:'t3.small.search',
      dataNodeInstanceCount:1,
      masterNodeInstanceCount:0
    });
    /// !hide

    //Add another admin
    const adminCr = osCluster.addRoleMapping('AnotherAdmin', 'all_access','sometestId');
    //Overwrite construct-wide removal policy
    adminCr.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const indexTemplateCr = osCluster.callOpenSearchApi('CreateIndexTemplate','_index_template/movies',
    {
      "index_patterns": [
        "movies-*"
      ],
      "template": {
        "settings": {
          "index": {
            "number_of_shards": 1,
            "number_of_replicas": 0
          }
        },
        "mappings": {
          "properties": {
            "title": {
              "type": "text"
            },
            "year": {
              "type": "integer"
            }
          }
        }
      }
    });
    const metadata='{ "index" : { "_index" : "movies-02"}}';
    const bulk=`${metadata}
    {"title": "Barbie", "year": 2023}
    ${metadata}
    {"title": "Openheimer", "year": 2023}`;
    
    // add dependency on index template creation
    const bulkCr = osCluster.callOpenSearchApi('AddBulk','_bulk',bulk+'\n\n','POST');
    bulkCr.node.addDependency(indexTemplateCr);

    const add1Cr = osCluster.callOpenSearchApi('AddData1', 'movies-01/_doc/1111',{"title": "Rush", "year": 2013}, 'PUT');
    add1Cr.node.addDependency(indexTemplateCr);
    const add2Cr = osCluster.callOpenSearchApi('AddData3', 'movies-01/_doc/2222',{"title": "Toy Story", "year": 2014}, 'PUT');
    add2Cr.node.addDependency(indexTemplateCr);
    const add3Cr = osCluster.callOpenSearchApi('AddData4', 'movies-01/_doc',{"title": "The Little Mermaid", "year": 2015}, 'POST');
    add3Cr.node.addDependency(indexTemplateCr);

  }
}

const app = new cdk.App();
new ExampleOpenSearchApiStack(app, 'ExampleOpenSearchApiStack', { env: {region:'us-east-1'} });