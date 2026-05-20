/* Classified Archive — agency-grade interactions */
(() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const panels = [...document.querySelectorAll(".panel[data-chapter]")];
  const videos = [...document.querySelectorAll("video[data-src]")];
  const cursor = document.getElementById("cursor");
  const cursorLabel = cursor?.querySelector(".cursor-label");
  const chapterCounter = document.getElementById("chapterCounter");
  const navLinks = [...document.querySelectorAll(".hud-nav a[href^='#']")];
  const hud = document.querySelector(".hud");
  const hero = document.getElementById("hero");
  const soundToggle = document.getElementById("soundToggle");
  const preloader = document.querySelector(".preloader");
  const preloaderBar = document.querySelector(".preloader-bar i");
  const preloaderPct = document.querySelector("[data-pct]");
  const railFill = document.getElementById("railFill");
  const railMeta = document.getElementById("railMeta");
  const railItems = [...document.querySelectorAll(".rail-list li")];
  const cosmos = document.getElementById("cosmos");
  const filmGrain = document.getElementById("filmGrain");
  const signalLine = document.getElementById("signalLine");
  const finaleSlides = [...document.querySelectorAll(".finale-slide")];
  const scrollProgress = document.getElementById("scrollProgress");
  const floatLayer = document.getElementById("floatLayer");
  const constellationLabel = document.getElementById("constellationLabel");
  const replayBtn = document.getElementById("replayBtn");

  const chapterLabels = {
    hero: "00 · Entry",
    vault: "01 · Vault",
    metrics: "02 · Intel",
    reel: "03 · Reel",
    artifacts: "04 · Artifacts",
    signal: "05 · Signal",
    portal: "06 · Portal",
    constellation: "07 · Registry",
    moments: "08 · Moments",
    relics: "09 · Relics",
    stones: "10 · Stones",
    finale: "11 · Finale",
  };

  let soundOn = false;
  let pointer = { x: innerWidth / 2, y: innerHeight / 2 };
  let cursorPos = { ...pointer };
  let lastScrollY = scrollY;
  let activeChapter = "";
  let signalTyped = false;
  let lenis = null;
  const gsapReady = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

  const clamp = (v, min = 0, max = 1) => Math.min(Math.max(v, min), max);
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ── Lenis smooth scroll ── */
  function initLenis() {
    if (prefersReduced || typeof Lenis === "undefined") return null;
    const instance = new Lenis({
      duration: 1.12,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.15,
    });

    instance.on("scroll", () => {
      if (gsapReady) ScrollTrigger.update();
      updateScrollUI();
    });

    const raf = (time) => {
      instance.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
    return instance;
  }

  function initFilmGrain() {
    if (!filmGrain || prefersReduced) return;
    const ctx = filmGrain.getContext("2d", { alpha: true });
    if (!ctx) return;
    const scale = 0.45;
    let last = 0;

    const resize = () => {
      filmGrain.width = Math.max(1, Math.floor(innerWidth * scale));
      filmGrain.height = Math.max(1, Math.floor(innerHeight * scale));
    };

    const draw = (time) => {
      if (time - last > 1000 / 24) {
        last = time;
        const image = ctx.createImageData(filmGrain.width, filmGrain.height);
        const data = image.data;
        for (let i = 0; i < data.length; i += 4) {
          const value = Math.random() * 255;
          data[i] = value;
          data[i + 1] = value;
          data[i + 2] = value;
          data[i + 3] = 42;
        }
        ctx.putImageData(image, 0, 0);
      }
      requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    requestAnimationFrame(draw);
  }

  /* ── Preloader ── */
  function runPreloader() {
    if (!preloader) {
      document.body.classList.add("is-ready");
      return Promise.resolve();
    }

    document.body.classList.add("is-loading");
    let progress = 0;

    return new Promise((resolve) => {
      const tick = () => {
        progress = Math.min(100, progress + (progress < 75 ? 3 + Math.random() * 7 : 1.5));
        if (preloaderBar) preloaderBar.style.width = `${progress}%`;
        if (preloaderPct) preloaderPct.textContent = String(Math.floor(progress)).padStart(2, "0");

        if (progress < 100) requestAnimationFrame(tick);
        else {
          document.body.classList.remove("is-loading");
          document.body.classList.add("is-ready");
          window.setTimeout(resolve, 500);
        }
      };
      requestAnimationFrame(tick);
    });
  }

  /* ── Video lazy load ── */
  function hydrateVideo(video) {
    if (!video.dataset.src || video.src) return;
    video.src = video.dataset.src;
    video.removeAttribute("data-src");
  }

  const videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          hydrateVideo(video);
          video.muted = !soundOn;
          video.play().catch(() => {});
        } else video.pause();
      });
    },
    { threshold: 0.32 }
  );
  videos.forEach((v) => videoObserver.observe(v));

  soundToggle?.addEventListener("click", () => {
    soundOn = !soundOn;
    soundToggle.textContent = soundOn ? "Sound On" : "Sound Off";
    soundToggle.setAttribute("aria-pressed", String(soundOn));
    document.querySelectorAll("video").forEach((v) => {
      if (v.src) v.muted = !soundOn;
    });
  });

  replayBtn?.addEventListener("click", () => {
    if (lenis) lenis.scrollTo(0, { duration: 1.8 });
    else window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  });

  /* ── Cosmos canvas ── */
  function initCosmos() {
    if (!cosmos || prefersReduced) return;
    const ctx = cosmos.getContext("2d", { alpha: true });
    if (!ctx) return;
    let time = 0;

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      cosmos.width = Math.floor(innerWidth * dpr);
      cosmos.height = Math.floor(innerHeight * dpr);
      cosmos.style.width = `${innerWidth}px`;
      cosmos.style.height = `${innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      time += 0.004;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      const blobs = [
        { x: 0.35, y: 0.3, c: "74, 111, 165", s: 0.55 },
        { x: 0.72, y: 0.55, c: "155, 111, 212", s: 0.45 },
        { x: 0.5, y: 0.78, c: "232, 197, 71", s: 0.35 },
      ];
      ctx.globalCompositeOperation = "lighter";
      blobs.forEach((b, i) => {
        const x = innerWidth * (b.x + Math.sin(time + i) * 0.04);
        const y = innerHeight * (b.y + Math.cos(time * 0.8 + i) * 0.03);
        const g = ctx.createRadialGradient(x, y, 0, x, y, innerWidth * b.s);
        g.addColorStop(0, `rgba(${b.c}, 0.1)`);
        g.addColorStop(0.55, `rgba(${b.c}, 0.02)`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, innerWidth, innerHeight);
      });
      ctx.globalCompositeOperation = "source-over";
      requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    draw();
  }

  /* ── Global float parallax ── */
  function initFloatParallax() {
    if (!floatLayer || prefersReduced) return;
    const items = [...floatLayer.querySelectorAll("[data-depth]")];

    const tick = () => {
      const scrollFactor = scrollY * 0.0004;
      const mx = (pointer.x / innerWidth - 0.5) * 2;
      const my = (pointer.y / innerHeight - 0.5) * 2;

      items.forEach((el, i) => {
        const depth = parseFloat(el.dataset.depth || 0.3);
        const dx = mx * depth * 40;
        const dy = my * depth * 30 + scrollFactor * depth * 80 * (i % 2 ? -1 : 1);
        el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      });
      requestAnimationFrame(tick);
    };
    tick();
  }

  /* ── 3D tilt (RoiHeads card feel) ── */
  function initTilt() {
    if (!hasFinePointer || prefersReduced) return;

    document.querySelectorAll("[data-tilt]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        const rx = py * -14;
        const ry = px * 14;
        el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02, 1.02, 1.02)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transform = "";
      });
    });
  }

  /* ── Cursor ── */
  function initCursor() {
    if (!cursor || !hasFinePointer || prefersReduced) return;

    const hoverables = document.querySelectorAll(
      "[data-magnetic], [data-tilt], [data-cursor], .reel-card, .artifact-piece, .relic-card, .constellation-node, .hud-nav a"
    );

    const onMove = (e) => {
      pointer = { x: e.clientX, y: e.clientY };
      document.body.classList.add("has-pointer");
      updateHeroReveal(e.clientX, e.clientY);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("mousemove", onMove);

    hoverables.forEach((el) => {
      el.addEventListener("pointerenter", () => {
        document.body.classList.add("cursor-hover");
        if (cursorLabel) {
          cursorLabel.textContent =
            el.dataset.cursor || el.dataset.hero || el.textContent?.trim().slice(0, 14) || "";
        }
      });
      el.addEventListener("pointerleave", () => {
        document.body.classList.remove("cursor-hover");
        if (cursorLabel) cursorLabel.textContent = "";
      });
    });

    const tick = () => {
      cursorPos.x = lerp(cursorPos.x, pointer.x, 0.12);
      cursorPos.y = lerp(cursorPos.y, pointer.y, 0.12);
      cursor.style.transform = `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0)`;
      requestAnimationFrame(tick);
    };
    tick();
  }

  function updateHeroReveal(x = pointer.x, y = pointer.y) {
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    const inside = rect.top < innerHeight && rect.bottom > 0;
    hero.classList.toggle("is-active", inside && hasFinePointer);

    if (inside) {
      hero.style.setProperty("--mx", `${clamp(x - rect.left, 0, rect.width)}px`);
      hero.style.setProperty("--my", `${clamp(y - rect.top, 0, rect.height)}px`);
    }

    hero.querySelectorAll(".hero-orbit span").forEach((word) => {
      const depth = parseFloat(word.dataset.depth || 0.4);
      const dx = (x - innerWidth / 2) * depth * 0.025;
      const dy = (y - innerHeight / 2) * depth * 0.025;
      word.style.transform = `translate(calc(-50% + var(--ox) + ${dx}px), calc(-50% + var(--oy) + ${dy}px))`;
    });

    hero.querySelectorAll(".hero-float").forEach((img) => {
      const depth = parseFloat(img.dataset.depth || 1);
      const dx = (x - innerWidth / 2) * depth * 0.018;
      const dy = (y - innerHeight / 2) * depth * 0.018;
      const scrollY = window.scrollY * 0.02 * depth;
      img.style.transform = `translate3d(${dx}px, ${dy - scrollY}px, 0)`;
    });
  }

  function initVaultParallax() {
    const vault = document.querySelector(".vault");
    const stage = document.querySelector(".vault-stage");
    if (!vault || !stage || !hasFinePointer || prefersReduced) return;

    let target = { rx: 0, ry: 0, gx: 0, gy: 0 };
    let current = { ...target };

    vault.addEventListener("pointermove", (e) => {
      const rect = vault.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      target = {
        rx: nx * 30,
        ry: ny * 20,
        gx: nx * -50,
        gy: ny * -34,
      };
    });

    vault.addEventListener("pointerleave", () => {
      target = { rx: 0, ry: 0, gx: 0, gy: 0 };
    });

    const tick = () => {
      current.rx = lerp(current.rx, target.rx, 0.08);
      current.ry = lerp(current.ry, target.ry, 0.08);
      current.gx = lerp(current.gx, target.gx, 0.08);
      current.gy = lerp(current.gy, target.gy, 0.08);
      stage.style.setProperty("--rx", `${current.rx}px`);
      stage.style.setProperty("--ry", `${current.ry}px`);
      stage.style.setProperty("--gx", `${current.gx}px`);
      stage.style.setProperty("--gy", `${current.gy}px`);
      requestAnimationFrame(tick);
    };
    tick();
  }

  function initMagnetic() {
    if (!hasFinePointer || prefersReduced) return;
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate3d(${(e.clientX - (r.left + r.width / 2)) * 0.25}px, ${(e.clientY - (r.top + r.height / 2)) * 0.25}px, 0)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transform = "";
      });
    });
  }

  /* ── Constellation nodes ── */
  function initConstellation() {
    document.querySelectorAll(".constellation-node").forEach((node) => {
      node.addEventListener("click", () => {
        document.querySelectorAll(".constellation-node").forEach((n) => n.classList.remove("is-active"));
        node.classList.add("is-active");
        if (constellationLabel) {
          constellationLabel.style.opacity = "0";
          window.setTimeout(() => {
            constellationLabel.textContent = node.dataset.hero || "";
            constellationLabel.style.opacity = "1";
          }, 150);
        }
      });
    });
  }

  /* ── Metric counters ── */
  function initCounters() {
    const counters = document.querySelectorAll("[data-count]");
    if (!counters.length) return;

    const animate = (el) => {
      const target = parseInt(el.dataset.count, 10);
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: 2.2,
        ease: "power3.out",
        snap: { val: 1 },
        onUpdate: () => {
          el.textContent = Math.round(obj.val);
        },
      });
    };

    if (prefersReduced || !gsapReady) {
      counters.forEach((el) => {
        el.textContent = el.dataset.count;
      });
      return;
    }

    ScrollTrigger.batch(counters, {
      start: "top 85%",
      onEnter: (batch) => batch.forEach(animate),
      once: true,
    });
  }

  /* ── Chapter tracking ── */
  function setChapter(id) {
    if (!id || id === activeChapter) return;
    activeChapter = id;
    document.body.dataset.theme =
      document.querySelector(`#${id}`)?.dataset.theme || "void";

    railItems.forEach((li) => li.classList.toggle("is-active", li.dataset.chapter === id));
    if (railMeta) railMeta.textContent = chapterLabels[id] || id;
    if (chapterCounter) chapterCounter.textContent = chapterLabels[id]?.slice(0, 2) || "00";
    navLinks.forEach((link) => link.classList.toggle("nav--active", link.getAttribute("href") === `#${id}`));
    if (id === "signal") startSignalTypewriter();
  }

  function updateScrollUI() {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const pct = clamp(scrollY / max);
    if (railFill) railFill.style.height = `${pct * 100}%`;
    if (scrollProgress) scrollProgress.style.height = `${pct * 100}%`;

    const goingDown = scrollY > lastScrollY && scrollY > innerHeight * 0.55;
    hud?.classList.toggle("is-hidden", goingDown);
    lastScrollY = scrollY;

    let best = activeChapter;
    let bestScore = Infinity;
    panels.forEach((panel) => {
      const rect = panel.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= innerHeight) return;
      const score = Math.abs(rect.top + rect.height * 0.32 - innerHeight * 0.4);
      if (score < bestScore) {
        bestScore = score;
        best = panel.dataset.chapter;
      }
    });
    if (best) setChapter(best);
  }

  window.addEventListener("scroll", updateScrollUI, { passive: true });
  window.addEventListener("resize", updateScrollUI);

  railItems.forEach((li) => {
    li.querySelector("button")?.addEventListener("click", () => {
      const target = document.getElementById(li.dataset.chapter);
      if (!target) return;
      if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
      else target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
    });
  });

  document.querySelectorAll(".hero-orbit span[data-target]").forEach((word) => {
    word.addEventListener("click", () => {
      const target = document.getElementById(word.dataset.target);
      if (!target) return;
      if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.25 });
      else target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
    });
  });

  function startSignalTypewriter() {
    if (signalTyped || !signalLine) return;
    signalTyped = true;
    const text = signalLine.dataset.text || "";
    let i = 0;
    signalLine.textContent = "";
    const type = () => {
      signalLine.textContent = text.slice(0, i);
      i += 1;
      if (i <= text.length) window.setTimeout(type, i < 8 ? 50 : 26);
    };
    window.setTimeout(type, 280);
  }

  /* ── Horizontal pin helper ── */
  function pinHorizontal(trackSel, wrapSel) {
    const track = document.querySelector(trackSel);
    const wrap = document.querySelector(wrapSel);
    if (!track || !wrap) return;

    const distance = () => Math.max(0, track.scrollWidth - wrap.offsetWidth + 100);

    gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: wrap,
        start: "top top",
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });
  }

  /* ── GSAP ── */
  function initGSAP() {
    if (!gsapReady) return;
    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();

    document.querySelectorAll("[data-split]").forEach((line) => {
      const chars = line.textContent.split("");
      line.textContent = "";
      chars.forEach((ch) => {
        const span = document.createElement("span");
        span.textContent = ch === " " ? "\u00a0" : ch;
        line.appendChild(span);
      });
    });

    gsap.from(".hero-title .line span", {
      yPercent: 120,
      opacity: 0,
      duration: 1.2,
      stagger: 0.025,
      ease: "power4.out",
      delay: 0.6,
    });

    gsap.from(".hero-float", {
      scale: 0.6,
      opacity: 0,
      duration: 1.4,
      stagger: 0.15,
      ease: "power3.out",
      delay: 0.8,
    });

    /* Vault arc reactor reveal */
    const vaultVideo = document.querySelector(".vault-video");
    const vaultStage = document.querySelector(".vault-stage");
    if (vaultVideo && vaultStage) {
      const vaultTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".vault-pin-wrap",
          start: "top top",
          end: "+=155%",
          pin: true,
          scrub: 0.9,
        },
      });

      vaultTl
        .fromTo(
          vaultVideo,
          {
            autoAlpha: 0,
            y: "5vh",
            scale: 1.08,
            clipPath: "circle(1% at 50% 78%)",
          },
          {
            autoAlpha: 1,
            y: "0vh",
            scale: 1,
            clipPath: "circle(150% at 50% 78%)",
            ease: "power3.inOut",
            duration: 0.82,
          },
          0
        )
        .fromTo(
          ".reactor-shell",
          { scale: 1, opacity: 1, filter: "brightness(0.78) saturate(0.88)" },
          {
            scale: 1.04,
            opacity: 0,
            filter: "brightness(1.14) saturate(1.08)",
            ease: "power3.inOut",
            duration: 0.64,
          },
          0.14
        )
        .fromTo(
          ".reactor-overlay",
          { scale: 0.98, opacity: 1 },
          {
            scale: 1.1,
            opacity: 0,
            ease: "power3.inOut",
            duration: 0.55,
          },
          0.1
        )
        .to(
          ".vault-copy",
          {
            autoAlpha: 0,
            y: -36,
            ease: "power2.out",
            duration: 0.32,
          },
          0.34
        );

      gsap.from(".vault-copy", {
        opacity: 0,
        y: 60,
        scrollTrigger: { trigger: ".vault", start: "top 60%", end: "top 30%", scrub: true },
      });
    }

    mm.add("(min-width: 901px)", () => {
      pinHorizontal(".reel-track", ".reel-pin");
      pinHorizontal(".artifacts-track", ".artifacts-pin");
    });

    gsap.from(".metric-card", {
      opacity: 0,
      y: 80,
      stagger: 0.12,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: { trigger: ".metrics-grid", start: "top 75%" },
    });

    gsap.from(".signal-inner > *", {
      opacity: 0,
      y: 40,
      stagger: 0.12,
      duration: 0.85,
      ease: "power3.out",
      scrollTrigger: { trigger: "#signal", start: "top 70%" },
    });

    /* Portal breach */
    gsap.timeline({
      scrollTrigger: {
        trigger: ".portal-pin-wrap",
        start: "top top",
        end: "+=150%",
        pin: true,
        scrub: 1,
      },
    })
      .fromTo(".portal-giant", { scale: 0.3, opacity: 0.05, rotate: -30 }, { scale: 1.4, opacity: 0.35, rotate: 15, ease: "none" })
      .fromTo(".portal-burst", { scale: 0.2, opacity: 0 }, { scale: 2.5, opacity: 0.8, ease: "none" }, 0)
      .fromTo(".portal-text", { y: 80, opacity: 0 }, { y: 0, opacity: 1, ease: "none" }, 0.3);

    /* Constellation pin + rotate */
    mm.add("(min-width: 901px)", () => {
      gsap.to(".constellation-stage", {
        rotate: 90,
        ease: "none",
        scrollTrigger: {
          trigger: ".constellation-pin-wrap",
          start: "top top",
          end: "+=130%",
          pin: true,
          scrub: 1.2,
        },
      });
    });

    document.querySelectorAll(".moment:not(.moment-duo-wrap)").forEach((moment) => {
      const copy = moment.querySelector(".moment-copy");
      const vid = moment.querySelector("video");
      if (copy) {
        gsap.from(copy.children, {
          opacity: 0,
          y: 55,
          stagger: 0.1,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: { trigger: moment, start: "top 68%" },
        });
      }
      if (vid) {
        gsap.to(vid, {
          scale: 1.08,
          ease: "none",
          scrollTrigger: { trigger: moment, start: "top bottom", end: "bottom top", scrub: true },
        });
      }
    });

    gsap.from(".relic-card", {
      opacity: 0,
      y: 40,
      rotateX: -12,
      stagger: { amount: 0.6, grid: [2, 5], from: "start" },
      duration: 0.7,
      ease: "power3.out",
      scrollTrigger: { trigger: ".relics-grid", start: "top 78%" },
    });

    gsap.from(".stones-inner > *:not(.stones-video)", {
      opacity: 0,
      y: 50,
      stagger: 0.1,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: { trigger: "#stones", start: "top 70%" },
    });

    if (!prefersReduced) {
      gsap.to(".stone-ring", { rotate: 360, duration: 50, repeat: -1, ease: "none" });
    }

    if (finaleSlides.length) {
      finaleSlides[0].classList.add("is-current");
      const finaleTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".finale-pin-wrap",
          start: "top top",
          end: () => `+=${innerHeight * (finaleSlides.length + 0.6)}`,
          pin: true,
          scrub: 0.85,
          anticipatePin: 1,
        },
      });
      finaleSlides.forEach((slide, i) => {
        if (i === 0) return;
        finaleTl.add(() => {
          finaleSlides.forEach((s, j) => s.classList.toggle("is-current", j === i));
        });
        finaleTl.to({}, { duration: 1 });
      });
    }

    initCounters();

    ScrollTrigger.addEventListener("refresh", updateScrollUI);
    ScrollTrigger.create({
      trigger: "main",
      start: "top top",
      end: "bottom bottom",
      onUpdate: updateScrollUI,
    });
  }

  function initReducedMotion() {
    document.querySelectorAll(".hero-orbit span").forEach((word, i) => {
      const positions = [
        [-30, -15], [28, -18], [-22, 16], [30, 12], [-35, 2], [6, -24], [18, 20], [-10, -28],
      ];
      const [ox, oy] = positions[i] || [0, 0];
      word.style.transform = `translate(calc(-50% + ${ox}vw), calc(-50% + ${oy}vh))`;
    });
    document.querySelectorAll("[data-count]").forEach((el) => {
      el.textContent = el.dataset.count;
    });
    finaleSlides[0]?.classList.add("is-current");
    document.body.classList.add("is-ready");
    if (preloader) preloader.style.display = "none";
  }

  async function boot() {
    initCosmos();
    initFilmGrain();
    initFloatParallax();
    initCursor();
    initMagnetic();
    initTilt();
    initConstellation();
    initVaultParallax();
    setChapter("hero");

    if (prefersReduced) {
      initReducedMotion();
      document.body.classList.remove("is-loading");
    } else {
      await runPreloader();
      if (gsapReady) {
        lenis = initLenis();
        initGSAP();
        ScrollTrigger.refresh();
      }
    }

    updateScrollUI();
    updateHeroReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
