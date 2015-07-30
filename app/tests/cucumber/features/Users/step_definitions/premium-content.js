module.exports = function () {

  this.Given(/^I have signed up$/, function () {
    var periodEnd = Math.floor(new Date().getTime() / 1000) + ( 7 * 24 * 60 * 60 );
    return this.AuthenticationHelper.createAccount({
      periodEnd: periodEnd
    });
  });

  this.Given(/^I have logged in$/, function () {
    return this.AuthenticationHelper.login();
  });

  this.Given(/^I am not logged in$/, function () {
    return this.AuthenticationHelper.logout();
  });

  this.When(/^I navigate to the private content page$/, function () {
    return this.client.url(process.env.ROOT_URL + 'chapter-1');
  });

  this.When(/^I login$/, function () {
    return this.AuthenticationHelper.login();
  });

  this.Then(/^I can see my premium content$/, function () {
    return this.client.
      waitForExist('#premium-content').
      isVisible('#premium-content').should.become(true);
  });

  this.Then(/^I see a "([^"]*)" button$/, function (button) {
    return this.client.
      waitForExist('a=' + button).
      isVisible('a=' + button);
  });

  this.Then(/^I cannot not see premium content$/, function () {
    return this.client.
      waitForExist('.sign-in'). // so we know the page has loaded in non-logged in mode
      isVisible('#premuium-content').should.become(false);
  });

};