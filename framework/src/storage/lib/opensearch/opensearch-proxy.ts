// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import { OpensearchProxyProps } from "./opensearch-props";
import { BastionHostLinux, BlockDeviceVolume, CloudFormationInit, InitFile, InitPackage, InitService, InitServiceRestartHandle } from "aws-cdk-lib/aws-ec2";
import { CfnOutput } from "aws-cdk-lib";


export class OpensearchProxy extends Construct {

  public readonly host: BastionHostLinux;
  public readonly localPort: number;
  
  constructor(scope: Construct, id: string, props: OpensearchProxyProps) {
 
    super(scope, id);

    const nginxConf = `
    server {
      listen       80 default_server;
      listen       [::]:80 default_server;
      server_name  localhost ;
      root         /usr/share/nginx/html;

      # Load configuration files for the default server block.
      include /etc/nginx/default.d/*.conf;

      location / {
        proxy_pass https://${props.opensearchCluster.domain.domainEndpoint};
      }
    }`;

    const handle = new InitServiceRestartHandle();
    this.localPort = props.localPort ?? 8080;

    this.host = new BastionHostLinux(scope, 'BastionHost', {
      vpc:props.opensearchCluster.vpc,
      blockDevices: [{
        deviceName: 'EBSBastionHost',
        volume: BlockDeviceVolume.ebs(10, {
          encrypted: true,
        }),
      }],
      init: CloudFormationInit.fromElements(
        InitPackage.yum('nginx'),
        InitFile.fromString('/etc/nginx/nginx.conf', nginxConf, { serviceRestartHandles: [handle] }),
        InitService.enable('nginx', {
          serviceRestartHandle: handle,
        })
      )
    });
    
    new CfnOutput(scope, 'SSM start session', { value: `aws ssm start-session --target ${this.host.instanceId} --document-name AWS-StartPortForwardingSession --parameters '{"portNumber":["80"],"localPortNumber":["${this.localPort}"]}'` });
    new CfnOutput(scope, 'Opensearch Dashboards', { value: `http://localhost:${this.localPort}/` });
  }
}
