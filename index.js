const express = require('express');
const { RMnearbyRentals } = require('./rightmove/nearbyRentals');
const { RMnearbySales } = require('./rightmove/nearbySales');
const { ZPnearbySales } = require('./zoopla/nearbySales');
const app = express()
const argv = require('yargs').argv;
console.log('Parameters: ', argv);

const { source, type, beds, location, task, filterby } = argv;

console.log("************** USAGE **************")
console.log("* command: node index.js --source=*** --type=*** --beds=*,* --task=*** --location=**** --filterby=***");
console.log("* Source: rightmove, zoopla");
console.log("* Type: houses, flats, bungalows, land");
console.log("* Beds: e:g 1,2 indicating minimum of 1 and maximum of 2 beds");
console.log("* Task: rentals, sales");
console.log("* Location: a valid location recognised by the specified source");
console.log("* FilterBy: e:g reduced, not-reduced");
console.log("***********************************")

switch (source) {
    case 'rightmove':
        console.log('calling rightmove');
        // if (task === 'rentals') {
        //     // nearbyRentals = require('./rightmove/nearbyRentals')
        //     RMnearbyRentals(location, beds, type)
        // } else if (task === 'sales') {
            RMnearbySales(location, beds, type, filterby)
        // }
        break;

    case 'zoopla':
        console.log('calling zoopla');
        // if (task === 'rentals') {
            // nearbyRentals = require('./rightmove/nearbyRentals')
            // RMnearbyRentals(location, beds, type)
        // } else if (task === 'sales') {
            ZPnearbySales(location, beds, type, filterby)
        // }
        break;

    default:
        console.log('Unknow service: ', source);
        break;
}

app.get('/', function (req, res) {
    res.send('Hello World')
})

app.listen(3000)