// 8-bit drifting night sky: square pixel stars snapped to a grid, stepped twinkle,
// a blocky pixel moon, and stepped shooting stars. Respects prefers-reduced-motion.
(function () {
  var canvas = document.getElementById("sky");
  var ctx = canvas.getContext("2d");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var W = 0, H = 0, DPR = 1, stars = [], meteors = [], raf = 0, running = true;
  var mx = 0, my = 0, tx = 0, ty = 0;
  var lastMeteor = 0;
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
        x: snap(Math.random() * W),
        y: snap(Math.random() * H),
        size: depth > 0.86 ? 8 : depth > 0.5 ? 5 : 3, // square pixel size
        depth: depth,
        phase: Math.floor(Math.random() * 4),          // 4-step twinkle
        speed: 2 + Math.floor(Math.random() * 4),      // steps per second-ish
        drift: 3 + depth * 10,                          // px/sec slow drift
        color: depth > 0.82 ? "#25a84e" : depth > 0.45 ? "#f2ecd8" : "#8fa3c8"
      });
    }
  }

  function spawnMeteor(now) {
    meteors.push({
      x: snap(W * (0.3 + Math.random() * 0.6)),
      y: snap(H * (Math.random() * 0.28)),
      vx: -(190 + Math.random() * 150),
      vy: 115 + Math.random() * 85,
      born: now, life: 1100 + Math.random() * 500
    });
  }

  // Blocky pixel crescent moon drawn from squares
  function pixelMoon(cx, cy, px) {
    var map = [
      "..XXXX..",
      ".XXXXXX.",
      "XXX...XX",
      "XX.....X",
      "XX......",
      "XX.....X",
      "XXX...XX",
      ".XXXXXX.",
      "..XXXX.."
    ];
    ctx.fillStyle = "#f2ecd8";
    for (var r = 0; r < map.length; r++) {
      for (var c = 0; c < map[r].length; c++) {
        if (map[r][c] === "X") ctx.fillRect(cx + c * px, cy + r * px, px, px);
      }
    }
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    mx += (tx - mx) * 0.06; my += (ty - my) * 0.06;
    var t = now / 1000;

    pixelMoon(snap(W * 0.84 + mx * 8), snap(H * 0.1 + my * 8), 6);

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      // Stepped twinkle: only 4 brightness levels, changes in discrete steps (8-bit feel)
      var step = Math.floor(t * s.speed + s.phase) % 4;
      var levels = [0.25, 0.55, 1, 0.55];
      ctx.globalAlpha = levels[step] * (0.35 + s.depth * 0.65);
      ctx.fillStyle = s.color;
      var y = snap((s.y + t * s.drift) % (H + 12) - 6);
      var x = snap(s.x + mx * (3 + s.depth * 12));
      var yy = snap(y + my * (3 + s.depth * 12));
      ctx.fillRect(x, yy, s.size, s.size);
      if (s.depth > 0.9 && step === 2) { // plus-sparkle on brightest frame
        ctx.fillRect(x - s.size, yy, s.size, s.size);
        ctx.fillRect(x + s.size, yy, s.size, s.size);
        ctx.fillRect(x, yy - s.size, s.size, s.size);
        ctx.fillRect(x, yy + s.size, s.size, s.size);
      }
    }
    ctx.globalAlpha = 1;

    if (!reduce && now - lastMeteor > 5200 && meteors.length < 2) {
      if (Math.random() < 0.012) { spawnMeteor(now); lastMeteor = now; }
    }
    meteors = meteors.filter(function (m) { return now - m.born < m.life; });
    meteors.forEach(function (m) {
      var p = (now - m.born) / 1000;
      var x = snap(m.x + m.vx * p), y = snap(m.y + m.vy * p);
      var fade = 1 - (now - m.born) / m.life;
      // stepped pixel trail
      for (var k = 0; k < 7; k++) {
        ctx.globalAlpha = Math.max(0, fade * (1 - k / 7));
        ctx.fillStyle = "#f2ecd8";
        var s2 = k < 2 ? 6 : 4;
        ctx.fillRect(x + k * 12, y - Math.round(k * 7 / GRID) * GRID, s2, s2);
      }
      ctx.globalAlpha = 1;
    });
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
