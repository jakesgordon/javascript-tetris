// -------------------------------------------------------------------------
// base helper methods
// -------------------------------------------------------------------------

var slow = {
    name: 'slow',
    speed: 0.8
}
var normal = {
    name: 'normal',
    speed: 0.6
}
var fast = {
    name: 'fast',
    speed: 0.3
}
var insane = {
    name: 'insane',
    speed: 0.1
}

var levels = [slow, normal, fast, insane];

var indice = 1;

var score1 = {
    name: 'Dadju',
    score: 4543
}
var score2 = {
    name: 'Lartiste',
    score: 3245
}
var score3 = {
    name: 'RedHot',
    score: 1320
}
var score4 = {
    name: 'Bester',
    score: 834
}
var score5 = {
    name: 'Stikar',
    score: 548
}

var tabScore = [score2, score4, score3, score1, score5];

function get(id) {
    return document.getElementById(id);
}

function hide(id) {
    get(id).style.visibility = 'hidden';
}

function show(id) {
    get(id).style.visibility = null;
}

function html(id, html) {
    get(id).innerHTML = html;
}

function timestamp() {
    return new Date().getTime();
}

function random(min, max) {
    return (min + (Math.random() * (max - min)));
}

function randomChoice(choices) {
    return choices[Math.round(random(0, choices.length - 1))];
}

if (!window.requestAnimationFrame) { // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    window.requestAnimationFrame = window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback, element) {
        window.setTimeout(callback, 1000 / 60);
    }
}

// -------------------------------------------------------------------------
// game constants
// -------------------------------------------------------------------------

var KEY = {
        ESC: 27,
        //SPACE: 32,
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40
    },
    DIR = {
        UP: 0,
        RIGHT: 1,
        DOWN: 2,
        LEFT: 3,
        MIN: 0,
        MAX: 3
    },
    stats = new Stats(),
    canvas = get('canvas'),
    ctx = canvas.getContext('2d'),
    ucanvas = get('upcoming'),
    uctx = ucanvas.getContext('2d'),
    speed = {
        start: levels[indice].speed, // vitesse de départ des blocs
        decrement: 0.005, // a chaque fois que le joueur detruit une row
        // le jeu s'accélere de speed.start - (speed.decrement * row)
        min: 0.1 // vitesse maximum des blocs
    }, // how long before piece drops by 1 row (seconds)
    nx = 10, // width of tetris court (in blocks)
    ny = 20, // height of tetris court (in blocks)
    nu = 5; // width/height of upcoming preview (in blocks)

// -------------------------------------------------------------------------
// game variables (initialized during reset)
// -------------------------------------------------------------------------

var dx,
    dy, // pixel size of a single tetris block
    blocks, // 2 dimensional array (nx*ny) representing tetris court - either empty block or occupied by a 'piece'
    actions, // queue of user actions (inputs)
    playing, // true|false - game is in progress
    pause, // if the game is in pause or not
    dt, // time since starting this game
    current, // the current piece
    next, // the next piece
    score, // the current score
    vscore, // the currently displayed score (it catches up to score in small chunks - like a spinning slot machine)
    rows, // number of completed rows in the current game
    step; // how long before current piece drops by 1 row

// -------------------------------------------------------------------------
// tetris pieces
//
// blocks: each element represents a rotation of the piece (0, 90, 180, 270)
// each element is a 16 bit integer where the 16 bits represent         a 4x4
// set of blocks, e.g. j.blocks[0] = 0x44C0
//
//             0100 = 0x4 << 3 = 0x4000             0100 = 0x4 << 2 = 0x0400
// 1100 = 0xC << 1 = 0x00C0             0000 = 0x0 << 0 = 0x0000
// ------                               0x44C0
//
//-------------------------------------------------------------------------

var i = {
    size: 4,
    blocks: [
        0x0F00, 0x2222, 0x00F0, 0x4444
    ],
    color: '#45aaf2', // cyan
};
var j = {
    size: 3,
    blocks: [
        0x44C0, 0x8E00, 0x6440, 0x0E20
    ],
    color: '#3867d6' // blue
};
var l = {
    size: 3,
    blocks: [
        0x4460, 0x0E80, 0xC440, 0x2E00
    ],
    color: '#fd9644' //orange
};
var o = {
    size: 2,
    blocks: [
        0xCC00, 0xCC00, 0xCC00, 0xCC00
    ],
    color: '#fed330' //yellow
};
var s = {
    size: 3,
    blocks: [
        0x06C0, 0x8C40, 0x6C00, 0x4620
    ],
    color: '#26de81' //green
};
var t = {
    size: 3,
    blocks: [
        0x0E40, 0x4C40, 0x4E00, 0x4640
    ],
    color: '#a55eea' //purple
};
var z = {
    size: 3,
    blocks: [
        0x0C60, 0x4C80, 0xC600, 0x2640
    ],
    color: '#fc5c65' //red
};

