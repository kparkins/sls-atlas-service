# Prototype SLS MongoDB Atlas Provider

## Description
This is a prototype of a MongoDB Atlas provider for the Serverless framework. It will allow you to deploy a cluster, delete a cluster, and start/stop a local development cluster. The cluster specs for the deployed cluster may be changed in the `serverless.yaml` file under the `resources` section. 

## Setup

Copy the sample `env` file.
`cp env.sample .env`

Change the values to match your `Organization`, `Project`, `Public` and `Private` API keys. Note that the API keys used were Project level keys.
```bash
MONGODB_ATLAS_ORG_ID=<org id>
MONGODB_ATLAS_PROJECT_ID=<proj id>
MONGODB_ATLAS_PUBLIC_API_KEY=<pub proj key>
MONGODB_ATLAS_PRIVATE_API_KEY=<priv proj key>
```

## Deploy
`sls deploy`

## Delete
`sls remove`

## Run local cluster
`sls offline start`

## Stop local cluster
`sls offline stop`
