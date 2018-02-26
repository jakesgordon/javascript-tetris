
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

function getScore(){
  return score; 
}


function scookie(nom, valeur, jours) {
  // Le nombre de jours est spécifié
          if (jours) {
  var date = new Date();
                  // Converti le nombre de jour en millisecondes
  date.setTime(date.getTime()+(jours*24*60*60*1000));
  var expire = "; expire="+date.toGMTString();
  }
          // Aucune valeur de jours spécifiée
  else var expire = "";
  document.cookie = nom+"="+valeur+expire+"; path=/";
  }
function gcookie(nom) {
  // Ajoute le signe égale virgule au nom
          // pour la recherche
          var nom2 = nom + "=";
          // Array contenant tous les cookies
  var arrCookies = document.cookie.split(';');
          // Cherche l'array pour le cookie en question
  for(var i=0;i < arrCookies.length;i++) {
  var a = arrCookies[i];
  // Si c'est un espace, enlever
                  while (a.charAt(0)==' ') {
                    a = a.substring(1,a.length);
                  }
  if (a.indexOf(nom2) == 0) {
                    return nom + " : " + a.substring(nom2.length,a.length);
                  }
  }
          // Aucun cookie trouvé
  return null;
  }

function eraseCookie(name) {
	createCookie(name,"",-1);
}