// ------------------------------------------------ do the bit manipulation and
// iterate through each occupied block (x,y) for a given piece
// ------------------------------------------------
function eachblock(type, x, y, dir, fn) {
    var bit,
        result,
        row = 0,
        col = 0,
        blocks = type.blocks[dir];
    for (bit = 0x8000; bit > 0; bit = bit >> 1) {
        if (blocks & bit) {
            fn(x + col, y + row);
        }
        if (++col === 4) {
            col = 0;
            ++row;
        }
    }
}

// ----------------------------------------------------- check if a piece can
// fit into a position in the grid
// -----------------------------------------------------
function occupied(type, x, y, dir) {
    var result = false
    eachblock(type, x, y, dir, function (x, y) {
        if ((x < 0) || (x >= nx) || (y < 0) || (y >= ny) || getBlock(x, y)) 
            result = true;
        }
    );
    return result;
}

function unoccupied(type, x, y, dir) {
    return !occupied(type, x, y, dir);
}

// ----------------------------------------- start with 4 instances of each
// piece and pick randomly until the 'bag is empty'
// -----------------------------------------
var pieces = [];

function randomPiece() {
    if (pieces.length == 0) 
        pieces = [
            i,
            i,
            i,
            i,
            j,
            j,
            j,
            j,
            l,
            l,
            l,
            l,
            o,
            o,
            o,
            o,
            s,
            s,
            s,
            s,
            t,
            t,
            t,
            t,
            z,
            z,
            z,
            z
        ];
    var type = pieces.splice(random(0, pieces.length - 1), 1)[0];
    return {
        type: type,
        dir: DIR.UP,
        x: Math.round(random(0, nx - type.size)),
        y: 0
    };
}

function showStats() {
    stats.domElement.id = 'stats';
    get('menu').appendChild(stats.domElement);
}

function addEvents() {
    document.addEventListener('keydown', keydown, false);
    window.addEventListener('resize', resize, false);

    $('#play').click(function () {
        showHomeMenu();
        play();
    });

    $('#highscore-link').click(function () {
        showHighscore();
    });

    $('#back-home').click(function () {
        showHighscore();
    });

    $("#reprendre").click(function () {
        resume();
    });
    $("#abandonner").click(function () {
        resume();
        lose();
        showHomeMenu();
    })
    $("#retourMenu").click(function () {
        $("#menuLose")
            .fadeOut("fast", function () {
                showHomeMenu();

            });
    });
    $("#recommencer").click(function () {
        $("#menuLose")
            .fadeOut("fast", function () {
                play();
            });
    });

}

function resize(event) {
    canvas.width = canvas.clientWidth; // set canvas logical size equal to its physical size
    canvas.height = canvas.clientHeight; // (ditto)
    ucanvas.width = ucanvas.clientWidth;
    ucanvas.height = ucanvas.clientHeight;
    dx = canvas.width / nx; // pixel size of a single tetris block
    dy = canvas.height / ny; // (ditto)
    invalidate();
    invalidateNext();
}

function keydown(ev) {
    var handled = false;
    if (playing) {
        switch (ev.keyCode) {
            case KEY.LEFT:
                actions.push(DIR.LEFT);
                handled = true;
                break;
            case KEY.RIGHT:
                actions.push(DIR.RIGHT);
                handled = true;
                break;
            case KEY.UP:
                actions.push(DIR.UP);
                handled = true;
                break;
            case KEY.DOWN:
                actions.push(DIR.DOWN);
                handled = true;
                break;
            case KEY.ESC:
                resume();
                handled = true;
                break;
        }
    }
    /* else if (ev.keyCode == KEY.SPACE) {
           play();
           handled = true;
       } */
    if (handled) 
        ev.preventDefault(); // prevent arrow keys from scrolling the page (supported in IE9+ and all other browsers)
    }

