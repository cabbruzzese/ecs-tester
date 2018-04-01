const path = require('path');
const puppeteer = require('puppeteer');
// const faker = require('faker');

const {
    getConsoleLink,
    setupEnvironment,
    login,
    screenshot,
    isFargateRegion
} = require('../util');

let browser;
let consoleLink;

jest.setTimeout(600 * 1000);

beforeEach(async () => {
    setupEnvironment();
    // browser = await puppeteer.launch({
    //     args: ['--no-sandbox'],
    //     headless: false,
    //     sloMo: 5000
    // });
    browser = await puppeteer.launch({
        args: ['--no-sandbox']
    });

    consoleLink = getConsoleLink(process.env.REGION, 'ecs', '/firstRun');
});

afterEach(() => browser.close());

describe('ec2 first run', () => {
    test('shows up when navigated to', async () => {
        if (isFargateRegion(process.env.REGION)) {
            return;
        }

        const page = await login(browser, consoleLink);

        await page.waitForSelector('[create-first-task-definition-v2]');
        const content = await page.content();

        await screenshot(page, path.resolve(process.cwd(), './artifacts/ec2-firstrun.png'));

        expect(content.length).not.toBe(0);
    });

    test('finishes out the process', async () => {
        if (isFargateRegion(process.env.REGION)) {
            return;
        }

        const page = await login(browser, consoleLink);

        // task def page
        await page.waitForSelector('[create-first-task-definition-v2]');
        await page.click('.aws-button .btn-primary');

        // service page
        await page.waitForSelector('[configure-runtime-v2]');
        await page.click('.aws-button .btn-primary');

        // cluster page
        await page.waitForSelector('[configure-cluster-v2]');
        await page.waitFor(1000); // because we disable our buttons
        await page.click('.aws-button .btn-primary');

        // review page
        await page.waitForSelector('[review-first-run-v2]');
        await page.waitFor(1000); // because another disabled button
        await page.click('.aws-button .btn-primary');

        // launch page
        await page.waitForSelector('[wizard-launch-status]');
        await page.waitFor(
            () => !document.querySelectorAll('awsui-alert[type="info"]').length,
            { timeout: 300 * 1000 }
        );
        const errors = await page.$$('awsui-alert[type="error"]');

        await screenshot(page, path.resolve(process.cwd(), './artifacts/finished-ec2-firstrun.png'));

        expect(errors).toHaveLength(0);
    });
});