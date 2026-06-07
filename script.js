const loader = document.getElementById("loader");
const nav = document.getElementById("mainNav");
const menuToggle = document.getElementById("menuToggle");
const cursorSpark = document.getElementById("cursorSpark");

window.addEventListener("load", () => {
  setTimeout(() => loader.classList.add("hidden"), 3000);
});

menuToggle.addEventListener("click", () => {
  nav.classList.toggle("open");
});

document.querySelectorAll(".nav a").forEach((link) => {
  link.addEventListener("click", () => nav.classList.remove("open"));
});

document.querySelectorAll(".neon-button").forEach((button) => {
  button.addEventListener("pointermove", (event) => {
    cursorSpark.style.left = `${event.clientX}px`;
    cursorSpark.style.top = `${event.clientY}px`;
    cursorSpark.classList.remove("active");
    void cursorSpark.offsetWidth;
    cursorSpark.classList.add("active");
  });
});

document.querySelectorAll(".play-jump").forEach((button) => {
  button.addEventListener("click", () => {
    document.getElementById(button.dataset.target).scrollIntoView({ behavior: "smooth", block: "center" });
  });
});

document.querySelector(".contact-form").addEventListener("submit", (event) => {
  event.preventDefault();
  event.currentTarget.reset();
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((item) => revealObserver.observe(item));

const sections = [...document.querySelectorAll("main section[id]")];
const navLinks = [...document.querySelectorAll(".nav a")];

window.addEventListener("scroll", () => {
  let current = null;
  sections.forEach((section) => {
    if (section.offsetTop <= window.scrollY + 160) current = section;
  });
  if (!current) return;
  navLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${current.id}`));
});

function setupParticles() {
  const canvas = document.getElementById("particleCanvas");
  const ctx = canvas.getContext("2d");
  const particles = Array.from({ length: 86 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 2.2 + 0.7,
    vx: (Math.random() - 0.5) * 0.25,
    vy: (Math.random() - 0.5) * 0.25,
    hue: Math.random() * 360
  }));

  function resize() {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = window.innerWidth;
    const h = window.innerHeight;
    particles.forEach((p, index) => {
      p.x += p.vx / w;
      p.y += p.vy / h;
      if (p.x < 0 || p.x > 1) p.vx *= -1;
      if (p.y < 0 || p.y > 1) p.vy *= -1;
      const x = p.x * w;
      const y = p.y * h;
      ctx.beginPath();
      ctx.fillStyle = `hsla(${p.hue}, 100%, 62%, 0.58)`;
      ctx.shadowBlur = 18;
      ctx.shadowColor = ctx.fillStyle;
      ctx.arc(x, y, p.r, 0, Math.PI * 2);
      ctx.fill();

      for (let j = index + 1; j < particles.length; j++) {
        const other = particles[j];
        const ox = other.x * w;
        const oy = other.y * h;
        const dist = Math.hypot(x - ox, y - oy);
        if (dist < 115) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0, 255, 255, ${0.12 * (1 - dist / 115)})`;
          ctx.lineWidth = 1;
          ctx.moveTo(x, y);
          ctx.lineTo(ox, oy);
          ctx.stroke();
        }
      }
    });
    requestAnimationFrame(draw);
  }

  resize();
  draw();
  window.addEventListener("resize", resize);
}

setupParticles();

