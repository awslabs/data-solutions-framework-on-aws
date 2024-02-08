/* eslint-disable */
import { Sha256 } from '@aws-crypto/sha256-js';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { SignatureV4 } from '@aws-sdk/signature-v4';
/* eslint-enable */

const region = process.env.REGION!;
const endpoint = process.env.ENDPOINT!;

const signer = new SignatureV4({
  credentials: defaultProvider(),
  region: region,
  service: 'es',
  sha256: Sha256,
});

export async function sendRequest(props: { method: string; path: string; body?: any }) {
  const { method, path, body } = props;
  const request: any = { method, path };
  if (body) request.body = JSON.stringify(body);
  const signedRequest = await generateSignedRequest(request);
  const { response } = await new NodeHttpHandler().handle(new HttpRequest(signedRequest));
  console.log(response.statusCode + ' ' + response.body.statusMessage);
  let responseBody = '';
  return new Promise((resolve) => {
    response.body.on('data', (chunk: any) => {
      responseBody += chunk;
    });
    response.body.on('end', () => {
      console.log('Response body: ' + responseBody);
      resolve(responseBody);
    });
  });
}

async function generateSignedRequest(props: { method: string; path: string; body: string }) {
  const { method, path, body } = props;
  const request = new HttpRequest({
    path,
    method,
    hostname: endpoint,
    headers: {
      'Content-Type': 'application/json',
      'host': endpoint,
    },
    body,
  });
  const signedRequest = await signer.sign(request);
  return signedRequest;
}