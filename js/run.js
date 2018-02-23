//-------------------------------------------------------------------------
    // GAME LOOP
    //-------------------------------------------------------------------------

    function run() {
        showStats(); // initialize FPS counter
        addEvents(); // attach keydown and resize events
  
        var last = now = timestamp();
        function frame() {
          now = timestamp();
          update(Math.min(1, (now - last) / 1000.0)); // using requestAnimationFrame have to be able to handle large delta's caused when it 'hibernates' in a background or non-visible tab
          draw();
          stats.update();
          last = now;
          requestAnimationFrame(frame, canvas);
        }
  
        resize(); // setup all our sizing information
        reset();  // reset the per-game variables
        frame();  // start the first frame
  
      }