// -------------------------------------------------------------------------
// GAME LOGIC
// -------------------------------------------------------------------------

function setSpeed() {
    speed.start = levels[indice].speed;
}
function play() {
    setSpeed();
    reset();
    playing = true;
}

// fonction pause
function resume() {
    if (pause) {
        $("#menuResume")
            .fadeOut("fast", function () {
                // Animation complete
            });
        pause = false;
    } else {
        $("#menuResume")
            .fadeIn("fast", function () {
                // Animation complete
            });
        pause = true;
    }
}

function lose() {

    if (getHighScorePlayer().score > score) {
        $('#save-score').addClass('hide');
    } else {
        $('#save-score').removeClass('hide');
    }
    $('#score-player').html(score);
    setVisualScore();
    pause = false;
    playing = false;
}

function showLoseMenu() {
    $("#menuLose")
        .fadeIn("fast", function () {
            // Animation complete
        });
}
function showHomeMenu() {
    $('#tetris').toggleClass('hide');
    $('#home').toggleClass('hide');
    $('#tetris').toggleClass('tetris-container');
}

function showHighscore() {
    $('#highscore').toggleClass('hide');
    $('#home').toggleClass('hide');
}

function setVisualScore(n) {
    vscore = n || score;
    invalidateScore();
}

function setScore(n) {
    score = n;
    setVisualScore(n);
}

function addScore(n) {
    score = score + n;
}

function clearScore() {
    setScore(0);
}

function clearRows() {
    setRows(0);
}

function setRows(n) {
    rows = n;
    step = Math.max(speed.min, speed.start - (speed.decrement * rows));
    invalidateRows();
}

function addRows(n) {
    setRows(rows + n);
}

function getBlock(x, y) {
    return (blocks && blocks[x]
        ? blocks[x][y]
        : null);
}

function setBlock(x, y, type) {
    blocks[x] = blocks[x] || [];
    blocks[x][y] = type;
    invalidate();
}

function clearBlocks() {
    blocks = [];
    invalidate();
}

function clearActions() {
    actions = [];
}

function setCurrentPiece(piece) {
    current = piece || randomPiece();
    invalidate();
}

function setNextPiece(piece) {
    next = piece || randomPiece();
    invalidateNext();
}

function reset() {
    dt = 0;
    clearActions();
    clearBlocks();
    clearRows();
    clearScore();
    setCurrentPiece(next);
    setNextPiece();
}

function update(idt) {
    if (playing) {
        if (!pause) {
            if (vscore < score) 
                setVisualScore(vscore + 1);
            handle(actions.shift());
            dt = dt + idt;
            if (dt > step) {
                dt = dt - step;
                drop();
            }
        }

    }
}

function handle(action) {
    switch (action) {
        case DIR.LEFT:
            move(DIR.LEFT);
            break;
        case DIR.RIGHT:
            move(DIR.RIGHT);
            break;
        case DIR.UP:
            rotate();
            break;
        case DIR.DOWN:
            drop();
            break;
    }
}

function move(dir) {
    var x = current.x,
        y = current.y;
    switch (dir) {
        case DIR.RIGHT:
            x = x + 1;
            break;
        case DIR.LEFT:
            x = x - 1;
            break;
        case DIR.DOWN:
            y = y + 1;
            break;
    }
    if (unoccupied(current.type, x, y, current.dir)) {
        current.x = x;
        current.y = y;
        invalidate();
        return true;
    } else {
        return false;
    }
}

function rotate() {
    var newdir = (current.dir == DIR.MAX
        ? DIR.MIN
        : current.dir + 1);
    if (unoccupied(current.type, current.x, current.y, newdir)) {
        current.dir = newdir;
        invalidate();
    }
}

function drop() {
    if (!move(DIR.DOWN)) {
        addScore(10);
        dropPiece();
        removeLines();
        setCurrentPiece(next);
        setNextPiece(randomPiece());
        clearActions();
        if (occupied(current.type, current.x, current.y, current.dir)) {
            lose();
            showLoseMenu();
        }
    }
}

function dropPiece() {
    eachblock(current.type, current.x, current.y, current.dir, function (x, y) {
        setBlock(x, y, current.type);
    });
}

