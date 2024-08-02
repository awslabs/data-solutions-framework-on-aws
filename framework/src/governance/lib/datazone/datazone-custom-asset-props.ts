// datazone-custom-asset-props.ts

import { RemovalPolicy } from 'aws-cdk-lib';

export interface DataZoneCustomAssetProps {
  domainId: string; // required
  projectId: string; // required
  name: string; // required
  typeIdentifier: string; // required
  formsInput: {
    formName: string;
    content: string;
    typeIdentifier: string;
    typeRevision?: string; // Make typeRevision optional
  }[]; // required
  description?: string; // optional
  externalIdentifier?: string; // optional
  glossaryTerms?: string[]; // optional
  predictionConfiguration?: {
    businessNameGeneration?: {
      enabled: boolean;
    };
  }; // optional
  typeRevision?: string; // optional
  removalPolicy?: RemovalPolicy; // optional
  clusterName?: string; // optional
  topicName?: string; // optional
}
