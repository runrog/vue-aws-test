import AWS from 'aws-sdk';
import _ from 'lodash'; // eslint-disable-line
// import fse from 'fs-extra';
import path from 'path'; // eslint-disable-line
import creds from './aws-creds.json';

const awsMixins = {
  computed: {
    _account() {
      return {
        dynamodb: new AWS.DynamoDB(creds.services.dynamodb),
        cognito: new AWS.CognitoIdentity(creds.services.cognito),
        lambda: new AWS.Lambda(creds.services.lambda),
        sns: new AWS.SNS(creds.services.sns),
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
      const params = {
        Item: {
          AlbumTitle: {
            S: 'Somewhat Famous',
          },
          Artist: {
            S: 'No One You Know',
          },
          SongTitle: {
            S: 'Call Me Today',
          },
        },
      };
      return this._account.putItem(params).promise();
    },
    // Cognito mixins
  },
};

export { awsMixins }; // eslint-disable-line