function removeLines() {
    var x,
        y,
        complete,
        n = 0;
    for (y = ny; y > 0; --y) {
        complete = true;
        for (x = 0; x < nx; ++x) {
            if (!getBlock(x, y)) 
                complete = false;
            }
        if (complete) {
            removeLine(y);
            y = y + 1; // recheck same line
            n++;
        }
    }
    if (n > 0) {
        addRows(n);
        addScore(100 * Math.pow(2, n - 1)); // 1: 100, 2: 200, 3: 400, 4: 800
    }
}

function removeLine(n) {
    var x,
        y;
    for (y = n; y >= 0; --y) {
        for (x = 0; x < nx; ++x) 
            setBlock(x, y, (y == 0)
                ? null
                : getBlock(x, y - 1));
        }
    }

// -------------------------------------------------------------------------
// RENDERING
// -------------------------------------------------------------------------

var invalid = {};

function invalidate() {
    invalid.court = true;
}

function invalidateNext() {
    invalid.next = true;
}

function invalidateScore() {
    invalid.score = true;
}

function invalidateRows() {
    invalid.rows = true;
}

function draw() {
    ctx.save();
    ctx.lineWidth = .8;
    ctx.translate(-0.1, 0.1); // for crisp 1px black lines
    ctx.strokeStyle = "#fff";
    drawCourt();
    drawNext();
    drawScore();
    drawRows();
    ctx.restore();
}

function drawCourt() {
    if (invalid.court) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (playing) 
            drawPiece(ctx, current.type, current.x, current.y, current.dir);
        var x,
            y,
            block;
        for (y = 0; y < ny; y++) {
            for (x = 0; x < nx; x++) {
                if (block = getBlock(x, y)) 
                    drawBlock(ctx, x, y, block.color);
                }
            }
        ctx.strokeRect(0, 0, nx * dx - 1, ny * dy - 1); // court boundary
        invalid.court = false;
    }
}

function drawNext() {
    if (invalid.next) {
        var padding = (nu - next.type.size) / 2; // half-arsed attempt at centering next piece display
        uctx.save();
        uctx.translate(1, 1);
        uctx.strokeStyle = "#fff";
        uctx.clearRect(0, 0, nu * dx, nu * dy);
        drawPiece(uctx, next.type, padding, padding, next.dir);
        uctx.strokeStyle = 'white';
        uctx.strokeRect(6, 6, nu * dx - 1, nu * dy - 1);
        uctx.restore();
        invalid.next = false;
    }
}

function drawScore() {
    if (invalid.score) {
        html('score', ("00000" + Math.floor(vscore)).slice(-5));
        invalid.score = false;
    }
}

function drawRows() {
    if (invalid.rows) {
        html('rows', rows);
        invalid.rows = false;
    }
}

function drawPiece(ctx, type, x, y, dir) {
    eachblock(type, x, y, dir, function (x, y) {
        drawBlock(ctx, x, y, type.color);
    });
}

function drawBlock(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * dx, y * dy, dx, dy);
    ctx.strokeRect(x * dx, y * dy, dx, dy)
}

//
// Audio
//
function playAudio() {
    var music = $('#sound')[0];
    if (music.paused) {
        music.play();
        pButton.className = "";
        pButton.className = "pause";
    } else {
        music.pause();
        pButton.className = "";
        pButton.className = "play";
    }
}

var slow = {
    name: 'slow',
    speed: 0.8
}
var normal = {
    name: 'normal',
    speed: 0.6
}
var fast = {
    name: 'fast',
    speed: 0.3
}
var insane = {
    name: 'insane',
    speed: 0.1
}

var levels = [slow, normal, fast, insane];

var indice = 1;

var score1 = {
    name: 'Dadju',
    score: 4543
}
var score2 = {
    name: 'Lartiste',
    score: 3245
}
var score3 = {
    name: 'RedHot',
    score: 1320
}
var score4 = {
    name: 'Bester',
    score: 834
}
var score5 = {
    name: 'Stikar',
    score: 548
}

var tabScore = [score2, score4, score3, score1, score5];

function chargerPage() {
    $('#tetris').addClass('hide');

    $('.choice').html(levels[indice].name);

    if (getHighScorePlayer() != "") {
        tabScore.push(getHighScorePlayer());
        document
            .getElementById('scorePlayer')
            .value = getCookie('NamePlayer');
    }

    $('#highscore-cookie').html(getHighScore());

    $('#highscore-player').html(getHighScorePlayer().score);

}

function prec() {
    var a = levels[i];

    indice -= 1;
    level(indice);

}

