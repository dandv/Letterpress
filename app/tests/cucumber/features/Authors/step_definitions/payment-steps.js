module.exports = function () {

  var request = require('request');

  this.Given(/^I have configured a Stripe account$/, function () {
    // do nothing, the step specification is valid but does not require automation
  });

  this.Given(/^I have created content$/, function () {
    server.callSync('fixtures/seedData');
  });

  this.Given(/^I have setup a "([^"]*)" payment plan$/, function (plan) {
    server.callSync('fixtures/setPaymentPlan', plan);
  });

  this.When(/^a user pays using Stripe$/, function () {
    browser.waitForExistSync('a[title="Buy It"]');
    browser.clickSync('a[title="Buy It"]');
  });

  this.Then(/^they see a confirmation screen of their "([^"]*)" purchase$/, function (plan) {
    var message;
    switch (plan) {
      case 'subscribe':
        message = 'You are now subscribed';
        break;
      case 'charge':
        message = 'You have completed your purchase';
        break;
    }
    // need a delay here
    browser.waitForExistSync('.' + plan + '-confirmation');
    expect(browser.urlSync().value).to.contain('/' + plan + '-confirmation');
    expect(browser.getTextSync('body')).to.contain(message);
  });

  this.Then(/^receive a confirmation email of their "([^"]*)" purchase$/, function () {
    var settings = server.callSync('fixtures/getSettings');
    var emails = server.callSync('emailStub/getEmails');
    var email = emails[0];
    expect(email.to).to.equal('me@example.com');
    expect(email.from).to.equal(settings.private.emails.welcome.from);
    expect(email.subject).to.equal(settings.private.emails.welcome.subject);
    expect(email.text).to.contain(settings.private.emails.welcome.text);
  });

  this.Given(/^a user is subscribed$/, function () {
    return this.AuthenticationHelper.createAccount({
      stripeCustomerId: 'cust_0011',
      periodStart: 1436716844,
      periodEnd: 1436716844
    });
  });

  this.When(/^a subscription payment error is received from Stripe$/, function () {
    var meteorSettings = server.callSync('fixtures/getSettings');
    // make a webhook request pretending an existing customer's stripe invoice failed
    requestSync({
      url: process.env.ROOT_URL + meteorSettings.private.stripe.webhookEndpoint,
      method: 'POST',
      json: {
        type: 'invoice.payment_failed',
        data: {object: {customer: 'cust_0011'}}
      }
    });
  });

  this.Then(/^the user receives a repayment information email$/, function () {
    var settings = server.callSync('fixtures/getSettings');
    var emails = server.callSync('emailStub/getEmails');
    expect(emails.length).to.equal(1, 'Expected to see an email');
    var email = emails[0];
    expect(email.from).to.equal(settings.private.emails.failedPayment.from);
    expect(email.subject).to.equal(settings.private.emails.failedPayment.subject);
    expect(email.text).to.contain(settings.private.emails.failedPayment.text);
  });

  this.Given(/^a user subscription expired (\d+) month\(s\) ago$/, function (months) {
    var date = new Date();
    date.setMonth(date.getMonth() - months);
    var periodEnd = Math.floor(date.getTime() / 1000);

    return this.AuthenticationHelper.createAccount({
      periodEnd: periodEnd
    });
  });

  this.When(/^the user logs in$/, function () {
    browser.waitForExistSync('a#login-sign-in-link');
    browser.clickSync('a#login-sign-in-link');
    browser.setValueSync('#login-email', 'me@example.com');
    browser.setValueSync('#login-password', 'letme1n');
    browser.clickSync('.login-button-form-submit');
    browser.waitForExistSync('#login-name-link');
  });

  this.Then(/^the user is able to see my content$/, function () {
    browser.url(process.env.ROOT_URL + 'chapter-1');
    browser.waitForExistSync('#premuium-content');
    expect(browser.isVisibleSync('#premuium-content')).to.be.true;
  });

  this.Then(/^they are informed of their expired subscription$/, function () {
    browser.waitForExistSync('.subscription-expired');
    expect(browser.isVisibleSync('.subscription-expired')).to.be.true;
  });

  this.Then(/^the user is not able to see my content$/, function () {
    browser.clickSync('a*=Home');
    browser.waitForExistSync('a*=Chapter 1');
    browser.clickSync('a*=Chapter 1');
    browser.waitForExistSync('.description');
    expect(browser.isVisibleSync('#premium-content')).to.be.false;
  });

};