function setupMemory() {
  const board = document.getElementById("memoryBoard");
  const scoreEl = document.getElementById("memoryScore");
  const timeEl = document.getElementById("memoryTime");
  const reset = document.getElementById("resetMemory");
  const icons = ["⚡", "◆", "✦", "●", "▲", "■", "✚", "◇"];
  let first = null;
  let lock = false;
  let score = 0;
  let seconds = 0;
  let timer = null;

  function startTimer() {
    if (timer) return;
    timer = setInterval(() => {
      seconds += 1;
      timeEl.textContent = seconds;
    }, 1000);
  }

  function render() {
    clearInterval(timer);
    timer = null;
    first = null;
    lock = false;
    score = 0;
    seconds = 0;
    scoreEl.textContent = "0";
    timeEl.textContent = "0";
    board.innerHTML = "";
    [...icons, ...icons]
      .sort(() => Math.random() - 0.5)
      .forEach((icon) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "memory-card";
        card.textContent = icon;
        card.dataset.icon = icon;
        card.addEventListener("click", () => flip(card));
        board.appendChild(card);
      });
  }

  function flip(card) {
    if (lock || card.classList.contains("flipped") || card.classList.contains("matched")) return;
    startTimer();
    card.classList.add("flipped");
    if (!first) {
      first = card;
      return;
    }
    if (first.dataset.icon === card.dataset.icon) {
      first.classList.add("matched");
      card.classList.add("matched");
      score += 120;
      scoreEl.textContent = score;
      first = null;
      if (document.querySelectorAll(".memory-card.matched").length === 16) clearInterval(timer);
      return;
    }
    lock = true;
    score = Math.max(0, score - 15);
    scoreEl.textContent = score;
    setTimeout(() => {
      first.classList.remove("flipped");
      card.classList.remove("flipped");
      first = null;
      lock = false;
    }, 760);
  }

  reset.addEventListener("click", render);
  render();
}

setupMemory();

