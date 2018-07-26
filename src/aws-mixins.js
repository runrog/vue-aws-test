import { mapGetters } from 'vuex';

import {
  CognitoUserPool,
  // CognitoUserAttribute,
  AuthenticationDetails,
  CognitoUser,
} from 'amazon-cognito-identity-js';
import creds from './aws-creds.json';

const awsMixins = {
  computed: {
    ...mapGetters(['session']),
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
        TableName: 'test-table', // account table
        Item: {
          _id: {
            S: this.$aws.config.credentials.identityId,
          },
          test: {
            S: 'wowza!!',
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
            reject('error: ', err.message || JSON.stringify(err));
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
