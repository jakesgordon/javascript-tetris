
var slow = {
    name :  'slow',
    speed : 0.8
}
var normal = {
    name :  'normal',
    speed : 0.6
}
var fast = {
    name :  'fast',
    speed : 0.4
}
var insane = {
    name :  'insane',
    speed : 0.2
}

var levels = [slow, normal, fast, insane];

var indice = 1;

function chargerPage() {
  $('#tetris').addClass('hide');
  $('#highscore').addClass('hide');
  
  level(indice);
}

function prec() {
  var a = levels[i];

  indice -= 1;
  level(indice);
  
}


function suiv() {
  if (levels.length);
  indice += 1;
  level(indice);
}

function level(i) {
  if (indice == 0) { $('.prec').addClass('hide'); }
  else { $('.prec').removeClass('hide'); }

  if (indice == levels.length - 1) { $('.suiv').addClass('hide'); }
  else { $('.suiv').removeClass('hide'); }
  
  $('.choice').html(levels[i].name);
}