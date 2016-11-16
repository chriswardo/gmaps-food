
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
    
  }
  
  $('#menu-btn').click( function() {
    $('nav').toggleClass('hidden-xs');
  });
  
  if (location.hash.length > 1 ) {
  
    processHash(location.hash);
    $(location.hash + ' img.lazy').each( function() {
      $(this).attr('src', $(this).attr('data-original')).removeClass('lazy');
    });
  }
  else {
    $('nav a[href=#dishes]').click();
    
    $('#dishes img.lazy').each( function() {
      $(this).attr('src', $(this).attr('data-original')).removeClass('lazy');
    });
  }
  setTimeout(function(){
  
    $('img.lazy').each( function() {
      $(this).attr('src', $(this).attr('data-original')).removeClass('lazy');
    });
  }, 1000);
  
  $( '.swipebox, .swipebox-video' ).swipebox();
  
  
  $('.poster').click( function() {
    $(this).closest('section').find('.gallery-thumbs a').first().click();
  });
  
});