function suiv() {
    if (levels.length) 
    ;
    indice += 1;
    level(indice);
}

function level(i) {
    if (indice == 0) {
        $('.prec').addClass('hide-opacity');
    } else {
        $('.prec').removeClass('hide-opacity');
    }

    if (indice == levels.length - 1) {
        $('.suiv').addClass('hide-opacity');
    } else {
        $('.suiv').removeClass('hide-opacity');
    }

    $('.choice')
        .fadeOut(function () {
            $(this)
                .text(levels[i].name)
                .fadeIn();
        });
}

function getScore() {
    return score;
}

function getHighScorePlayer() {

    if (getCookie('NamePlayer') && getCookie('ScorePlayer')) {
        return scorePlayer = {
            name: getCookie('NamePlayer'),
            score: getCookie('ScorePlayer')
        }
    } else {
        return "";
    }
}

function getHighScore() {

    var tab_en_ordre = false;
    var taille = tabScore.length;
    while (!tab_en_ordre) {
        tab_en_ordre = true;
        for (var i = 0; i < taille - 1; i++) {
            if (tabScore[i].score < tabScore[i + 1].score) {
                temp = tabScore[i];
                tabScore[i] = tabScore[i + 1];
                tabScore[i + 1] = temp;
                tab_en_ordre = false;
            }
        }
        taille--;
    }

    var listeScore = "";
    for (var i = 0; i < tabScore.length; i++) {
        if (getCookie("NamePlayer") == tabScore[i].name) {
            listeScore += "<span class='highscore-playercookie'><span class='highscore-playercookie-name'>" + tabScore[i].name + "</span>: <span class='highscore-playercookie-score'>" + tabScore[i].score + "</span></span> <br>";
        } else {
            listeScore += "<span class='highscore-player-name'>" + tabScore[i].name + "</span> : <span class='highscore-player-score'>" + tabScore[i].score + "</span> <br>";
        }
    }

    return listeScore;
}

function createCookie(nom, valeur, jours) {
    // Le nombre de jours est spécifié
    if (jours) {
        var date = new Date();
        // Converti le nombre de jour en millisecondes
        date.setTime(date.getTime() + (jours * 24 * 60 * 60 * 1000));
        var expire = "; expire=" + date.toGMTString( // Aucune valeur de jours spécifiée
        );
    } else 
        var expire = "";
    document.cookie = nom + "=" + valeur + expire + "; path=/";
}
function getCookie(nom) {
    // Ajoute le signe égale virgule au nom pour la recherche
    var nom2 = nom + "=";
    // Array contenant tous les cookies
    var arrCookies = document
        .cookie
        .split(';');
    // Cherche l'array pour le cookie en question
    for (var i = 0; i < arrCookies.length; i++) {
        var a = arrCookies[i];
        // Si c'est un espace, enlever
        while (a.charAt(0) == ' ') {
            a = a.substring(1, a.length);
        }
        if (a.indexOf(nom2) == 0) {
            return a.substring(nom2.length, a.length);
        }
    }
    // Aucun cookie trouvé
    return null;
}

function eraseCookie(name) {
    createCookie(name, "", -1);
}
function eraseCookieFromAllPaths(name) {
    // This function will attempt to remove a cookie from all paths.
    var pathBits = location
        .pathname
        .split('/');
    var pathCurrent = ' path=';

    // do a simple pathless delete first.
    document.cookie = name + '=; expires=Thu, 01-Jan-1970 00:00:01 GMT;';

    for (var i = 0; i < pathBits.length; i++) {
        pathCurrent += ((pathCurrent.substr(-1) != '/')
            ? '/'
            : '') + pathBits[i];
        document.cookie = name + '=; expires=Thu, 01-Jan-1970 00:00:01 GMT;' + pathCurrent + ';';
    }
}

function saveScore() {
    createCookie('NamePlayer', document.getElementById('scorePlayer').value, 365);
    createCookie('ScorePlayer', score, 365);
}

function resetCookie() {
    eraseCookieFromAllPaths('NamePlayer');
    eraseCookieFromAllPaths('ScorePlayer');
    createCookie('Reset', true, 365);
    location.reload();
}

function chargerPage() {
    $('#tetris').addClass('hide');

    $('.choice').html(levels[indice].name);

    if (getHighScorePlayer() != "") {
        tabScore.push(getHighScorePlayer());
        document
            .getElementById('scorePlayer')
            .value = getCookie('NamePlayer');
    }

    $('#highscore-cookie').html(getHighScore());

    $('#highscore-player').html(getHighScorePlayer().score);

}

