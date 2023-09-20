// const puppeteer = require('puppeteer')
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const loadingSpinner = require('loading-spinner')

async function ZPnearbySales(URL, bedrooms, type, filter) {
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
    URL2 = "http://www.zoopla.co.uk/for-sale/"
    console.log('URL: ', await changeToHTTP(URL2));

    await page.goto(await changeToHTTP(URL2), {
        timeout: 0
    })

    // to avoid "are you human" check
    await page.setUserAgent('Mozilla/5.0 (Linux; U; Android 4.1.1; en-gb; Build/KLP) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Safari/534.30');
    dismissCookiesiFrame(page)

    // set area to serach and push enter
    await page.type('input#autosuggest-input', URL)
    await page.keyboard.press('Enter');

    // set filter values
    await setUpSearchParameters(page, bedrooms[0], bedrooms[1], type)

    do {
        // filter results for reduced properties
        AllProperties = [...AllProperties, await getReducedListings(page, filter)].flat()
        
        // go to next page
        page = await nextPage(page)
    } while (page);
    
    console.log('All properties: ', AllProperties.length);
    AllProperties = await expand(AllProperties, page)
    console.log('Finally => ', AllProperties);
    console.log('Completed all', AllProperties.length, 'expansion()s.');
}

async function dismissCookiesiFrame(page) {
    // Find the iframe
    const iframeElement = await page.$('iframe#gdpr-consent-notice'); // Adjust the selector if there are multiple iframes

    if (iframeElement) {
        // Switch to the iframe's context
        const frame = await iframeElement.contentFrame();

        // Find the button inside the iframe and click it
        await frame.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('span'));
            const targetElement = elements.find(element => element.textContent.trim() === 'Accept all cookies');
            if (targetElement) targetElement.click();
            // await page.click('button#save')
        });    
    }
}

async function setUpSearchParameters(page, minBedroomValue, maxBedroomValue, propertyTypeValue) {

    // const buttonSelector = await page.$('button[aria-live="polite"][data-loading="false"]._1erwn750._1erwn753._1erwn75a._1dgm2fc8');
    const buttonSelector = 'button[aria-live="polite"]._1erwn750._1erwn753._1erwn75a._1dgm2fc8';

    await page.waitForSelector(buttonSelector, {timeout: 5000}); // wait up to 5 seconds

    const button = await page.$(buttonSelector);

    if (button) {
        await button.click();
    } else {
        console.error('Button not found');
    }

    let minSet = null
    let maxSet = null
    let typeSet = null

    // set the type of property to search
    if (propertyTypeValue === 'houses') {
        await page.click('button#Terraced')
        await page.click('button#Detached')
        await page.click('button#Bungalows')
        await page.click('button#Semi-detached')
    } else if (propertyTypeValue === 'flats') {
        await page.click('button#Flats')
    }

    // set the min and max room values
    await page.select('select[name="beds_min"]', minBedroomValue);
    await page.select('select[name="beds_max"]', maxBedroomValue);

    minSet = await page.$eval('select[name="beds_min"]', el => el.value);
    maxSet = await page.$eval('select[name="beds_max"]', el => el.value);

    await page.click('button#new_homes_exclude')
    await page.click('button#retirement_homes_exclude')
    await page.click('button#shared_ownership_exclude')
    await page.click('button#auction_exclude')

    // submit
    // Focus on the text field
    await page.focus('input#keywords');

    // Simulate pressing the Enter key
    await page.keyboard.press('Enter');
}

