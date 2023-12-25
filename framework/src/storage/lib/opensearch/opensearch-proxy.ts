// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { CfnOutput, Duration } from 'aws-cdk-lib';
import { BastionHostLinux, CloudFormationInit, InitCommand, InitFile, InitService, InitServiceRestartHandle, Peer, Port, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { OpensearchProxyProps } from './opensearch-props';
import path = require('path');
import { readFileSync } from 'fs';
import { ApplicationLoadBalancer, ApplicationTargetGroup, TargetType } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { InstanceTarget } from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import { CacheCookieBehavior, CacheHeaderBehavior, CachePolicy, CacheQueryStringBehavior, Distribution, OriginProtocolPolicy, SecurityPolicyProtocol } from 'aws-cdk-lib/aws-cloudfront';
import { LoadBalancerV2Origin } from 'aws-cdk-lib/aws-cloudfront-origins';



export class OpensearchProxy extends Construct {

  public readonly proxyHost: BastionHostLinux;
  private readonly proxyPort: number;
  public readonly alb: ApplicationLoadBalancer;
  public readonly cfDistribution: Distribution;

  constructor(scope: Construct, id: string, props: OpensearchProxyProps) {

    super(scope, id);

    this.proxyPort = props.proxyPort;
    const albPort = 80; 
    const nginxConf = readFileSync(
      path.join(__dirname,'./resources/nginx.conf'),'utf-8')
      .replace(/__PROXY_PORT__/g, ""+this.proxyPort)
      .replace(/__OPENSEARCH_DOMAIN__/g,props.opensearchCluster.domain.domainEndpoint);


    const handle = new InitServiceRestartHandle();
    const vpc = props.opensearchCluster.vpc;
    
    this.alb = new ApplicationLoadBalancer(scope, 'LB', {
      vpc,
      internetFacing: true,
    });
    
    const ec2Sg = new SecurityGroup(scope, 'ec2Sg', {
      vpc,
      allowAllOutbound: true,
      description: 'ec2Sg',
    });
    
    const lbSg = new SecurityGroup(scope, 'lbSg', {
      vpc,
      allowAllOutbound: true,
      description: 'lbSg',
    });
    
    //allow ingress only from ALB
    ec2Sg.addIngressRule(Peer.securityGroupId(lbSg.securityGroupId),Port.tcp(this.proxyPort));
    
    //allow ingress only from CloudFront IPs
    lbSg.addIngressRule(Peer.prefixList('pl-3b927c52'), Port.tcp(albPort));
    
    this.alb.addSecurityGroup(lbSg);
      
    this.proxyHost = new BastionHostLinux(this, 'BastionHost', {
      vpc: vpc,
      requireImdsv2:true,
      init: CloudFormationInit.fromElements(
        InitCommand.shellCommand('sudo amazon-linux-extras install -y nginx1'),
        InitFile.fromString('/etc/nginx/nginx.conf', nginxConf, { serviceRestartHandles:[handle]}),
        InitService.enable('nginx', {
          serviceRestartHandle: handle,
          enabled: true,
          ensureRunning: true,
        })
      ),
      securityGroup:ec2Sg
    });
    
    
       
    const tg1 = new ApplicationTargetGroup(this, 'TG1', {
      targetGroupName:"opensearch-tg",
      targetType: TargetType.INSTANCE,
      targets: [new InstanceTarget(this.proxyHost.instance, this.proxyPort)],
      port: this.proxyPort,
      vpc
    });
    
    this.alb.addListener('Listener', { port: albPort, defaultTargetGroups: [tg1]  });
        
    
    this.cfDistribution = new Distribution(scope, 'cloudfrontDashoard',{
      defaultBehavior: { 
        origin: new LoadBalancerV2Origin(this.alb, { 
          protocolPolicy: OriginProtocolPolicy.HTTP_ONLY, 
          customHeaders: {"osd-xsrf":"true"} 
        }),
        cachePolicy: new CachePolicy(scope,'cfCachePolicy',{
          minTtl:Duration.seconds(0),
          maxTtl:Duration.seconds(1),
          defaultTtl:Duration.seconds(0),
          cookieBehavior:CacheCookieBehavior.allowList("security_authentication"),
          headerBehavior:CacheHeaderBehavior.none(),
          queryStringBehavior:CacheQueryStringBehavior.none()
        })
      },
      enableIpv6: true,
      enableLogging: true,
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
    });
    
    new CfnOutput(this, 'Opensearch Dashboards URL', { value: `https://${this.cfDistribution.distributionDomainName}/_dashboards` });   
  }
}
