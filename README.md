Frustrating Tetris
==================

An HTML5 Frustrating Tetris Game

Forked from https://github.com/jakesgordon/javascript-tetris
into https://github.com/stasinos/javascript-tetris
for pull requests of fixes and new features for the normal game.

Forked again into https://bitbucket.org/stasinos/frustretris
(private repo) for developing the "frustrating tetris" features.


Added features:

1. There is a probability that the current brick is dropped regardless
of what the user action was. This probability increases as the pit
gets filled up, so that the game is more likely to ignore your action
when the game is at a critical stage.

2. There is a probability that a random number (1--7) of IGNORE
actions are added to the action queue, eating up as many keystrokes
without rotating or moving the falling brick.

Both features only kick in once there are 8 or fewer empty rows at the
top ofg the pit, and the probability that they appear increases as
fewer rows are left empty. This would normally result in minor hints
that there is something wrong as the game advances, with heightened
frequency when players enter a critical phase with little space left.


Frustration Parameters
======================

 - Player frustration is only active when so many or fewer empty rows:
   (l.86) frStart = 8  

 - The probability to apply frustration (if active, as per above) is:
   (l. 455) screwPlayer = 1.0 / nEMPTY
   where nEMPTY is the number of empty rows
   If this kicks in, they two types are equally probable.

   In order to make one more likely, we need to :
   * Have different "screwPlayer" variables initialized in l. 94
   * Calculate differently in l. 455
   * Use different variable to activate each type of frustration
     in l. 225 (ignore) and l. 238 (drop to bottom)

 - If "dead key" is chosen, between 1 and 8 "ignores" are pushed into
   the action queue:
   (l. 229) n = Math.random(1, 8)    
   Each ignore actions needs one keystroke to be
   shifted out, eating up the actual action.

 - If "drop to bottom" is chosen, the current brick will fall all the way
   to the bottom, regardless of what action was choses. No parameters here.
   

License
=======

[MIT](http://en.wikipedia.org/wiki/MIT_License) license.

