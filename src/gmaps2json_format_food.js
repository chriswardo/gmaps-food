"use strict";
let folder;
if (process.argv.length < 3) {
  process.stderr.write("Usage: " + process.argv[0] + " " + process.argv[1] + " [FOLDER]\n");
  process.exit(1);
} else {
  folder = process.argv[2].toLowerCase();
}

process.stderr.write("Processing JSON...\n");


const dishes = require('../configs/' + folder + '/dishes.json');
const defaultDiacriticsRemovalap = require('./diacritics.json');
const LOCATION_GROUPS = require('../configs/' + folder + '/locations.json');



var stdin = process.stdin,
    stdout = process.stdout,
    inputChunks = [],
    places = [];

stdin.resume();
stdin.setEncoding('utf8');

stdin.on('data', function (chunk) {
    inputChunks.push(chunk);
});

stdin.on('end', function () {
  var inputJSON = inputChunks.join('');

  places = JSON.parse(inputJSON);
  processPlaces();

});

var dish_names = [];
dishes.forEach( function(dish) {
  if ( dish.search ) {
    for ( var i=0; i < dish.search.length; i++ ) {
      dish_names.push( dish.search[i] );
    }
  }
  else {
    dish_names.push( dish.name );
  }
});
// TODO: Sort by string length


// For making slugs

var diacriticsMap = {};
for (var i=0; i < defaultDiacriticsRemovalap.length; i++){
    var letters = defaultDiacriticsRemovalap[i].letters;
    for (var j=0; j < letters.length ; j++){
        diacriticsMap[letters[j]] = defaultDiacriticsRemovalap[i].base;
    }
}
function removeDiacritics (str) {
    return str.replace(/[^\u0000-\u007E]/g, function(a){
       return diacriticsMap[a] || a;
    });
}

function isUrlValid(url) {
  return /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(url);
}


function getLocationGroup( locations, field ) {
  field = field || 'name';
  var g = false;
  LOCATION_GROUPS.forEach( function( location_group,i ) {
    if( typeof location_group === 'string' ) location_group = [ location_group ]; //make it an array
    locations.forEach( function( location, j ) {
      if ( typeof location_group.group === 'string' ) location_group.group = [ location_group.group ];
      for ( var k = 0; k < location_group.group.length; k++ ) {
        if ( location_group.group[k].indexOf(location) >= 0 && g === false ) g = location_group[field];
      }
    });
  });

  return g || "Other";
}


function getLocationSlug( location_name ) {
  var slug = "other";
  LOCATION_GROUPS.forEach( function( location_group,i ) {
    if ( location_name == location_group.name ) slug = location_group.slug;
  });

  return slug;
}

function formatHoursFromString( hours ) {
  hours = hours.split(",").map(function(e){return e.trim();});

  var daily = [];
  hours.forEach( function( hour ) {
    var regexp = /^([^\:]+)\:\s+(.+)$/gi;
    var m = regexp.exec(hour);
    if (m) {
      var day = m[1];
      var time = m[2].replace(/\s*PM/gi, 'PM').replace(/\s*AM/gi, 'AM').replace(/:00/g,'');
      daily.push( { day: day, time: time } );
    }
    else {
      daily.push({ time: hour.replace(/\s*PM/gi, 'PM').replace(/\s*AM/gi, 'AM').replace(/:00/g,'') });
    }
  });
  return daily;
}

