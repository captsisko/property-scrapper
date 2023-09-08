const express = require('express')
const app = express();
const fs = require('fs')
// const minimist = require('minimist')
const loadingSpinner = require('loading-spinner');
// const cliSpinners = require('cli-spinners');
// const db = require('./engage/db')
// const locationsTable = require('./models/Locations')
// const pluck = require('arr-pluck')
const puppeteer = require('puppeteer')
// const rentals = require('./nearbyRentals')
// const scrappings = require('./engage/initiate-results-scrapping');
// const { exit } = require('process');


// let bed_min = null
// let bed_max = null

async function RMnearbySales(postcode, bedrooms, type) {

    bedrooms = bedrooms.split(',').map(Number)

    // Start the loading spinner
    loadingSpinner.start(100, {
        clearChar: true
    });
    // Customize the spinner sequence
    loadingSpinner.setSequence(['','|','/','-','\\']);
    // loadingSpinner.setSequence([ '∙∙∙ ', '●∙∙ ', '∙●∙ ', '∙∙● ', '∙∙∙ ' ]);
    // console.log(cliSpinners.random)

    let scrappings = ''
    // if (args['beds']) {
    //     options = args['beds'].split(',')
    //     bed_min = options[0]
    //     bed_max = options[1]
        console.log('beds set => MIN: ', bedrooms[0], ' and MAX: ', bedrooms[1])
    // } else {
    //     console.log('NO BEDS')
    // }

    /**
     * Provide a single location from the cli via the --location argument
     *                              OR
     * Supply no --location and loop through all locations in the database
     */
    let locations = []
    // if (args['location']) {
        locations.push( postcode )
    // } else {
        // const locationsModel = locationsTable.init()
        // await locationsModel.findAll({raw:true, attributes:['name']}).then((location) => {
        //     location = pluck(location, 'name')
        //     locations = location
        // })
    // }

    // const task = args['task']//.toLowerCase()
    // switch (task) {
    //     case 'single':
    //         scrappings = require('./singleScrape')
    //         const id = args['id']
    //     break;
    //     case 'reductions':
    //         scrappings = require('./engage/reduced')
    //         // if( args['reset'] ) {
    //         //     console.log('Resetting ...')
    //         //     db.reset()
    //         // }
    //     break;
    
    //     default:
    //         break;
    // }

    console.log('**************USAGE**************')
    console.log("Task options (--task='single, reductions') : ")
    // console.log('??? = ')
    console.log('For the single scrap task, provide the righmove/onthemarket property id in the url of the property listing')
    console.log('*********************************')

    locations.forEach( async location => {
        
        try {
            /**
             * load rightmove
             */
            const browser = await puppeteer.launch({
                headless: false,
                args: [
                    // "--disable-gpu",
                    // "--disable-dev-shm-usage",
                    "--disable-setuid-sandbox",
                    "--no-sandbox",
                ],
            })
            const page = await browser.newPage()
            await page.goto("https://www.rightmove.co.uk/property-for-sale/search.html?searchLocation=" + location + "&useLocationIdentifier=false&locationIdentifier=&buy=For+sale", {
                waitUntil: 'networkidle2',
                timeout: 0
            })

            // dismiss cookies modal
            await page.click('button#onetrust-reject-all-handler')

            /**
             * add number of bedroom filters if provided
             */
            // if ( bed_min ) {
                await page.select('select#minBedrooms', bedrooms[0].toString())
            // }
            // if ( bed_max ) {
                await page.type('select#maxBedrooms', bedrooms[1].toString())
                await page.type('select#displayPropertyType', type)
                await page.keyboard.press('Enter');

                // await page.click('button.touchsearch-button.touchsearch-primarybutton')
            // }

            /**
             * submit the form
             */
            await page.click('button#submit')

            /**
             * get results count
             */
            await page.waitForSelector("span.pagination-pageInfo[data-bind='text: total']")
            const pageCount = await page.$eval("span.pagination-pageInfo[data-bind='text: total']", el => el.innerHTML)
            const resultsTotal = await page.$eval("span.searchHeader-resultCount[data-bind='counter: resultCount, formatter: numberFormatter']", el => el.innerHTML)
            console.log()
            console.log('------------- Initiating -------------')
            console.log(resultsTotal + ' properties across ' + pageCount + ' pages to process')
            if (parseInt(resultsTotal) === 0) {
                console.log('...Exiting!')
                exit()
            }
            console.log('--------------------------------------')
            console.log()

            // appends the filters directly to the url - attempts to do the same via the UI had little success
            scrappings.initiate(page.url() + '&dontShow=newHome,retirement,sharedOwnership', pageCount, location)

            await browser.close()
            
        } catch (error) {
            console.log( error )
        }
    }) //foreach locations
}

module.exports = { RMnearbySales }