'use strict';

const { execSync } = require('child_process');
require('dotenv').config();

const ClusterResource = "AtlasCluster"

class MongoDBProvider {
  constructor(serverless, options) {
    this.serverless = serverless;

    this.options = options;
    this.provider = this;

    this.serverless.setProvider('mongodb', this);
    this.commands = {
      offline: {
        usage: 'Run the service locally',
        commands: {
          start: {
           lifecycleEvents: ['start']
          },
          stop: {
           lifecycleEvents: ['stop']
          }
        }
      }
    };

    this.hooks = {
      'before:deploy:deploy': this.setupCli.bind(this),
      'deploy:deploy': this.deploy.bind(this),
      'before:remove:remove': this.setupCli.bind(this),
      'remove:remove': this.remove.bind(this),
      'before:offline:start:start': this.setupCli.bind(this),
      'offline:start:start': this.offlineStart.bind(this),
      'before:offline:stop:stop': this.setupCli.bind(this),
      'offline:stop:stop': this.offlineStop.bind(this),
    };

    this.serverless.cli.log('Loaded Environment Variables:');
    this.serverless.cli.log(`MONGODB_ATLAS_ORG_ID: ${process.env.MONGODB_ATLAS_ORG_ID}`);
    this.serverless.cli.log(`MONGODB_ATLAS_PROJECT_ID: ${process.env.MONGODB_ATLAS_PROJECT_ID}`);
    this.serverless.cli.log(`MONGODB_ATLAS_PUBLIC_API_KEY: ${process.env.MONGODB_ATLAS_PUBLIC_API_KEY}`);
    this.serverless.cli.log(`MONGODB_ATLAS_PRIVATE_API_KEY: ${process.env.MONGODB_ATLAS_PRIVATE_API_KEY}`);
  }

  static getProviderName() {
    return "mongodb"
  }

  setupCli() {
    // Add logic here to handle ensuring the CLI is installed or to install it. 
    this.serverless.cli.log("Pull binary from -- https://fastdl.mongodb.org/mongocli/mongodb-atlas-cli_1.23.0_macos_arm64.zip")
  }

  execCommand(command) {
    try {
      const result = execSync(command, { stdio: 'pipe' }).toString();
      this.serverless.cli.log(result);
      return result;
    } catch (error) {
      this.serverless.cli.log(`Error executing command: ${command}`);
      this.serverless.cli.log(error.message);
      throw error;
    }
  }

  async deploy() {
    this.serverless.cli.log('Running deploy...');
    const resources = this.serverless.service.resources
    const promises = Object.values(resources).map((resource) => {
      if (resource.type === ClusterResource) {
        return this.deployCluster(resource);
      } 
      // add additional resource types here if necessary
    }); 

    try {
      await Promise.all(promises);
      this.serverless.cli.log('All resources deployed successfully');
    } catch (error) {
        this.serverless.cli.log(`Error deploying resources: ${error.message}`);
    }
  }

  async remove() {
    this.serverless.cli.log('Running remove...');
    const resources = this.serverless.service.resources
    const promises = Object.values(resources).map((resource) => {
      if (resource.type === ClusterResource) {
        return this.removeCluster(resource);
      }
      // add additional resource types here if necessary
    }); 

    try {
      await Promise.all(promises);
      this.serverless.cli.log('All resources removed successfully');
    } catch (error) {
        this.serverless.cli.log(`Error removing resources: ${error.message}`);
    }
  }

  async offlineStart() {
    this.serverless.cli.log('Starting offline mode...');
    // Add any setup needed for offline mode here
    const command = `atlas deployments setup --type local --force`
    this.execCommand(command);
  }

  async offlineStop() {
    this.serverless.cli.log('Stopping offline mode...');
    
    const command = `atlas deployments delete --type local --force`
    this.execCommand(command);
  }

  async deployCluster(clusterConfig) {
    const command = `atlas clusters create ${clusterConfig.name} --region ${clusterConfig.region} --tier ${clusterConfig.tier} --provider ${clusterConfig.provider} --mdbVersion ${clusterConfig.version}`;

    this.execCommand(command);
  }

  async removeCluster(clusterConfig) {
    const command = `atlas clusters delete ${clusterConfig.name} --force`;

    this.execCommand(command);
  }

}

module.exports = MongoDBProvider;


