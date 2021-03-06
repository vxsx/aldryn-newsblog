'use strict';

var helpers = require('djangocms-casper-helpers');
var globals = helpers.settings;
var casperjs = require('casper');
var cms = helpers(casperjs);
var xPath = casperjs.selectXPath;

casper.test.setUp(function (done) {
    casper.start()
        .then(cms.login())
        .run(done);
});

casper.test.tearDown(function (done) {
    casper.start()
        .then(cms.logout())
        .run(done);
});

/**
 * Returns xpath expression to find the to the specific row in the admin.
 * Can also be used to find xpath to specific links in that row.
 *
 * @function generateXPathForAdminSection
 * @param {Object} options
 * @param {String} options.section module name, e.g. Django CMS
 * @param {String} options.row module row, e.g Pages, Users
 * @param {String} [options.link] specific link in the row, e.g "Add" or "Change"
 */
var generateXPathForAdminSection = function (options) {
    var xpath = '//div[.//caption/a[contains(text(), "' + options.section + '")]]';

    if (options.link) {
        xpath += '//th[./a[contains(text(), "' + options.row + '")]]';
        xpath += '/following-sibling::td/a[contains(text(), "' + options.link + '")]';
    } else {
        xpath += '//th/a[contains(text(), "' + options.row + '")]';
    }

    return xpath;
};

casper.test.begin('Creation / deletion of the apphook', function (test) {
    casper
        .start(globals.adminUrl)
        .waitUntilVisible('#content', function () {
            test.assertVisible('#content', 'Admin loaded');
            this.click(
                xPath(generateXPathForAdminSection({
                    section: 'Aldryn News & Blog',
                    row: 'Application configurations',
                    link: 'Add'
                }))
            );
        })
        .waitForUrl(/add/)
        .waitUntilVisible('#newsblogconfig_form')
        .then(function () {
            test.assertVisible('#newsblogconfig_form', 'Apphook creation form loaded');

            this.fill('#newsblogconfig_form', {
                namespace: 'Test namespace',
                app_title: 'Test Blog'
            }, true);
        })
        .waitUntilVisible('.success', function () {
            test.assertSelectorHasText(
                '.success',
                'The application configuration "NewsBlog / Test namespace" was added successfully.',
                'Apphook config was created'
            );

            test.assertElementCount(
                '#result_list tbody tr',
                2,
                'There are 2 apphooks now'
            );

            this.clickLabel('NewsBlog / Test namespace', 'a');
        })
        .waitUntilVisible('.deletelink', function () {
            this.click('.deletelink');
        })
        .waitForUrl(/delete/, function () {
            this.click('input[value="Yes, I\'m sure"]');
        })
        .waitUntilVisible('.success', function () {
            test.assertSelectorHasText(
                '.success',
                'The application configuration "NewsBlog / Test namespace" was deleted successfully.',
                'Apphook config was deleted'
            );
        })
        .run(function () {
            test.done();
        });
});

casper.test.begin('Creation / deletion of the article', function (test) {
    casper
        .start()
        .then(cms.addPage({ title: 'Blog' }))
        .then(cms.addApphookToPage({
            page: 'Blog',
            apphook: 'NewsBlogApp'
        }))
        .then(cms.publishPage({
            page: 'Blog'
        }))
        .thenOpen(globals.editUrl, function () {
            test.assertSelectorHasText('p', 'No items available', 'No articles yet');
        })
        .thenOpen(globals.adminUrl)
        .waitUntilVisible('#content', function () {
            test.assertVisible('#content', 'Admin loaded');
            this.click(
                xPath(generateXPathForAdminSection({
                    section: 'Aldryn News & Blog',
                    row: 'Articles',
                    link: 'Add'
                }))
            );
        })
        .waitForUrl(/add/)
        .waitUntilVisible('#article_form')
        .then(function () {
            test.assertVisible('#article_form', 'Article creation form loaded');

            this.fill('#article_form', {
                title: 'Test article'
            }, true);
        })
        .waitUntilVisible('.success', function () {
            test.assertSelectorHasText(
                '.success',
                'The article "Test article" was added successfully.',
                'Article was created'
            );

            test.assertElementCount(
                '#result_list tbody tr',
                1,
                'There is 1 article available'
            );
        })
        .thenOpen(globals.editUrl, function () {
            test.assertSelectorHasText(
                '.article.unpublished h2 a',
                'Test article',
                'Article is available on the page'
            );
        })
        .thenOpen(globals.adminUrl)
        .waitUntilVisible('#content', function () {
            this.click(
                xPath(generateXPathForAdminSection({
                    section: 'Aldryn News & Blog',
                    row: 'Articles'
                }))
            );
        })
        .waitForUrl(/article/, function () {
            this.clickLabel('Test article', 'a');
        })
        .waitUntilVisible('.deletelink', function () {
            this.click('.deletelink');
        })
        .waitForUrl(/delete/, function () {
            this.click('input[value="Yes, I\'m sure"]');
        })
        .waitUntilVisible('.success', function () {
            test.assertSelectorHasText(
                '.success',
                'The article "Test article" was deleted successfully.',
                'Article was deleted'
            );
        })
        .then(cms.removePage())
        .run(function () {
            test.done();
        });
});
