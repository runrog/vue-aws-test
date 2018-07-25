import Vue from 'vue';

const template = require('./template.html');

export default Vue.component('app-view', {
  template,
  name: 'full-page',
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
        this.$aws.config.credentials = new this.$aws.CognitoIdentityCredentials({
          IdentityPoolId: 'us-west-2:beb09b61-49ce-430f-83c8-041d4349d771',
          Logins: {
            'cognito-idp.us-west-2.amazonaws.com/us-west-2_Ckz79cGhN': session.getIdToken().getJwtToken(),
          },
        });
        this.$log.info(`session set for: ${session.idToken.payload.email}`);
      } catch (e) {
        this.$log.error(e);
      }
    },
  },
});
