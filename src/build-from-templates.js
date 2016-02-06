var swig = require('swig');

if ( process.argv.length < 3 ) {
  process.stderr.write( "Usage: " + process.argv[0] + " " + process.argv[1] + " [FOLDER]\n" );
  process.exit(1);
}
else {
  var folder = process.argv[2];
}
process.stderr.write( "Building html from " + folder + " template.\n" );

var dishes = require('./' + folder + '/dishes.json');
var glossary = require('./' + folder + '/glossary.json');
var locations = require('./' + folder + '/locations.json');


var unorderedFoodByLocation = require('./' + folder + '/by-location.json');

function compare(a,b) {
  if (a.order < b.order)
    return -1;
  if (a.order > b.order)
    return 1;
  return 0;
}

var foodByLocation = [];
for ( var i = 0; i < unorderedFoodByLocation.length; i++ ) {
  foodByLocation.push( unorderedFoodByLocation[i].sort(compare) );
}


// connect dishes to locations
for ( var i = 0; i < dishes.length; i++ ) {
  dishes[i].places = new Array();
  for ( var j = 0; j < foodByLocation.length; j++ ) {
    for ( var k = 0; k < foodByLocation[j].length; k++ ) {
      var place = foodByLocation[j][k];
    
      var search = dishes[i].search || new Array();
      search.push( dishes[i].name );
    
      if ( isPlaceMatch( place, search, dishes[i].search_exclude || [] ) ) dishes[i].places.push( place );

    }
  }
  dishes[i].places = dishes[i].places.sort(compare);
}

function isPlaceMatch( place, search, exclude ) {

  for ( var i = 0; i < exclude.length; i++ ) {
    if ( place.description.toLowerCase().indexOf( exclude[i].toLowerCase() ) >= 0 || place.name.toLowerCase().indexOf( exclude[i].toLowerCase() ) >= 0 ) {
      return false;
    }
  }
  

  for ( var l = 0; l < search.length; l++ ) {
    if ( place.description.toLowerCase().indexOf( search[l].toLowerCase() ) >= 0 || place.name.toLowerCase().indexOf( search[l].toLowerCase() ) >= 0 ) {
      return true;
    }
  }
  return false;
}



// Compile a file and store it, rendering it later
var tpl = swig.compileFile('./templates/' + folder + '.html');


console.log(tpl({ foodByLocation: foodByLocation, locations: locations, dishes: dishes, version: 'live' }));
