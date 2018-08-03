import { mapGetters } from 'vuex';
import site from '@/payloads/blank-site.json';

import {
  CognitoUserPool,
  // CognitoUserAttribute,
  AuthenticationDetails,
  CognitoUser,
} from 'amazon-cognito-identity-js';
import creds from './aws-creds.json';

const awsMixins = {
  computed: {
    ...mapGetters(['session', 'identityId']),
    _account() {
      return {
        dynamodb: new this.$aws.DynamoDB(),
        // cognitoIdentity: new AWS.CognitoIdentityCredentials(params),
        lambda: new this.$aws.Lambda(creds.services.lambda),
        sns: new this.$aws.SNS(creds.services.sns),
        // @TODO try working with all other services
        // cloudfront/s3/route53/ses/route53Domains/ACM etc
      };
    },
  },
  methods: {
    guid() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
      }
      return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
    },
    newSite() {
      const newPage = this.$_.cloneDeep(site);
      // set standard page settings
      newPage._id = this.guid();
      newPage.name = 'firstSite';
      newPage.alias = 'firstSite';
      newPage.updated = new Date().toISOString();
      // set homepage settings
      const homepage = newPage.pages[0];
      homepage._id = this.guid();
      homepage.createdDate = new Date().toISOString();
      // set first section settings
      const section = homepage.blocks[0];
      section._id = this.guid();
      section.createdDate = new Date().toISOString();
      return newPage;
    },
    // DynamoDB mixins
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html
    _dynamodbCreateTable() {
      const params = {
        AttributeDefinitions: [
          {
            AttributeName: 'Artist',
            AttributeType: 'S',
          },
          {
            AttributeName: 'SongTitle',
            AttributeType: 'S',
          },
        ],
        KeySchema: [
          {
            AttributeName: 'Artist',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'SongTitle',
            KeyType: 'RANGE',
          },
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
        TableName: 'Music',
      };
      return this._account.dynamodb.createTable(params).promise();
    },
    _dynamodbPutItem() {
      // set dynamo region
      this.$aws.config.region = 'us-west-2';
      const params = {
        TableName: 'drzzle-users', // account table
        Item: {
          _id: {
            S: this.identityId,
          },
          websites: {
            S: JSON.stringify({ websites: [this.newSite()] }),
          },
          plan: {
            S: 'pro',
          },
          trialDays: {
            N: '7',
          },
          signupDate: {
            S: new Date().toISOString(),
          },
          apiKeys: {
            S: JSON.stringify({ googlemaps: 'AIzaSyAyGcRsuU4QsLkT5cHpaZ1kA0BL_CJ2-Zw' }),
          },
          aws: {
            S: JSON.stringify({
              aws: {
                s3: {
                  suspendedBucket: 'drz-suspended-site',
                  bucket: 'drz-websites',
                  endpoint: 'https://s3.us-west-2.amazonaws.com',
                  region: 'us-west-2',
                  encryption: 'AES256',
                },
                dynamodb: {
                  region: 'us-west-2',
                },
                cognito: {
                  region: 'us-west-2',
                },
                r53: {
                  region: 'us-east-1',
                },
                r53Domains: {
                  region: 'us-east-1',
                },
                ses: {
                  region: 'us-west-2',
                },
                cloudFront: {
                  region: 'us-east-1',
                },
                acm: {
                  region: 'us-east-1',
                },
              },
            }),
          },
        },
      };
      return this._account.dynamodb.putItem(params).promise();
    },
    // Cognito mixins
    // https://github.com/aws-amplify/amplify-js/tree/master/packages/amazon-cognito-identity-js
    _getUserPool() {
      // each account will just need it's own row
      const poolData = {
        UserPoolId: creds.services.poolId,
        ClientId: creds.services.client,
      };

      return new CognitoUserPool(poolData);
    },
    _cognitoSignUp(p) {
      // seperate userPool logic
      const poolData = {
        UserPoolId: creds.services.poolId,
        ClientId: creds.services.client,
      };

      const userPool = new CognitoUserPool(poolData);

      return new Promise((resolve, reject) => {
        userPool.signUp(p.newEmail, p.newPassword, p.attributes, null, (err, result) => {
          if (err) {
            reject(`error: ${err.message || JSON.stringify(err)}`);
            return;
          }
          resolve(result.user);
        });
      });
    },
    _cognitoConfirmNewUser(p) {
      // @TODO break this out to 1 place
      const poolData = {
        UserPoolId: creds.services.poolId,
        ClientId: creds.services.client,
      };

      const userPool = new CognitoUserPool(poolData);

      const userData = {
        Username: p.email,
        Pool: userPool,
      };

      const cognitoUser = new CognitoUser(userData);

      return new Promise((resolve, reject) => {
        cognitoUser.confirmRegistration(p.code, true, (err) => {
          if (err) {
            reject(err);
            return;
          }
          // if we want to authenticate user right after confirmation and
          // give them a session
          const authData = {
            Username: p.email,
            Password: p.password,
          };
          const authDetails = new AuthenticationDetails(authData);
          cognitoUser.authenticateUser(authDetails, {
            onSuccess(result) {
              resolve(result);
            },
            onFailure(error) {
              reject(error);
            },
          });
        });
      });
    },
    _cognitoRestoreSession() {
      // @TODO break this out to 1 place
      const poolData = {
        UserPoolId: creds.services.poolId,
        ClientId: creds.services.client,
      };

      const userPool = new CognitoUserPool(poolData);
      // in a 4th value of the local storage stuff?
      // need to store last logged in user
      const cognitoUser = userPool.getCurrentUser();
      return new Promise((resolve, reject) => {
        if (cognitoUser !== null) {
          cognitoUser.getSession((err, session) => {
            if (err) {
              reject(err);
            }
            if (session.isValid()) {
              resolve(session);
            }
          });
        }
      });
    },
    _cognitoLogin(p) {
      // @TODO break this out to 1 place
      const poolData = {
        UserPoolId: creds.services.poolId,
        ClientId: creds.services.client,
      };

      const userPool = new CognitoUserPool(poolData);

      const authData = {
        Username: p.username,
        Password: p.password,
      };
      const authDetails = new AuthenticationDetails(authData);

      const userData = {
        Username: p.username,
        Pool: userPool,
      };
      const cognitoUser = new CognitoUser(userData);
      return new Promise((resolve, reject) => {
        cognitoUser.authenticateUser(authDetails, {
          onSuccess(result) {
            resolve(result);
          },
          onFailure(err) {
            reject(err);
          },
        });
      });
    },
    _cognitoLogout() {
      // @TODO break this out to 1 place
      const poolData = {
        UserPoolId: creds.services.poolId,
        ClientId: creds.services.client,
      };

      const userPool = new CognitoUserPool(poolData);
      const cognitoUser = userPool.getCurrentUser();

      return new Promise((resolve, reject) => {
        if (cognitoUser) {
          resolve(cognitoUser.signOut());
        } else {
          reject('error: shit idk');
        }
      });
    },
    _cognitoChangePassword(p) {
      // change password for a logged in user

      // @TODO break this out to 1 place
      const poolData = {
        UserPoolId: creds.services.poolId,
        ClientId: creds.services.client,
      };

      const userPool = new CognitoUserPool(poolData);
      const cognitoUser = userPool.getCurrentUser();

      return new Promise((resolve, reject) => {
        cognitoUser.changePassword(p.oldPassword, p.newPassword, (err, result) => {
          if (err) {
            reject(err.message || JSON.stringify(err));
          }
          resolve(result);
        });
      });
    },
    _cognitoForgotPassword(p) {
      const poolData = {
        UserPoolId: creds.services.poolId,
        ClientId: creds.services.client,
      };

      const userPool = new CognitoUserPool(poolData);

      const userData = {
        Username: p.email,
        Pool: userPool,
      };

      const cognitoUser = new CognitoUser(userData);

      return new Promise((resolve, reject) => {
        cognitoUser.forgotPassword({
          onSuccess() {
            resolve();
          },
          onFailure(err) {
            reject(err);
          },
        });
      });
    },
    _cognitoSubmitResetPass(p) {
      const poolData = {
        UserPoolId: creds.services.poolId,
        ClientId: creds.services.client,
      };

      const userPool = new CognitoUserPool(poolData);

      const userData = {
        Username: p.email,
        Pool: userPool,
      };

      const cognitoUser = new CognitoUser(userData);

      return new Promise((resolve, reject) => {
        cognitoUser.confirmPassword(p.code, p.password, {
          onSuccess() {
            resolve(cognitoUser);
          },
          onFailure(err) {
            reject(err);
          },
        });
      });
    },
  },
};

export { awsMixins }; // eslint-disable-line
