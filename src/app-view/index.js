import Vue from 'vue';
import { mapGetters } from 'vuex';

const template = require('./template.html');

export default Vue.component('app-view', {
  template,
  name: 'full-page',
  computed: {
    ...mapGetters(['identityId']),
  },
  data() {
    return {};
  },
  created() {
    this.$log.info('app created');
    // cognito stores local user sessions for us
    this.restoreSession();
  },
  methods: {
    async restoreSession() {
      try {
        const session = await this._cognitoRestoreSession();
        this.$store.dispatch('setSession', { session });
        // set aws creds in state so this user can have it's limited permissions
        // @TODO dynamically get those values
        const params = {
          IdentityPoolId: 'us-west-2:5f612029-4fee-40ba-84fa-d20dca198ac9',
          Logins: {
            'cognito-idp.us-west-2.amazonaws.com/us-west-2_7KCFsLoTT': session.getIdToken().getJwtToken(),
          },
        };

        this.$aws.config.credentials = new this.$aws.CognitoIdentityCredentials(params);

        // grab user IdentityId
        const user = await new this.$aws.CognitoIdentity({
          region: 'us-west-2',
        }).getId(params).promise();
        // store this in state
        this.$store.dispatch('setIdentityId', { identityId: user.IdentityId });
        this.$log.info(`session set for: ${session.idToken.payload.email}`);
      } catch (e) {
        this.$log.error(e);
      }
    },
  },
});