function prec() {
    var a = levels[i];

    indice -= 1;
    level(indice);

}

function suiv() {
    if (levels.length) 
    ;
    indice += 1;
    level(indice);
}

function level(i) {
    if (indice == 0) {
        $('.prec').addClass('hide-opacity');
    } else {
        $('.prec').removeClass('hide-opacity');
    }

    if (indice == levels.length - 1) {
        $('.suiv').addClass('hide-opacity');
    } else {
        $('.suiv').removeClass('hide-opacity');
    }

    $('.choice')
        .fadeOut(function () {
            $(this)
                .text(levels[i].name)
                .fadeIn();
        });
}

function getScore() {
    return score;
}

function getHighScorePlayer() {

    if (getCookie('NamePlayer') && getCookie('ScorePlayer')) {
        return scorePlayer = {
            name: getCookie('NamePlayer'),
            score: getCookie('ScorePlayer')
        }
    } else {
        return "";
    }
}

function getHighScore() {

    var tab_en_ordre = false;
    var taille = tabScore.length;
    while (!tab_en_ordre) {
        tab_en_ordre = true;
        for (var i = 0; i < taille - 1; i++) {
            if (tabScore[i].score < tabScore[i + 1].score) {
                temp = tabScore[i];
                tabScore[i] = tabScore[i + 1];
                tabScore[i + 1] = temp;
                tab_en_ordre = false;
            }
        }
        taille--;
    }

    var listeScore = "";
    for (var i = 0; i < tabScore.length; i++) {
        if (getCookie("NamePlayer") == tabScore[i].name) {
            listeScore += "<span class='highscore-playercookie'><span class='highscore-playercookie-name'>" + tabScore[i].name + "</span>: <span class='highscore-playercookie-score'>" + tabScore[i].score + "</span></span> <br>";
        } else {
            listeScore += "<span class='highscore-player-name'>" + tabScore[i].name + "</span> : <span class='highscore-player-score'>" + tabScore[i].score + "</span> <br>";
        }
    }

    return listeScore;
}

function createCookie(nom, valeur, jours) {
    // Le nombre de jours est spécifié
    if (jours) {
        var date = new Date();
        // Converti le nombre de jour en millisecondes
        date.setTime(date.getTime() + (jours * 24 * 60 * 60 * 1000));
        var expire = "; expire=" + date.toGMTString( // Aucune valeur de jours spécifiée
        );
    } else 
        var expire = "";
    document.cookie = nom + "=" + valeur + expire + "; path=/";
}
function getCookie(nom) {
    // Ajoute le signe égale virgule au nom pour la recherche
    var nom2 = nom + "=";
    // Array contenant tous les cookies
    var arrCookies = document
        .cookie
        .split(';');
    // Cherche l'array pour le cookie en question
    for (var i = 0; i < arrCookies.length; i++) {
        var a = arrCookies[i];
        // Si c'est un espace, enlever
        while (a.charAt(0) == ' ') {
            a = a.substring(1, a.length);
        }
        if (a.indexOf(nom2) == 0) {
            return a.substring(nom2.length, a.length);
        }
    }
    // Aucun cookie trouvé
    return null;
}

function eraseCookie(name) {
    createCookie(name, "", -1);
}
function eraseCookieFromAllPaths(name) {
    // This function will attempt to remove a cookie from all paths.
    var pathBits = location
        .pathname
        .split('/');
    var pathCurrent = ' path=';

    // do a simple pathless delete first.
    document.cookie = name + '=; expires=Thu, 01-Jan-1970 00:00:01 GMT;';

    for (var i = 0; i < pathBits.length; i++) {
        pathCurrent += ((pathCurrent.substr(-1) != '/')
            ? '/'
            : '') + pathBits[i];
        document.cookie = name + '=; expires=Thu, 01-Jan-1970 00:00:01 GMT;' + pathCurrent + ';';
    }
}

function saveScore() {
    createCookie('NamePlayer', document.getElementById('scorePlayer').value, 365);
    createCookie('ScorePlayer', score, 365);
}

function resetCookie() {
    eraseCookieFromAllPaths('NamePlayer');
    eraseCookieFromAllPaths('ScorePlayer');
    createCookie('Reset', true, 365);
    location.reload();
}