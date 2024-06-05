'use strict';

const { execSync } = require('child_process');
require('dotenv').config();

class MongoDBProvider {
  constructor(serverless, options) {
    this.serverless = serverless;

    this.options = options;
    this.provider = this;

    this.serverless.setProvider('mongodb', this);
    this.commands = {};

    this.hooks = {
      'before:deploy:deploy': this.beforeDeploy.bind(this),
      'after:deploy:deploy': this.afterDeploy.bind(this),
      'before:remove:remove': this.beforeRemove.bind(this),
      'after:remove:remove': this.afterRemove.bind(this),
      'before:offline:start': this.beforeOfflineStart.bind(this),
      'after:offline:start:end': this.afterOfflineEnd.bind(this),
    };

    this.changeStream = null;
    this.mongoClient = null;
    this.serverless.cli.log('Loaded Environment Variables:');
    this.serverless.cli.log(`MONGODB_ATLAS_PROJECT_ID: ${process.env.MONGODB_ATLAS_PROJECT_ID}`);
    this.serverless.cli.log(`MONGODB_ATLAS_PUBLIC_KEY: ${process.env.MONGODB_ATLAS_PUBLIC_KEY}`);
    this.serverless.cli.log(`MONGODB_ATLAS_PRIVATE_KEY: ${process.env.MONGODB_ATLAS_PRIVATE_KEY}`);
    this.serverless.cli.log(`MONGODB_ATLAS_REGION: ${process.env.MONGODB_ATLAS_REGION}`);
    this.serverless.cli.log(`MONGODB_ATLAS_TIER: ${process.env.MONGODB_ATLAS_TIER}`);
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

  async beforeDeploy() {
    this.serverless.cli.log('Running before:deploy:deploy hook...');
    await this.deployCluster();
  }

  async afterDeploy() {
    this.serverless.cli.log('Running after:deploy:deploy hook...');
  }

  async beforeRemove() {
    this.serverless.cli.log('Running before:remove:remove hook...');
    await this.removeTrigger();
    await this.removeCluster();
  }

  async afterRemove() {
    this.serverless.cli.log('Running after:remove:remove hook...');
  }

  async beforeOfflineStart() {
    this.serverless.cli.log('Starting offline mode...');
    // Add any setup needed for offline mode here
  }

  async afterOfflineEnd() {
    this.serverless.cli.log('Stopping offline mode...');
    // Add any cleanup needed after offline mode here
  }

  async deployCluster() {
    this.serverless.cli.log(JSON.stringify(this.serverless.service.resources));
    const clusterConfig = this.serverless.service.resources.Resources.MyMongoDBCluster;
    const command = `atlas clusters create ${clusterConfig.Properties.name} --region ${clusterConfig.Properties.region} --tier ${clusterConfig.Properties.instanceSizeName} --provider ${clusterConfig.Properties.providerName} --mdbVersion ${clusterConfig.Properties.mongoDBVersion}`;

    this.execCommand(command);
  }

  async deployTrigger() {
    const triggerConfig = this.serverless.service.functions.createTrigger;
    const command = `atlas triggers create ${triggerConfig.name} --type ${triggerConfig.type} --database ${triggerConfig.config.database} --collection ${triggerConfig.config.collection} --action "${triggerConfig.function_name}" --match ${triggerConfig.config.operationTypes.join(',')}`;

    this.execCommand(command);
  }

  async removeCluster() {
    const clusterConfig = this.serverless.service.resources.Resources.MyMongoDBCluster;
    const command = `atlas clusters delete ${clusterConfig.Properties.name} --force`;

    this.execCommand(command);
  }

  async removeTrigger() {
    const triggerConfig = this.serverless.service.functions.createTrigger;
    const command = `atlas triggers delete ${triggerConfig.name} --force`;

    this.execCommand(command);
  }
}

module.exports = MongoDBProvider;


