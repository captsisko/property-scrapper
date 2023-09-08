const puppeteer = require('puppeteer')
const loadingSpinner = require('loading-spinner')

async function RMnearbySales(URL, bedrooms, type) {
    bedrooms = bedrooms.split(',').map(Number)
    bedrooms[0] = bedrooms[0].toString()
    bedrooms[1] = bedrooms[1].toString()

    const browser = await puppeteer.launch({
        headless: false,
        args: [
            // "--disable-gpu",
            // "--disable-dev-shm-usage",
            "--disable-setuid-sandbox",
            "--no-sandbox",
        ],
    })

    AllProperties = []

    const page = await browser.newPage()
    await page.setDefaultNavigationTimeout(0);
    URL = "https://www.rightmove.co.uk/property-for-sale/search.html?searchLocation=" + URL + "&useLocationIdentifier=false&locationIdentifier=&buy=For+sale"
    console.log('URL: ', URL);
    let allSet = false

    await page.goto(URL, {
        timeout: 0
    })

    setUpSearchParameters(page, bedrooms[0], bedrooms[1], type)
    
    await page.screenshot({ path: 'screenshot.png' });

    console.log('All properties: ', AllProperties.length);
}

async function setUpSearchParameters(page, minBedroomValue, maxBedroomValue, propertyTypeValue) {

    // dismiss cookies modal if it comes up
    if (await page.waitForSelector('#onetrust-banner-sdk', { timeout: 5000 })) {
        console.log('Modal detected . . . DISMISSING');
        await page.click('button#onetrust-accept-btn-handler')
    } else {
        console.log("Modal NOT detected");
    }

    let minSet = null
    let maxSet = null
    let typeSet = null

    // set the type of property to search
    await page.select('select#displayPropertyType', propertyTypeValue);
    typeSet = await page.$eval('select#displayPropertyType', el => el.value);

    // Submitting the form
    await page.focus('select#minBedrooms'); 
    await page.keyboard.press('Enter');
    await page.waitForNavigation({ waitUntil: 'load' });

    // open filter tray
    await page.click('button.filtersBar-filter.filtersBar-more')

    // set the min and max room values
    await page.select('select[name="minBedrooms"]', minBedroomValue);
    await page.select('select[name="maxBedrooms"]', maxBedroomValue);

    minSet = await page.$eval('select[name="minBedrooms"]', el => el.value);
    maxSet = await page.$eval('select[name="maxBedrooms"]', el => el.value);

    // multiSelect-label
    const elements = await page.$$('.filtersTray-dontShow .multiSelect-label');  // Get all elements with the class multiSelect-label
    for (let element of elements) {
        await element.click();
        await page.waitForTimeout(1000); // 1000 milliseconds = 1 seconds
    }

    // close filter tray
    await page.click('button.filtersBar-filter.filtersBar-more')
}

module.exports = { RMnearbySales }