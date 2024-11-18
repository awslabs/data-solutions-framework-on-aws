import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';
import { Role } from 'aws-cdk-lib/aws-iam';


class ExampleOpenSearchApiStack extends cdk.Stack {

  constructor(scope: Construct, id: string , props:cdk.StackProps) {

    super(scope, id, props);
    this.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);
    /// !show
    const domainEndpoint='search-XXXXXX.XXXXXX.es.amazonaws.com';
    const apiRole = Role.fromRoleName(this, 'ApiRole', '<IAMRoleWithOpenSearchPermissions>');
    const osApi = new dsf.consumption.OpenSearchApi(this, 'MyOpenSearchApi',{
      iamHandlerRole:apiRole,
      openSearchEndpoint:domainEndpoint,
      openSearchClusterType:dsf.consumption.OpenSearchClusterType.PROVISIONED,
      removalPolicy:cdk.RemovalPolicy.DESTROY
    });
    /// !hide
    //Add another admin
    osApi.addRoleMapping('AnotherAdmin', 'all_access','sometestId');

    //create index template
    const indexTemplateCr = osApi.callOpenSearchApi('CreateIndexTemplate','_index_template/movies',
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
      
      // bulk ingestion using POST
      const bulkCr = osApi.callOpenSearchApi('AddBulk','_bulk',bulk+'\n\n','POST');
      //dependency to enforce sequential API calls
      bulkCr.node.addDependency(indexTemplateCr);
  
      const add1Cr = osApi.callOpenSearchApi('AddData1', 'movies-01/_doc/1111',{"title": "Rush", "year": 2013}, 'PUT');
      add1Cr.node.addDependency(indexTemplateCr);
      const add2Cr = osApi.callOpenSearchApi('AddData3', 'movies-01/_doc/2222',{"title": "Toy Story", "year": 2014}, 'PUT');
      add2Cr.node.addDependency(indexTemplateCr);
      const add3Cr = osApi.callOpenSearchApi('AddData4', 'movies-01/_doc',{"title": "The Little Mermaid", "year": 2015}, 'POST');
      add3Cr.node.addDependency(indexTemplateCr);
    

  }
}

const app = new cdk.App();
new ExampleOpenSearchApiStack(app, 'ExampleOpenSearchApiStandaloneStack', { env: {region:'us-east-1'} });