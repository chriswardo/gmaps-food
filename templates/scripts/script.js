
$(document).ready(function() {

  var linkDefer = document.getElementsByTagName('link');
  for (var i=0; i<linkDefer.length; i++) {
  if(linkDefer[i].getAttribute('data-href')) {
  linkDefer[i].setAttribute('href',linkDefer[i].getAttribute('data-href'));
  } }

  var d = document.getElementsByTagName('iframe');
  for (var i=0; i<d.length; i++) {
  if(d[i].getAttribute('data-src')) {
  d[i].setAttribute('src',d[i].getAttribute('data-src'));
  } }

  $('nav a[href^=#]').click( function(event) {
    event.stopPropagation();
    $('.tab.is-active, nav a.is-active').removeClass('is-active');
    $('.tab' + $(this).attr('href')).addClass('is-active');
    $(this).addClass('is-active');
    $('nav').addClass('hidden-xs');

    $('header h2').html( $('.tab.is-active h2').html() ); //set the mobile heading

  });

  $('#dishes a[href^=#]').click( function(event) {
    processHash( $(this).attr('href') );
  });

  $('.filter-row > div').click( function(event) {
    $(this).parent().children().removeClass('filter-active');
    $(this).addClass('filter-active');
    $(this).closest('.tab').find('section').show();

    if ( $(this).attr('data-filter') ) {
      $(this).closest('.tab').find('section:not(.' + $(this).attr('data-filter') + ')').hide();
    }

    if ( $(this).attr('data-sort') ) {
      var sortBy = $(this).attr('data-sort');
      sortPlaces( $(this).closest('.tab').find('.sections'), sortBy );
    }

  });
  setPosters();

  $( window ).scroll(function() {
    setPosters();

  });

  function sortPlaces( sections, sortBy ) {
    sections.each( function() {
      $(this).find('section').sort(function(a,b) {
        return parseFloat($(a).data( sortBy )) - parseFloat($(b).data( sortBy ));
      }).appendTo($(this));
    });
    setPosters();
  }

  $( document ).tooltip({
    items: "[data-tooltip]",
    content: function() {
        return $( this ).attr( "data-tooltip" );
    }
  });

  var geoTimeout = false;
  function getLocation() {

    if( navigator.geolocation ) {
      if ( geoTimeout ) clearTimeout(geoTimeout);
      geoTimeout = setTimeout(function () {
        geoFail('timeout');
      }, 10000);

      navigator.geolocation.getCurrentPosition(function(position) {
        if ( geoTimeout ) clearTimeout(geoTimeout);
        setDistances(position.coords.latitude, position.coords.longitude);
      }, geoFail);

    }
    else {
      geoFail('not supported');
    }

  }
  function geoFail(error) {
    if ( geoTimeout ) clearTimeout(geoTimeout);
    $('#nearby-search').addClass('hidden');

    if ( $('#nearby-notice').hasClass('hidden') ) {
      console.log('geoFail: ' + error);
      $('#nearby-fail').removeClass('hidden');
    }
  }
  getLocation();

  function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1);
    var a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c; // Distance in km
    return d;
  }

  function deg2rad(deg) {
    return deg * (Math.PI/180)
  }

  function setDistances( lat, lng ) {
    var closest = { distance: 100000, location: '', slug: '' };
    $('.distance[data-lng][data-lat]').each(function() {
      var distance = getDistanceFromLatLonInKm(lat,lng,$(this).attr('data-lat'),$(this).attr('data-lng'));
      $(this).closest('section').attr('data-distance', distance);
      $(this).find('span').text( (Math.round( distance * 10) / 10) + ' km' );
      $(this).removeClass('hidden');

      if ( distance < closest.distance ) {
        closest.distance = distance;
        closest.location = $(this).closest('.tab').attr('data-location');
        closest.slug = $(this).closest('.tab').attr('id');
      }
    });

    if ( closest.distance < 10 ) {
      $('#nearby-search').addClass('hidden');
      $('#nearby-fail').addClass('hidden');
      $('#nearby-notice span').text(closest.location);
      $('#nearby-notice a').attr('href','#'+closest.slug);
      $('#nearby-notice').removeClass('hidden').click(function() { processHash( '#'+closest.slug ); });

      $('nav i:not(.near)').removeClass('hidden').addClass('visible-xs');
      $('nav a[href="#' + closest.slug + '"] i:not(.near)').removeClass('visible-xs').addClass('hidden');
      $('nav .near').addClass('hidden');
      $('nav a[href="#' + closest.slug + '"] .near').removeClass('hidden');

      $('.tab#'+closest.slug+' .nearby-sort').removeClass('hidden').find('input').change( function() {
        var sortBy = $(this).closest('.nearby-sort').find('input:checked').val();
        sortPlaces( $(this).closest('.tab').find('.sections'), sortBy );
      });
    }

    $('.hidden[data-sort="distance"]').removeClass('hidden');

    setTimeout(function(){
      getLocation();
    }, 30000);

  }

  function setPosters() {

    if ( $( window ).width() > 1024 ) {
      $('.poster-image').each(function() {
        var p = ($(this).offset().top - $(window).scrollTop());
        var pc = (p+$(this).height()) / ($(window).height()+$(this).height()) * 100;
        if ( pc >= 0 && pc <= 100 ) {
          pc = (75-(pc/2));
          $(this).css('background-position-y', pc+'%');
        }
      });
    }
  }

  function processHash( hash ) {
    location.hash = hash;
    var tab = hash;
    var anchor = false;
    if ( hash.indexOf('/') > 0 ) {
      tab = hash.substring(0, hash.indexOf('/'));
      anchor = hash.substring(hash.indexOf('/')+1);
    }

    $('nav a[href='+tab+']').click();


    if ( anchor ) {
      $('html, body').scrollTop( $("#"+anchor).offset().top - 60 );

    }
    else $('html, body').scrollTop(0);

    loadLazies(tab);

  }

  $('#menu-btn').click( function() {
    $('nav').toggleClass('hidden-xs');
  });

  function loadLazies( a ) {
    $(a + ' img.lazy').each( function() {
      var img = $(this).attr('data-original');
      if (img.indexOf('googleusercontent') >= 0) img = '//images.weserv.nl/?url=' + img.replace('http://','').replace('https://','');
      $(this).attr('src', img).removeClass('lazy');
    });
    $(a + ' .lazy-background').each( function() {
      var img = $(this).attr('data-original');
      if (img.indexOf('googleusercontent') >= 0) img = '//images.weserv.nl/?url=' + img.replace('http://','').replace('https://','');
      $(this).css('background-image', 'url('+img+')').removeClass('lazy-background');
    });

    setPosters();
    setTimeout(function(){
      setPosters();
    }, 1000);
  }

  if (location.hash.length > 1 ) {

    processHash(location.hash);
  }
  else {
    $('nav a[href=#dishes]').click();

    setTimeout(function(){
      loadLazies('#dishes');
    }, 500);

  }
  setTimeout(function(){
    loadLazies('');
  }, 5000);

  $( '.swipebox, .swipebox-video' ).swipebox();


  $('.poster').click( function() {
    $(this).closest('section').find('.gallery-thumbs a').first().click();
  });

});
