# Property Scrapper

This project scrapes Rightmove and Zoopla for investable properties.

The entry point for the project is _index.js_ which uses data provided as commandline arguments to call the relevant script, search and filter.

## Example script call
node index.js --source='rightmove' --type='houses' --location='Birchington, Kent' --beds=3,4 --task=sales

### Breakdown
* source : currently either _rightmove_ or _zoopla_
* type : currently only _houses_. More options to come
* location : any valid location searchable by the source being scrapped
* beds : comma seperated numbers indicating max and min numbers range to search for
* task : choice between _sales_ and _rent_. Currently only supports **sales**.