function formatHoursFromGoogle( hours ) {
  var daily = [];
  hours.forEach( function( hour ) {
    var regexp = /^(.+)\:\s+(.+)$/gi;
    var m = regexp.exec(hour);
    if (m) {
      var day = m[1].substr(0,3);
      var time = m[2].replace(/ PM/g, 'PM').replace(/ AM/g, 'AM').replace(/:00/g,'');
      daily.push( { day: day, time: time } );
    }
  });
  var daily_groups = [];
  var current_time = '';
  var current_days = [];
  //console.log(daily);
  var last_day;
  daily.forEach( function( d ) {
    //console.log( 'time = ' + d.time + ', day = ' + d.day );
    if ( d.time != current_time && current_time != '' ) {
      //change
      if ( current_days.length == 1 ) daily_groups.push( { day: current_days[0], time: current_time } );
      else daily_groups.push( { day: current_days[0] + ' - ' + current_days[ current_days.length-1 ], time: current_time } );

      current_days = [];
    }
    current_days.push( d.day );
    current_time = d.time;
    last_day = d;

  });
  if ( current_days.length == 1 ) daily_groups.push( { day: current_days[0], time: current_time } );
  else daily_groups.push( { day: current_days[0] + ' - ' + current_days[ current_days.length-1 ], time: current_time } );

  return daily_groups;

}

function formatAddress( address ) {

  address = address.replace(/,,/g, ",").replace(/, ,/g, ",");

  if ( folder == "vietnam" ) {
    // TODO: Hem

  }

  return address;

}



