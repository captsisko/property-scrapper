const puppeteer = require('puppeteer')

async function RMnearbyRentals(postcode, bedrooms) {

    try {
        bedrooms = bedrooms.split(',').map(Number)

        /**
         * load rightmove
         */
        const browser = await puppeteer.launch({
            headless: false,
            args: [
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--disable-setuid-sandbox",
                "--no-sandbox",
            ],
        })
        const page = await browser.newPage()
        await page.goto('https://www.rightmove.co.uk/property-to-rent.html', {
            waitUntil: 'networkidle2'
        })

        // dismiss cookies modal
        await page.click('button#onetrust-reject-all-handler')
        
        /**
         * input the postcode into the location input field
         */
        // await page.type('input[id=searchLocation]', postcode, {delay: 5})
        // await page.type('input[class=ksc_inputText.ksc_typeAheadInputField]', postcode, {delay: 5})
        await page.type('input.ksc_inputText.ksc_typeAheadInputField', postcode, {delay: 5});
        await page.keyboard.press('Enter');

        // await page.waitForTimeout(5000); // Wait for 5 seconds

        /**
         * submit the form
         */
        // await page.click('button.ksc_button')

        await page.waitForSelector('div#lettingsearchcriteria', { timeout: 60000 }); // Wait for 60 seconds

        /**
         * add number of bedroom filters if provided
         */
        if ( bedrooms ) {
            await page.select('select#minBedrooms', bedrooms[0].toString())
            await page.select('select#maxBedrooms', bedrooms[1].toString())
        }

        await page.select('select#radius', '1.0')

        await page.click('span.tickbox--indicator', 'on');

        /**
         * submit the form
         */
        await page.click('button#submit')

        /********************************************************************************/
        await page.waitForSelector('div#l-searchResults');

        /**
         * get results count
         */
        let rows = await page.$$('div.l-searchResult')
        let matches = []
        let count = 0
        for (let index = 0; index < rows.length; index++) {

            try {
                // console.log('--------------------------------------- : ' + index);
                const row = rows[index];
                if (await page.$('div.propertyCard-tag') !== null) {
                    let status = await row.$eval('div.propertyCard-tag', element => element.textContent)
                    if( status.includes('Let agreed') ) {

                        let title = await row.$eval('address.propertyCard-address', element => element.textContent)
                        // console.log('Title: ' + title.trim());

                        // console.log('Status: ' + status.trim());

                        let cost = await row.$eval('span.propertyCard-priceValue', element => element.textContent)
                        cost = cost.replace('£', '').replace('pcm', '').replace(',', '').trim()
                        // console.log('Cost: ' + cost);

                        let link = await row.$eval('a.propertyCard-link', element => element.href)
                        // console.log(link);

                        // console.log(title);
                        // console.log(cost);
                        // console.log(link);
                        // console.log('----------------------');

                        matches[count++] = {'title':title.trim(), 'cost':cost, 'link':link}
                    }
                }
                // console.log('---------------------------------------');
            } catch (error) {}
            
        }
        
        // console.log(matches.length);
        console.log(matches);
        
        /********************************************************************************/
        await browser.close()
        
        return matches

    } catch (error) {
        console.log( error )
    }
}

module.exports = { RMnearbyRentals }
// nearbyRentals('TS19 0ER', '2')