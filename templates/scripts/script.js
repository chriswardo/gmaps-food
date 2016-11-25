
$(document).ready(function() {


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
      $('.sections').each( function() {
        $(this).find('section').sort(function(a,b) {
          return parseFloat($(a).data( sortBy )) - parseFloat($(b).data( sortBy ));
        }).appendTo($(this));
      });
    }
  });
  setPosters();
  
  $( window ).scroll(function() {
    setPosters();
  
  });
  
  $( document ).tooltip({
    items: "[data-tooltip]",
    content: function() {
        return $( this ).attr( "data-tooltip" );
    }
  });
  
  function getLocation() {
  
    navigator.geolocation.getCurrentPosition(function(position) {
      setDistances(position.coords.latitude, position.coords.longitude);
    });
    
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
  
    $('.distance[data-lng][data-lat]').each(function() {
      var distance = getDistanceFromLatLonInKm(lat,lng,$(this).attr('data-lat'),$(this).attr('data-lng'));
      $(this).closest('section').attr('data-distance', distance);
      $(this).find('span').text( (Math.round( distance * 10) / 10) + ' km' );
      $(this).removeClass('hidden');
    });
    
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
    
    
    loadLazies(tab);
    
  }
  
  $('#menu-btn').click( function() {
    $('nav').toggleClass('hidden-xs');
  });
  
  function loadLazies( a ) {
    $(a + ' img.lazy').each( function() {
      var img = $(this).attr('data-original');
      if (img.indexOf('googleusercontent') >= 0) img = 'http://images.weserv.nl/?url=' + img.replace('http://','').replace('https://','');
      $(this).attr('src', img).removeClass('lazy');
    });
    $(a + ' .lazy-background').each( function() {
      var img = $(this).attr('data-original');
      if (img.indexOf('googleusercontent') >= 0) img = 'http://images.weserv.nl/?url=' + img.replace('http://','').replace('https://','');
      $(this).css('background-image', 'url('+img+')').removeClass('lazy-background');
    });
    
    setPosters();
  }
  
  if (location.hash.length > 1 ) {
  
    processHash(location.hash);
  }
  else {
    $('nav a[href=#dishes]').click();
    
    loadLazies('#dishes');
  }
  setTimeout(function(){
    loadLazies('');
  }, 1000);
  
  $( '.swipebox, .swipebox-video' ).swipebox();
  
  
  $('.poster').click( function() {
    $(this).closest('section').find('.gallery-thumbs a').first().click();
  });
  
});