function processPlaces() {
  places.forEach( function(place,i) {

    places[i].location_group = "Other";
    if ( places[i].location.length > 0 ) {

      let locs = [ places[i].folder ].concat(places[i].location);
      places[i].location_group = getLocationGroup( locs );
      places[i].location_short = getLocationGroup( locs, 'short' );

    }
    places[i].location_slug = getLocationSlug( places[i].location_group );



    places[i].cuisine = 'Local';
    places[i].links = [];
    places[i].order = i;
    places[i].slug = removeDiacritics( places[i].name ).toLowerCase().replace(')','').replace('(','').replace(/[\s\-]+/g,'-');
    //places[i][0] = i; //for sorting

    places[i].images = places[i].images.filter( (img) => img.length > 0 );
    /*
    var images = places[i].images;
    places[i].images = [];

    images.forEach( function(img) {
      process.stderr.write('img = ' + img);
      img = img.replace('https://','//').replace('http://','//');
      if ( img.indexOf('imgur.com') >= 0 ) {
        places[i].images.push( { thumb: img.replace('.jpg', 's.jpg', 'i'), medium: img.replace('.jpg', 'l.jpg', 'i'), large: img } );
      }
      else if ( img.indexOf('googleusercontent.com') >= 0 ) {
        var regexp = /^(.+)(\=w[0-9]+.*)$/gi;
        var m = regexp.exec(img);
        if (m) {
          img = m[1];
        }
        places[i].images.push( { thumb: img + '=s80-c', medium: img + '=w800', large: img + '=w1200' } );
      }
      else if ( img.indexOf('contentful.com') >= 0 ) {
        var regexp = /^(.+)(\?.*)$/gi;
        var m = regexp.exec(img);
        if (m) {
          img = m[1];
        }
        places[i].images.push( { thumb: img + '?fm=jpg&q=70&h=80', medium: img + '?fm=jpg&q=70&w=800', large: img + '?fm=jpg&q=70&w=1200' } );
      }
      else {
        places[i].images.push( { thumb: img, medium: img, large: img } );
      }

    });*/

    places[i].name = places[i].name.replace('(not visited)','','i').trim();

    places[i].name.replace( /^(.+)\s*\(([^\)]+)\)$/gi, function(all, a, b) {
      places[i].name = a;
      places[i].cuisine = b;
    }.bind(this) );



    // TODO: check this website against the other websites from the description. Maybe compare domains?
    if ( places[i].website ) places[i].links.push( { title: 'Website', url: places[i].website, icon: 'open_in_new' } );

    places[i].links.push( { title: 'Map', url: 'https://www.google.com/maps/place/' + places[i].lng + ',' + places[i].lat, icon: 'map' } );


    places[i].favourite = places[i].visited && ( places[i].description.toLowerCase().replace('recommended by','').replace('recommended from','').replace('recommended if','').replace('recommended dish','').replace("chef's recommendation","").indexOf('recommended') >= 0 );

    places[i].category = "other";
    if ( places[i].icon == "#icon-1075" ) {
      places[i].category = "food";
      places[i].type = "Street Food";
      places[i].icon = "local_dining";
    }
    else if ( places[i].icon == "#icon-1087" ) {
      places[i].category = "food";
      places[i].type = "Dessert";
      places[i].icon = "cake";
    }
    else if ( places[i].icon == "#icon-1085" ) {
      places[i].category = "food";
      places[i].type = "Restaurant";
      places[i].icon = "restaurant";
    }
    else if ( places[i].icon == "#icon-991" ) {
      places[i].category = "food";
      places[i].type = "Cafe";
      places[i].icon = "local_cafe";
    }
    else if ( places[i].icon == "#icon-979" ) {
      places[i].category = "food";
      places[i].type = "Bar";
      places[i].icon = "local_bar";
    }
    else if ( places[i].icon == "#icon-1035" ) {
      places[i].category = "accommodation";
      places[i].type = "Accommodation";
      places[i].icon = "hotel";
    }
    else if ( places[i].icon == "#icon-1001" ) {
      places[i].category = "sights";
      places[i].type = "Cinema";
      places[i].icon = "local_movies";
    }
    else if ( places[i].icon == "#icon-1095" ) {
      places[i].category = "sights";
      places[i].type = "Shopping";
      places[i].icon = "shopping_basket";
    }
    else if ( places[i].icon == "#icon-1289" ||  places[i].icon == "#icon-1317" ) {
      places[i].category = "sights";
      places[i].type = "Museum/Temple";
      places[i].icon = "account_balance";
    }
    else if ( places[i].icon == "#icon-993" || places[i].icon == "#icon-1283" ) {
      places[i].category = "sights";
      places[i].type = "Point of Interest";
      places[i].icon = "local_see";
    }
    else if ( places[i].icon == "#icon-967" ) {
      places[i].type = "ATM";
      places[i].icon = "local_atm";
    }
    else if ( places[i].icon == "#icon-1395" ) {
      places[i].category = "sights";
      places[i].type = "Swimming";
      places[i].icon = "pool";
    }
    else if ( places[i].icon == "#icon-1355" ) {
      places[i].category = "sights";
      places[i].type = "Beach";
      places[i].icon = "beach_access";
    }
    else if ( places[i].icon == "#icon-1371" ) {
      places[i].category = "sights";
      places[i].type = "Walk";
      places[i].icon = "directions_walk";
    }
    else {
      places[i].type = "Other";
      places[i].icon = "place";
    }

    if ( places[i].hours ) places[i].hours = formatHoursFromGoogle( places[i].hours );
    if (places[i].address) places[i].address = formatAddress( places[i].address );

    var desc_lines = [];
    //var images = [];
    places[i].description.split('<br>').forEach( function(line,j) {

      //Find images
      var regexp = /<img[^>]+src="?([^"\s]+)"?[^>]*\/>/g;
      var m = regexp.exec(line);

      if (m) {
        //images.push(m[1]);
        line = line.replace(m[0],"");
      }


      var link_title = false;

      var regexp = /^(.+)\:\s+(http.+)$/gi;
      var m = regexp.exec(line);
      if (m) {
        link_title = m[1];
        line = m[2];
      }

      if ( isUrlValid( line ) ) {
        if ( line.indexOf("foody.vn") > -1 ) {
          places[i].links.push( { title: link_title || 'Foody.vn', url: line, icon: 'open_in_new' } );
        }
        else if ( line.indexOf("foursquare.") > -1 ) {
          places[i].links.push( { title: link_title || 'Foursquare', url: line, icon: 'open_in_new' } );
        }
        else if ( line.indexOf("tripadvisor.") > -1 ) {
          places[i].links.push( { title: link_title || 'TripAdvisor', url: line, icon: 'open_in_new' } );
        }
        else if ( line.indexOf("foodadvisor.") > -1 ) {
          places[i].links.push( { title: link_title || 'FoodAdvisor', url: line, icon: 'open_in_new' } );
        }
        else if ( line.indexOf("agoda.") > -1 ) {
          if ( line.indexOf("cid=1726803") < 0 ) line += "?cid=1726803";
          places[i].links.push( { title: link_title || 'Agoda', url: line, icon: 'open_in_new' } );
        }
        else if ( line.indexOf("travelfish.") > -1 ) {
          places[i].links.push( { title: link_title || 'Travelfish', url: line, icon: 'open_in_new' } );
        }
        else if ( line.indexOf("facebook.") > -1 ) {
          places[i].links.push( { title: link_title || 'Facebook', url: line, icon: 'open_in_new' } );
        }
        else if ( line.indexOf("youtube.") > -1 ) {
          places[i].links.push( { title: link_title || 'Video', url: line, icon: 'ondemand_video' } );
        }
        else {
          places[i].links.push( { title: link_title || 'Website', url: line, icon: 'open_in_new' } );
        }


      }
      else if ( line.length > 0 ) {
        //Get address
        var regexp = /^([^\:]+)\:\s+(.+)$/gi;
        var m = regexp.exec(line);
        if (m) {
          if ( m[1].toLowerCase() == "address" ) places[i].address = m[2];
          else if ( m[1].toLowerCase() == "hours" || m[1].toLowerCase() == "open" ) places[i].hours = formatHoursFromString( m[2] );
          else if ( m[1].toLowerCase() == "update" ) desc_lines.push( '<p><i class="material-icons">new_releases</i> ' + line + '</p>' );
          else if ( m[1].toLowerCase() == "note" ) desc_lines.push( '<p><i class="material-icons">speaker_notes</i> ' + line + '</p>' );
          else if ( m[1].toLowerCase() == "tip" ) desc_lines.push( '<p><i class="material-icons">lightbulb_outline</i> ' + line + '</p>' );
          else if ( m[1].toLowerCase() == "last visit" || m[1].toLowerCase() == "last visited" ) places[i].last_visit = [ m[2] ];
          else if ( m[1].toLowerCase() == "rating" || m[1].toLowerCase() == "score" ) {
            var regscore = /^\s*([0-9\.]+)\s*\/\s*([0-9]+)\s*$/gi;
            var score = regscore.exec(m[2]);
            if (score) {
              places[i].rating = parseFloat(score[1])/parseFloat(score[2])*10;
              places[i].ratingStars = parseInt(parseFloat(score[1])/parseFloat(score[2])*10)/2;
            }
          }
          else desc_lines.push( "<p>" + line + "</p>" );
        }
        else {
          //line = this.linkGlossary( line );
          desc_lines.push( "<p>" + line + "</p>" );
        }
      }
    }.bind(this));
    places[i].description = desc_lines.join("");


    //Food time!
    places[i].dishes = [];
    dish_names.forEach( function(dish) {
      if ( places[i].name.indexOf( dish ) >= 0 || places[i].description.indexOf( dish ) >= 0 ) { //also place_name?
        if ( dish.length > 0 ) places[i].dishes.push(dish);
      }
    });


  } );


  stdout.write( JSON.stringify( places ) );
}





/*
bun thit nuong (also: bun kho)
bo ne
tau hu / dau hu
banh mi
banh mi op la
banh trang nuong
com tam
bun cha
cha ca
bo la lot
hu tieu nam vang
ca kho to
pho
pho chua
banh gio
bun rieu
bun bo hue
banh cuon (very similar to: banh uot)
banh xeo
banh ran / banh cam
goi du du
lau (ca)
banh bao
banh beo
cao lau (hoi an)
com ga xoi mo
banh tam bi
bot chien
ha cao
oc
bun dau
xoi mit
kem
moon cake
sinh to
banh khot
sop cua
banh canh cua
xoi ga
banh trang tron
chao vit
com binh dan
me xung
banh flan (also: kem flan)
com ga
white rose
mango cake
banh loc


canh = soup



*/
