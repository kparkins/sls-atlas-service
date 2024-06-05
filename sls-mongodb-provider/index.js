'use strict';

const { execSync } = require('child_process');
require('dotenv').config();

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
      'deploy:deploy': this.deploy.bind(this),
      'remove:remove': this.remove.bind(this),
      'offline:start:start': this.offlineStart.bind(this),
      'offline:stop:stop': this.offlineStop.bind(this),
    };

    this.changeStream = null;
    this.mongoClient = null;
    this.serverless.cli.log('Loaded Environment Variables:');
    this.serverless.cli.log(`MONGODB_ATLAS_PROJECT_ID: ${process.env.MONGODB_ATLAS_PROJECT_ID}`);
    this.serverless.cli.log(`MONGODB_ATLAS_PUBLIC_KEY: ${process.env.MONGODB_ATLAS_PUBLIC_KEY}`);
    this.serverless.cli.log(`MONGODB_ATLAS_PRIVATE_KEY: ${process.env.MONGODB_ATLAS_PRIVATE_KEY}`);
  }

  static getProviderName() {
    return "mongodb"
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
    this.serverless.cli.log('Running before:deploy:deploy hook...');
    await this.deployCluster();
  }

  async remove() {
    this.serverless.cli.log('Running before:remove:remove hook...');
    await this.removeCluster();
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

  async deployCluster() {
    const clusterConfig = this.serverless.service.resources.Resources.MyMongoDBCluster;
    const command = `atlas clusters create ${clusterConfig.Properties.name} --region ${clusterConfig.Properties.region} --tier ${clusterConfig.Properties.instanceSizeName} --provider ${clusterConfig.Properties.providerName} --mdbVersion ${clusterConfig.Properties.mongoDBVersion}`;

    this.execCommand(command);
  }

  async removeCluster() {
    const clusterConfig = this.serverless.service.resources.Resources.MyMongoDBCluster;
    const command = `atlas clusters delete ${clusterConfig.Properties.name} --force`;

    this.execCommand(command);
  }

}

module.exports = MongoDBProvider;


