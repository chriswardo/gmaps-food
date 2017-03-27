"use strict";
var swig = require('swig');
var fs = require('fs');


swig.setFilter('substr', function (text, start, len) {


  return text.substr(start, len);

});

if (process.argv.length < 3) {
  process.stderr.write("Usage: " + process.argv[0] + " " + process.argv[1] + " [FOLDER]\n");
  process.exit(1);
} else {
  var folder = process.argv[2];
}

var css = false;
if ( process.argv.length >= 4 ) {
  const css_file = process.argv[3];
  css = fs.readFileSync(css_file, 'utf8');
  process.stderr.write("Including CSS file: " + css_file + " (" + css.length + ")\n");
}

process.stderr.write("Building html from " + folder + " template.\n");

var dishes = require('../configs/' + folder + '/dishes.json');
var glossary = require('../configs/' + folder + '/glossary.json');
var locations = require('../configs/' + folder + '/locations.json');


String.prototype.toHtmlEntities = function () {
  return this.replace(/./gm, function (s) {
    return "&#" + s.charCodeAt(0) + ";";
  });
};


function linkDishTooltips(text, dish) {

  var textWithoutExcludes = text.toLowerCase(), search_exclude = dish.search_exclude || [];
  for (var i = 0; i < search_exclude.length; i++) {
    textWithoutExcludes = textWithoutExcludes.replace( new RegExp(search_exclude[i], 'gi'), '' );
  }
  var search = dish.search || new Array();
  search.push( dish.name );

  for ( var i = 0; i < search.length; i++ ) {
    if ( search[i].length > 2 && textWithoutExcludes.indexOf( search[i].toLowerCase() ) >= 0 ) {
      var desc = '<h2>' + dish.name + '</h2><p>' + dish.description + '</p>';
      text = text.replace( new RegExp(search[i], 'i'), '<span data-tooltip="' + desc.toHtmlEntities() + '">' + search[i] + '</span>' );
      textWithoutExcludes = textWithoutExcludes.replace( new RegExp(search[i], 'gi'), '' );
    }
  }

  return text;

}

swig.setFilter('tooltipDishes', function (text) {

  for (var i = 0; i < dishes.length; i++) {

    text = linkDishTooltips(text, dishes[i]);

  }
  return text;
});


function compare(a,b) {
  if (a.order < b.order)
    return -1;
  if (a.order > b.order)
    return 1;
  return 0;
}

var locations_by_slug = {};
for ( var i = 0; i < locations.length; i++ ) {
  locations_by_slug[locations[i].slug] = locations[i];
}

var places = require('../maps/' + folder + '/location-category.json');


function sortDishes(a, b) {

  var visitedCountA = 0, favouriteCountA = 0, unvisitedCountA = 0;
  var visitedCountB = 0, favouriteCountB = 0, unvisitedCountB = 0;


  for ( i = 0; i < a.places.length; i++ ) {
    if (a.places[i].visited) visitedCountA++;
    else unvisitedCountA++;

    if (a.places[i].favourite) favouriteCountA++;
  }
  for ( j = 0; j < b.places.length; j++ ) {
    if (b.places[j].visited) visitedCountB++;
    else unvisitedCountB++;

    if (b.places[j].favourite) favouriteCountB++;
  }


  if (favouriteCountA < favouriteCountB) return 1;
  if (favouriteCountA > favouriteCountB) return -1;

  if (visitedCountA < visitedCountB) return 1;
  if (visitedCountA > visitedCountB) return -1;

  if (unvisitedCountA < unvisitedCountB) return 1;
  if (unvisitedCountA > unvisitedCountB) return -1;

  return 0;
}

function sortFoodIgnoreIcon(a, b) {
  return sortFood(a, b, true);
}

function sortFood(a, b, ignoreIcon) {

  if (a.visited < b.visited) return 1; // visited first
  if (a.visited > b.visited) return -1;

  if (!ignoreIcon) {
    var at = 10;
    if ( a.cuisine.toLowerCase() == "local") at = 1;
    else at = 3;

    var bt = 10;
    if ( b.cuisine.toLowerCase() == "local" ) bt = 1;
    else bt = 3;
    /*
    var at = 10;
    if ( a.cuisine.toLowerCase() == "local" && ( a.icon == "restaurant" || a.icon == "local_dining" ) ) at = 1;
    else if ( a.icon == "cake" ) at = 2;
    else if ( a.icon == "restaurant" || a.icon == "local_dining" ) at = 3;

    var bt = 10;
    if ( b.cuisine.toLowerCase() == "local" && ( b.icon == "restaurant" || b.icon == "local_dining" ) ) bt = 1;
    else if ( b.icon == "cake" ) bt = 2;
    else if ( b.icon == "restaurant" || b.icon == "local_dining" ) bt = 3;
    */

    if (at < bt) return -1;
    if (at > bt) return 1;
  }

  if (a.favourite < b.favourite) return 1;
  if (a.favourite > b.favourite) return -1;

  if ((a.rating||0) < (b.rating||0)) return 1;
  if ((a.rating||0) > (b.rating||0)) return -1;

  if ((a.images.length>0) < (b.images.length>0)) return 1;
  if ((a.images.length>0) > (b.images.length>0)) return -1;


  if (a.order < b.order) return -1;
  if (a.order > b.order) return 1;


  return 0;
}

var allFood = new Array();
for ( var location_slug in places ) {
  //var sortedFood = new Array();
  if ( places[location_slug].food ) {
    places[location_slug].food.sort(sortFood);
    for ( var i = 0; i < places[location_slug].food.length; i++ ) {
      allFood.push(places[location_slug].food[i]);
    }
  }
}
allFood.sort(sortFood);


// connect dishes to locations
for ( var i = 0; i < dishes.length; i++ ) {
  dishes[i].places = new Array();
  //for ( var location_slug in places ) {
  //for ( var j = 0; j < foodByLocation.length; j++ ) {
    //for ( var k = 0; k < places[location_slug].food.length; k++ ) {
  for ( var j = 0; j < allFood.length; j++ ) {
    var place = allFood[j];

    var search = dishes[i].search || new Array();
    search.push( dishes[i].name );

    if ( isPlaceMatch( place, search, dishes[i].search_exclude || [] ) ) dishes[i].places.push( place );

  }

  dishes[i].places.sort(sortFoodIgnoreIcon);
  //}
  //dishes[i].places = dishes[i].places.sort(compare);
}

dishes.sort(sortDishes);

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

for ( var i = 0; i < locations.length; i++ ) {
  if ( !(locations[i].slug in places) ) locations[i].nav = false;
  else {
    locations[i].lat = places[locations[i].slug].food[0].lat;
    locations[i].lng = places[locations[i].slug].food[0].lng;
  }
}

fs.writeFile('./out/' + folder + '/index.html', tpl({page: 'dishes', base: '//chrisward.co.uk/food/' + folder + '/', path: '', places: false, locations, locations_by_slug, dishes, version: 'live', css}), function(err) { } );

for ( location_slug in places ) {
  var dir = './out/' + folder + '/' + location_slug;
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }
  var p = {};
  p[location_slug] = places[location_slug];
  fs.writeFile(dir + '/index.html', tpl({page: location_slug, base: '//chrisward.co.uk/food/' + folder + '/', path: location_slug + '/', places: p, locations, locations_by_slug, dishes: false, version: 'live', css}), function(err) {} );
}
//console.log(tpl({places, locations, locations_by_slug, dishes, version: 'live', css}));