function setupPool() {
  const canvas = document.getElementById("poolCanvas");
  const ctx = canvas.getContext("2d");
  const shotsEl = document.getElementById("poolShots");
  const scoreEl = document.getElementById("poolScore");
  const reset = document.getElementById("resetPool");
  let balls = [];
  let aiming = false;
  let aim = { x: 0, y: 0 };
  let shots = 0;
  let score = 0;

  function makeBall(x, y, color, cue = false) {
    return { x, y, vx: 0, vy: 0, r: 14, color, cue, pocketed: false };
  }

  function rack() {
    balls = [
      makeBall(210, 230, "#ffffff", true),
      makeBall(590, 230, "#ff00ff"),
      makeBall(622, 212, "#00ffff"),
      makeBall(622, 248, "#a6ff00"),
      makeBall(654, 194, "#ffbe0b"),
      makeBall(654, 230, "#7a00ff"),
      makeBall(654, 266, "#ff4365")
    ];
    shots = 0;
    score = 0;
    shotsEl.textContent = "0";
    scoreEl.textContent = "0";
  }

  function pointerPos(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  canvas.addEventListener("pointerdown", (event) => {
    const cue = balls.find((b) => b.cue && !b.pocketed);
    const p = pointerPos(event);
    if (Math.hypot(p.x - cue.x, p.y - cue.y) < 40) {
      aiming = true;
      aim = p;
      canvas.setPointerCapture(event.pointerId);
    }
  });

  canvas.addEventListener("pointermove", (event) => {
    if (aiming) aim = pointerPos(event);
  });

  canvas.addEventListener("pointerup", () => {
    if (!aiming) return;
    const cue = balls.find((b) => b.cue && !b.pocketed);
    const dx = cue.x - aim.x;
    const dy = cue.y - aim.y;
    const power = Math.min(14, Math.hypot(dx, dy) / 12);
    cue.vx = (dx / Math.hypot(dx, dy)) * power;
    cue.vy = (dy / Math.hypot(dx, dy)) * power;
    shots += 1;
    shotsEl.textContent = shots;
    aiming = false;
  });

  function update() {
    const pockets = [[30, 30], [460, 24], [890, 30], [30, 430], [460, 436], [890, 430]];
    balls.forEach((ball) => {
      if (ball.pocketed) return;
      ball.x += ball.vx;
      ball.y += ball.vy;
      ball.vx *= 0.985;
      ball.vy *= 0.985;
      if (Math.abs(ball.vx) < 0.02) ball.vx = 0;
      if (Math.abs(ball.vy) < 0.02) ball.vy = 0;
      if (ball.x < 44 || ball.x > canvas.width - 44) ball.vx *= -0.9;
      if (ball.y < 44 || ball.y > canvas.height - 44) ball.vy *= -0.9;
      ball.x = Math.max(44, Math.min(canvas.width - 44, ball.x));
      ball.y = Math.max(44, Math.min(canvas.height - 44, ball.y));
      pockets.forEach(([px, py]) => {
        if (Math.hypot(ball.x - px, ball.y - py) < 24) {
          if (ball.cue) {
            ball.x = 210; ball.y = 230; ball.vx = 0; ball.vy = 0;
          } else {
            ball.pocketed = true;
            score += 100;
            scoreEl.textContent = score;
          }
        }
      });
    });

    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const a = balls[i];
        const b = balls[j];
        if (a.pocketed || b.pocketed) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const min = a.r + b.r;
        if (dist < min && dist > 0) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = (min - dist) / 2;
          a.x -= nx * overlap;
          a.y -= ny * overlap;
          b.x += nx * overlap;
          b.y += ny * overlap;
          const impulse = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
          a.vx -= impulse * nx;
          a.vy -= impulse * ny;
          b.vx += impulse * nx;
          b.vy += impulse * ny;
        }
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#062022");
    gradient.addColorStop(0.5, "#0b281e");
    gradient.addColorStop(1, "#160622");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 10;
    ctx.shadowBlur = 22;
    ctx.shadowColor = "#00ffff";
    ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);
    ctx.shadowBlur = 0;
    [[30, 30], [460, 24], [890, 30], [30, 430], [460, 436], [890, 430]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.fillStyle = "#020405";
      ctx.arc(x, y, 24, 0, Math.PI * 2);
      ctx.fill();
    });
    balls.forEach((ball) => {
      if (ball.pocketed) return;
      ctx.beginPath();
      ctx.fillStyle = ball.color;
      ctx.shadowBlur = 18;
      ctx.shadowColor = ball.color;
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    if (aiming) {
      const cue = balls.find((b) => b.cue && !b.pocketed);
      ctx.beginPath();
      ctx.strokeStyle = "#ff00ff";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.moveTo(cue.x, cue.y);
      ctx.lineTo(aim.x, aim.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  reset.addEventListener("click", rack);
  rack();
  loop();
}

setupPool();

function setupVoxels() {
  const world = document.getElementById("voxelWorld");
  const tools = document.getElementById("voxelTools");
  const selectedEl = document.getElementById("selectedBlock");
  const countEl = document.getElementById("blockCount");
  const clear = document.getElementById("clearVoxels");
  const palette = [
    { name: "Cyan", color: "#00ffff" },
    { name: "Magenta", color: "#ff00ff" },
    { name: "Mor", color: "#7a00ff" },
    { name: "Çim", color: "#a6ff00" },
    { name: "Lav", color: "#ff4d00" }
  ];
  let selected = palette[0];

  palette.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `voxel-swatch${index === 0 ? " active" : ""}`;
    button.style.background = item.color;
    button.title = item.name;
    button.addEventListener("click", () => {
      selected = item;
      selectedEl.textContent = item.name;
      document.querySelectorAll(".voxel-swatch").forEach((swatch) => swatch.classList.remove("active"));
      button.classList.add("active");
    });
    tools.appendChild(button);
  });

  function updateCount() {
    countEl.textContent = document.querySelectorAll(".voxel-cell.filled").length;
  }

  for (let i = 0; i < 96; i++) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "voxel-cell";
    cell.addEventListener("click", () => {
      if (cell.classList.contains("filled")) {
        cell.classList.remove("filled");
        cell.style.background = "";
        cell.style.color = "";
      } else {
        cell.classList.add("filled");
        cell.style.background = `linear-gradient(135deg, ${selected.color}, #121212)`;
        cell.style.color = selected.color;
      }
      updateCount();
    });
    world.appendChild(cell);
  }

  [38, 39, 40, 50, 51, 52, 62, 63, 64].forEach((index) => world.children[index].click());
  clear.addEventListener("click", () => {
    document.querySelectorAll(".voxel-cell").forEach((cell) => {
      cell.classList.remove("filled");
      cell.style.background = "";
      cell.style.color = "";
    });
    updateCount();
  });
}

setupVoxels();

const leaders = [
  ["01", "Kayra", 9840],
  ["02", "EgemenEE5", 8660],
  ["03", "Türklokumu", 8110],
  ["04", "Eddy_Emirhan", 7340],
  ["05", "Rüzgar", 6750]
];

document.getElementById("leaderList").innerHTML = leaders.map(([rank, name, score]) => `
  <div class="leader-row">
    <strong>${rank}</strong>
    <span>${name}</span>
    <strong>${score.toLocaleString("tr-TR")}</strong>
  </div>
`).join("");
