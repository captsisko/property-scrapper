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

    let page = await browser.newPage()
    await page.setDefaultNavigationTimeout(0);
    URL = "https://www.rightmove.co.uk/property-for-sale/search.html?searchLocation=" + URL + "&useLocationIdentifier=false&locationIdentifier=&buy=For+sale"
    console.log('URL: ', URL);
    let allSet = false

    await page.goto(URL, {
        timeout: 0
    })

    // set filter values
    await setUpSearchParameters(page, bedrooms[0], bedrooms[1], type)

    do {
        // filter results for reduced properties
        AllProperties = [...AllProperties, await getReducedListings(page)].flat()

        // go to next page
        page = await nextPage(page)
    } while (page);
    
    console.log('All properties: ', AllProperties.length);
    console.log(page);
    AllProperties = await expand(AllProperties, page)
    console.log(AllProperties);
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

    // Get all elements with the class multiSelect-label i:e select the "new home", "retirement home" and "buying schemes"
    const elements = await page.$$('.filtersTray-dontShow .multiSelect-label');
    for (let element of elements) {
        await element.click();
        await page.waitForTimeout(100); // 100 milliseconds = 1/10 seconds
    }

    // close filter tray
    await page.click('button.filtersBar-filter.filtersBar-more')
}

async function getReducedListings(page) {
    const reducedPropertiesData = await page.$$eval('div.l-searchResult.is-list', divs => 
        divs.filter(div => {
            const spanElement = div.querySelector('span.propertyCard-branchSummary-addedOrReduced');
            return spanElement && spanElement.textContent.includes('Reduced');
        }).map(div => {
            const linkElement = div.querySelector('a.propertyCard-link');

            return {
                url: linkElement ? linkElement.href : null,
                // Add any other fields you need
            };
        })
    );

    // console.log(reducedPropertiesData);
    return reducedPropertiesData
}

async function nextPage(page) {
    let buttonNext = await page.$('button.pagination-direction--next')

    if (!await buttonNext.evaluate(button => button.hasAttribute('disabled'))) {
        await page.waitForTimeout(5000)
        await buttonNext.click('button.pagination-direction--next')
        await page.waitForSelector('div#propertySearch-results-container')
        await page.waitForSelector('button.pagination-direction--next')
    
        console.log('-------------------------------------------------')
        return page
    } else {
        console.log("=============> End of results");
        return false
    }
}

async function expand(reducedPropertiesData, page) {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            // "--disable-gpu",
            // "--disable-dev-shm-usage",
            "--disable-setuid-sandbox",
            "--no-sandbox",
        ],
    })

    let newpage = await browser.newPage()

    for (const property of reducedPropertiesData) {
        console.log('Visiting: ', property.url);
        let response = await newpage.goto(property.url, {
            timeout: 0
        });
        const pageModel = await newpage.evaluate(() => {
            return window.PAGE_MODEL;
        });
        property.id = await pageModel.propertyData.id ? 
                        await pageModel.propertyData.id : null
        property.postcode = await pageModel.analyticsInfo.analyticsProperty.postcode ? 
                        await pageModel.analyticsInfo.analyticsProperty.postcode : null
        property.bedrooms = await pageModel.propertyData.bedrooms ? 
                        await pageModel.propertyData.bedrooms : null
        property.bathrooms = await pageModel.propertyData.bathrooms ? 
                        await pageModel.propertyData.bathrooms : null
        property.price = await pageModel.propertyData.mortgageCalculator.price ? 
                        await pageModel.propertyData.mortgageCalculator.price : null
        let reductionDate = await pageModel.propertyData.listingHistory.listingUpdateReason.match(/(\d{2}\/\d{2}\/\d{4})/) ? 
                            await pageModel.propertyData.listingHistory.listingUpdateReason.match(/(\d{2}\/\d{2}\/\d{4})/)[0] : await pageModel.propertyData.listingHistory.listingUpdateReason.split(' ')[1]
        property.reductionDate = reductionDate
        property.reductionDuration = Math.floor(await reductionDuration(reductionDate))
    }

    return reducedPropertiesData
}

async function reductionDuration(date = null) {
    if (date === 'yesterday') {
        date = await formatDate('yesterday')
    } else if(date === 'today') {
        date = await formatDate()
    }

    let parts = date.split('/')
    let day = parts[0]
    let month = parts[1]
    let year = parts[2]

    // Create a date object for the given date
    const givenDate = new Date(year, month-1, day); // Note: JavaScript month is 0-indexed (0 = January, 11 = December)

    // Get the current date
    const currentDate = new Date();

    // Get the time difference in milliseconds
    const timeDifference = givenDate.getTime() - currentDate.getTime();

    // Convert the time difference to days
    const dayDifference = timeDifference / (1000 * 60 * 60 * 24);

    // If you want to get the absolute difference without considering which date is earlier or later
    const absoluteDayDifference = Math.abs(dayDifference);

    // console.log(absoluteDayDifference); // This will give you the difference in days
    return absoluteDayDifference
}

async function formatDate(period = 'today') {
    let date = new Date()
    let day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // January is 0!
    const year = date.getFullYear();

    if( period === 'yesterday' ) {
        day = day - 1
    }
    return `${day}/${month}/${year}`;
}

module.exports = { RMnearbySales }