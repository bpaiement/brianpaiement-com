// 8-bit drifting night sky: small gray pixel stars snapped to a grid, with a
// gentle, randomized twinkle and slow parallax drift. Respects prefers-reduced-motion.
(function () {
  var canvas = document.getElementById("sky");
  var ctx = canvas.getContext("2d");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var W = 0, H = 0, DPR = 1, stars = [], raf = 0, running = true;
  var mx = 0, my = 0, tx = 0, ty = 0;
  var GRID = 4; // snap stars to a chunky pixel grid

  function snap(v) { return Math.round(v / GRID) * GRID; }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.floor(W * DPR); canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.imageSmoothingEnabled = false;
    build();
    if (reduce) draw(0);
  }

  function build() {
    var count = Math.min(300, Math.floor((W * H) / 6000));
    stars = [];
    for (var i = 0; i < count; i++) {
      var depth = Math.random();
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: depth > 0.6 ? 3 : 2, // small squares only — no large stars
        depth: depth,
        // Scintillation: two slow, unrelated sine waves per star plus a random
        // offset, so no two stars brighten together.
        f1: 0.35 + Math.random() * 0.9,
        f2: 1.1 + Math.random() * 1.8,
        p1: Math.random() * Math.PI * 2,
        p2: Math.random() * Math.PI * 2,
        // Occasional brief glint, each star on its own random schedule.
        glintEvery: 6 + Math.random() * 14,
        glintAt: Math.random() * 20,
        drift: 1.2 + depth * 3.5,                       // px/sec, very slow
        color: depth > 0.7 ? "#e9e9e6" : depth > 0.4 ? "#b9bab4" : "#7f8287" // white/gray only
      });
    }
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    mx += (tx - mx) * 0.06; my += (ty - my) * 0.06;
    var t = now / 1000;

    // Whole sky drifts slowly up-left; nearer stars move faster (parallax).
    var dx = -0.45, dy = -0.9;
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var tw = 0.62 + 0.24 * Math.sin(t * s.f1 + s.p1) + 0.14 * Math.sin(t * s.f2 + s.p2);
      var g = (t + s.glintAt) % s.glintEvery;
      var glint = g < 0.35 ? Math.sin((g / 0.35) * Math.PI) : 0;
      var a = Math.min(1, tw + glint * 0.5);
      a = Math.round(a * 6) / 6; // stepped levels keep the 8-bit feel
      ctx.globalAlpha = a * (0.4 + s.depth * 0.6);
      ctx.fillStyle = s.color;
      var px = ((s.x + t * s.drift * dx) % (W + 12) + W + 12) % (W + 12) - 6;
      var py = ((s.y + t * s.drift * dy) % (H + 12) + H + 12) % (H + 12) - 6;
      var x = snap(px + mx * (3 + s.depth * 12));
      var y = snap(py + my * (3 + s.depth * 12));
      ctx.fillRect(x, y, s.size, s.size);
      // Bright stars get a tiny 1px pixel cross when they glint.
      if (glint > 0.4 && s.depth > 0.6) {
        ctx.globalAlpha = (glint - 0.4) * 0.9;
        ctx.fillRect(x - 2, y + 1, 1, 1); ctx.fillRect(x + s.size + 1, y + 1, 1, 1);
        ctx.fillRect(x + 1, y - 2, 1, 1); ctx.fillRect(x + 1, y + s.size + 1, 1, 1);
      }
    }
    ctx.globalAlpha = 1;
  }

  function loop(now) {
    if (!running) return;
    draw(now);
    raf = requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize);
  if (!reduce) {
    window.addEventListener("pointermove", function (e) {
      tx = (e.clientX / Math.max(W, 1) - 0.5) * 2;
      ty = (e.clientY / Math.max(H, 1) - 0.5) * 2;
    }, { passive: true });
  }
  document.addEventListener("visibilitychange", function () {
    if (reduce) return;
    running = !document.hidden;
    if (running) raf = requestAnimationFrame(loop);
    else cancelAnimationFrame(raf);
  });

  resize();
  if (!reduce) raf = requestAnimationFrame(loop);
  else draw(1200);
})();