async function getReducedListings(page, filter='reduced') {
    await page.waitForSelector('div._1c58w6u2');

    const reducedPropertiesData = await page.$$eval('div._1c58w6u2', (divs, filter) => {
        const changeToHTTPFunc = (url) => {
            if (url.startsWith('https://')) {
                return url.replace('https://', 'http://');
            }
            return url;
        };

        return divs.filter(div => {
            const listedItem = div.querySelector('p._1sftax54._1dgm2fc9') ? div.querySelector('p._1sftax54._1dgm2fc9') : div.querySelector('li._65yptp1')
            if (filter === 'reduced') {
                return listedItem && listedItem.textContent.includes('reduced');
            } else if (filter === 'not-reduced') {
                return listedItem && listedItem.textContent.includes('Listed')
            }
        }).map(div => {
            const linkElement = div.querySelector('a.rgd66w1');
            const detailsElement = div.querySelector('p._1sftax54') ? div.querySelector('p._1sftax54') : div.querySelector('li._65yptp1')
            const bedroomsElement = div.querySelector('svg[href="#bedroom-medium"] + span');
            const bathroomsElement = div.querySelector('svg[href="#bathroom-medium"] + span');
            
            return {
                // url: linkElement ? changeToHTTPFunc(linkElement.href) : null,
                url: linkElement ? linkElement.href : null,
                reductionDetails: detailsElement ? detailsElement.textContent : null,
                bedrooms: bedroomsElement ? bedroomsElement.textContent : null,
                bathrooms: bathroomsElement ? bathroomsElement.textContent : null,
                filter: filter
            };
        });
    }, filter);

    console.log('. . . counting: ', reducedPropertiesData.length);
    return reducedPropertiesData;
}

async function nextPage(page) {
    try {

        // Wait for the anchor containing a div with the text "Next" to be rendered
        await page.waitForXPath("//a[div/div[text()='Next']]", {timeout: 10000});

        // Select the button using its text content
        const nextButton = await page.$x("//a[div/div[text()='Next']]");

        if (nextButton && nextButton.length > 0) {
            console.log('Next button found');

            const isDisabled = await page.evaluate(button => button.getAttribute('aria-disabled') === 'true', nextButton[0]);

            if (!isDisabled) {
                await nextButton[0].click();
                console.log('Navigated to the next page.');
                await page.waitForTimeout(3000);  // Adjust as needed
                return page;
            } else {
                console.log('The "Next" button is disabled.');
            }
        } else {
            console.log('"Next" button not found.');
        }

        return false;
                
    } catch (error) {
            
    }
}

async function expand(reducedPropertiesData = null) {
    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox']
    });

    for (const property of reducedPropertiesData) {

        // Error handling
        try {
            const page = await browser.newPage();
            console.log('Opening: ', property.url, ' ...');
            
            await page.setUserAgent('Mozilla/5.0 (Linux; U; Android 4.1.1; en-gb; Build/KLP) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Safari/534.30');
            await page.goto(property.url, { 
                timeout: 0, 
                // waitUntil: 'domcontentloaded'
                waitUntil: 'networkidle0'
            });
            
            // Ensure the element is there before using it
            // await page.waitForSelector('script#__ZAD_TARGETING__');
            await page.waitForSelector('script#__ZAD_TARGETING__')//, { timeout: 60000 }); // waits for 60 seconds
            let content = await page.$eval('script#__ZAD_TARGETING__', el => el.textContent);
            let json = JSON.parse(content);

            let formattedDate = await extractDate(property.reductionDetails)

            property.id = json.listing_id;
            property.postcode = json.outcode + ' ' + json.incode;
            property.bedrooms = json.num_beds;
            property.bathrooms = json.num_baths;
            property.price = json.price;
            property.date = formattedDate
            property.duration = Math.floor(await reductionDuration(formattedDate))
            await page.close();
        } catch (error) {
            console.error(`Error processing property: ${property.url}`, error);
            const page = await browser.newPage();
        } finally {
            console.log('... closing!');
        }
    }

    await browser.close();
    return reducedPropertiesData;
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

async function changeToHTTP(url) {
    if (url.startsWith('https://')) {
        return url.replace('https://', 'http://');
    }
    return url;
}

async function extractDate(input) {
    // const input = "4.5% Last reduced: 14th Jan 2023";

    // Use a regex to extract day, month, and year
    const match = input.match(/(\d+)(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})/);

    if (match) {
        const day = match[1];
        const monthName = match[2];
        const year = match[3];

        // Convert month name to its number
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthNumber = monthNames.indexOf(monthName) + 1;

        // Format the date
        const formattedDate = `${day.padStart(2, '0')}/${monthNumber.toString().padStart(2, '0')}/${year}`;
        return formattedDate
        console.log(formattedDate); // Expected output: 14/01/2023
    } else {
        console.log("Date format not found in the string.");
        return null
    }
}

module.exports = { ZPnearbySales }