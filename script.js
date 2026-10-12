// 8-bit drifting night sky: small gray pixel stars snapped to a grid, with a
// stepped twinkle. Respects prefers-reduced-motion.
(function () {
  var canvas = document.getElementById("sky");
  var ctx = canvas.getContext("2d");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

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
        x: snap(Math.random() * W),
        y: snap(Math.random() * H),
        size: depth > 0.6 ? 3 : 2, // small squares only — no large stars
        depth: depth,
        phase: Math.floor(Math.random() * 4),          // 4-step twinkle
        speed: 2 + Math.floor(Math.random() * 4),      // steps per second-ish
        drift: 3 + depth * 10,                          // px/sec slow drift
        color: depth > 0.7 ? "#e9e9e6" : depth > 0.4 ? "#b9bab4" : "#7f8287" // white/gray only
      });
    }
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    mx += (tx - mx) * 0.06; my += (ty - my) * 0.06;
    var t = now / 1000;

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      // Stepped twinkle: only 4 brightness levels, changes in discrete steps (8-bit feel)
      var step = Math.floor(t * s.speed + s.phase) % 4;
      var levels = [0.25, 0.55, 1, 0.55];
      ctx.globalAlpha = levels[step] * (0.16 + s.depth * 0.42); // subtle
      ctx.fillStyle = s.color;
      var y = snap((s.y + t * s.drift) % (H + 12) - 6);
      var x = snap(s.x + mx * (3 + s.depth * 12));
      var yy = snap(y + my * (3 + s.depth * 12));
      ctx.fillRect(x, yy, s.size, s.size);
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
