const express = require('express');
const { RMnearbyRentals } = require('./rightmove/nearbyRentals');
const { RMnearbySales } = require('./rightmove/nearbySales');
const { ZPnearbySales } = require('./zoopla/nearbySales');
// const app = express()
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

const checks = {
    'source' : ['rightmove', 'zoopla'],
    'type' : ['houses', 'flats'],
    'beds' : null,
    'task' : ['rentals', 'sales'],
    'location': null,
    'filterby': ['reduced', 'not-reduced']
}

// console.log(Object.keys(argv));
// console.log(Object.keys(argv).length);
// Object.keys(argv).forEach(arg => {
//     console.log('Checking: ', arg);
// });

let check = true
let count = 0
Object.keys(argv).forEach(arg => {
    const regexBeds = /^\d+,\d+$/;
    if (arg === 'beds') {
        if (regexBeds.test(argv[arg])) {
            count += 1
        } else {
            console.error('Something wrong with the beds parameters: ', argv[arg]);
            check = false
        }
    }

    const regexLocation = /^\s*\S+.*$/
    if (arg === 'location') {
        if (regexLocation.test(argv[arg])) {
            count += 1
        } else {
            console.error('Something wrong with the location parameter: ', argv[arg]);
            check = false
        }
    }

    if (Array.isArray(checks[arg])) {
        if (checks[arg].includes(argv[arg])) {
            count += 1
        } else {
            console.error('Something wrong with parameter: ', argv[arg]);
            check = false                
        }
    }
});

if (count === Object.keys(checks).length) {
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
} else {
    console.error('Something wrong with one or more parameters');
}

// app.get('/', function (req, res) {
//     res.send('Hello World')
// })

// app.listen(3000)