const BasePage = require("@utils/BasePage");
const config = require("@config");
const LoginLocators = require("@locators/loginLocators");
const CommonLocators = require("@locators/commonLocators");

class LoginPage extends BasePage {
  async open() {
    await this.goto(config.urls.LOGIN_URL);
    await this.expectVisible(LoginLocators.LOGIN_BUTTON);
  }

  async login(username, password) {
    await this.fill(LoginLocators.USERNAME_INPUT, username);
    await this.fill(LoginLocators.PASSWORD_INPUT, password);
    await this.click(LoginLocators.LOGIN_BUTTON);
  }

  // Logs in using a named account from the user config (e.g. "standard").
  async loginAs(userKey) {
    const { username, password } = config.users.get(userKey);
    await this.login(username, password);
  }

  async getErrorMessage() {
    return this.getText(CommonLocators.ERROR_MESSAGE);
  }

  async expectErrorMessage(expected) {
    await this.expectText(CommonLocators.ERROR_MESSAGE, expected);
  }
}

module.exports = LoginPage;
