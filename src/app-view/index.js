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
    // @TODO add user pool on load here
    // cognito stores local user sessions for us
    this.restoreSession();
  },
  methods: {
    async restoreSession() {
      try {
        const session = await this._cognitoRestoreSession();
        this.$log.info('session user: ', session);
      } catch (e) {
        this.$log.error(e);
      }
    },
  },
});
