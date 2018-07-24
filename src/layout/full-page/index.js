import Vue from 'vue';

const template = require('./template.html');

export default Vue.component('full-page', {
  template,
  name: 'full-page',
  data() {
    return {
      newName: '',
      newEmail: '',
      newPassword: '',
      confCode: '',
      newUser: {},
      loginUser: '',
      loginPass: '',
    };
  },
  methods: {
    async signUp() {
      const attributes = [];

      const dataEmail = {
        Name: 'email',
        Value: this.newEmail,
      };

      const dataName = {
        Name: 'name',
        Value: this.newName,
      };

      attributes.push(dataEmail);
      attributes.push(dataName);

      const payload = {
        newName: this.newName,
        newEmail: this.newEmail,
        newPassword: this.newPassword,
        attributes,
      };

      try {
        const newUser = await this._cognitoSignUp(payload);
        this.newUser = newUser;
      } catch (e) {
        this.$log.info('error: ', e);
      }
    },
    async confirmUser() {
      const payload = {
        email: this.newUser.username,
        password: this.newPassword,
        code: this.confCode,
      };

      try {
        await this._cognitoConfirmNewUser(payload);
      } catch (e) {
        this.$log.console.error(e);
      }
    },
    async login() {
      const payload = {
        username: this.loginUser,
        password: this.loginPass,
      };

      try {
        const login = await this._cognitoLogin(payload);
        // may not need to do this as cognito stores users for you locally
        // localStorage.setItem('userSession', JSON.stringify(login));
        this.$log.info('logged in', login);
      } catch (e) {
        this.$log.error(e);
      }
    },
    async logout() {
      try {
        const logout = await this._cognitoLogout();
        this.$log.info('logout: ', logout);
      } catch (e) {
        this.$log.error(e);
      }
    },
    async forgotPass() {
      try {
        await this._cognitoForgotPassword({
          email: '', // send user email
        });
        this.$log.info('sent reset request');
      } catch (e) {
        this.$log.error(e);
      }
    },
    async submitNewPass() {
      const payload = {
        email: this.newEmail,
        password: this.newPassword,
        code: this.confCode,
      };

      try {
        await this._cognitoSubmitResetPass(payload);
        this.$log.info('done resetting');
      } catch (e) {
        this.$log.error(e);
      }
    },
    async addDbItem() {
      try {
        await this._dynamodbPutItem();
      } catch (e) {
        this.$log.error(e);
      }
    },
  },
});
