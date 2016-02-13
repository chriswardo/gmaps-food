
if ( process.argv.length < 3 ) {
  process.stderr.write( "Usage: " + process.argv[0] + " " + process.argv[1] + " [FOLDER]\n" );
  process.exit(1);
}
else {
  var folder = process.argv[2];
}

process.stderr.write( "Processing JSON...\n" );


var dishes = require('../maps/' + folder + '/dishes.json');
var defaultDiacriticsRemovalap = require('../diacritics.json');
const LOCATION_GROUPS = require('../maps/' + folder + '/locations.json');


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
      if ( location_group.group.indexOf(location) >= 0 && g == false ) g = location_group[field];
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


function processPlaces() {
  places.forEach( function(place,i) {
  
    places[i].location_group = "Other";
    if ( places[i].location.length > 0 ) {
      
        
      places[i].location_group = getLocationGroup( places[i].location );
      places[i].location_short = getLocationGroup( places[i].location, 'short' );
      
    }
    places[i].location_slug = getLocationSlug( places[i].location_group );
    
    
  
    places[i].cuisine = 'Local';
    places[i].links = [];
    places[i].order = i;
    places[i].slug = removeDiacritics( places[i].name ).toLowerCase().replace(/[\s\-]+/g,'-');
    //places[i][0] = i; //for sorting
    
    var images = places[i].images;
    places[i].images = [];
    
    images.forEach( function(img) {
      if ( img.indexOf('imgur.com') >= 0 ) {
        places[i].images.push( { thumb: img.replace('.jpg', 's.jpg', 'i'), medium: img.replace('.jpg', 'l.jpg', 'i'), large: img } );
      }
      else if ( img.indexOf('googleusercontent.com') >= 0 ) {
        //img = img.substr(0, img.indexOf('
        var regexp = /^(.+)(\=w[0-9]+.*)$/gi;
        var m = regexp.exec(img);
        if (m) {
          img = m[1];
          places[i].images.push( { thumb: img + '=s80-c', medium: img + '=w800', large: img + '=w1200' } );
        }
        else {
          places[i].images.push( { thumb: img, medium: img, large: img } );
        }
      }
      else {
        places[i].images.push( { thumb: img, medium: img, large: img } );
      }
      
    });
    
    places[i].name = places[i].name.replace('(not visited)','','i').trim();
    
		places[i].name.replace( /^(.+)\s*\(([^\)]+)\)$/gi, function(all, a, b) { 
		  places[i].name = a;
		  places[i].cuisine = b;
		}.bind(this) );
		
    // TODO: check this website against the other websites from the description. Maybe compare domains?
    if ( places[i].website ) places[i].links.push( { title: 'Website', url: places[i].website, icon: 'open_in_new' } );
		
  	places[i].links.push( { title: 'Google Maps', url: 'https://www.google.com/maps/place/' + places[i].lng + ',' + places[i].lat, icon: 'map' } );
		
		
		places[i].favourite = places[i].visited && ( places[i].description.toLowerCase().replace('recommended by','').replace('recommended from','').replace('recommended if','').replace('recommended dish','').replace("chef's recommendation","").indexOf('recommend') >= 0 );
		
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
		  places[i].category = "drink";
		  places[i].type = "Cafe";
		  places[i].icon = "local_cafe";
		}
		else if ( places[i].icon == "#icon-979" ) {
		  places[i].category = "drink";
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
			  var regexp = /^Address\:\s+(.+)$/gi;
        var m = regexp.exec(line);
        if (m) {
          places[i].address = m[1];
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
