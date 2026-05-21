/* Classified Archive — agency-grade interactions */
(() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const panels = [...document.querySelectorAll(".panel[data-chapter]")];
  const videos = [...document.querySelectorAll("video[data-src]")];
  const cursor = document.getElementById("cursor");
  const cursorLabel = cursor?.querySelector(".cursor-label");
  const chapterCounter = document.getElementById("chapterCounter");
  const hud = document.querySelector(".hud");
  const hero = document.getElementById("hero");
  const soundToggle = document.getElementById("soundToggle");
  const preloader = document.querySelector(".preloader");
  const preloaderBar = document.querySelector(".preloader-bar i");
  const preloaderPct = document.querySelector("[data-pct]");
  const cosmos = document.getElementById("cosmos");
  const filmGrain = document.getElementById("filmGrain");
  const signalLine = document.getElementById("signalLine");
  const finaleSlides = [...document.querySelectorAll(".finale-slide")];
  const scrollProgress = document.getElementById("scrollProgress");
  const floatLayer = document.getElementById("floatLayer");
  const constellationLabel = document.getElementById("constellationLabel");
  const replayBtn = document.getElementById("replayBtn");
  const beginRide = document.getElementById("beginRide");
  const stoneLore = document.getElementById("stoneLore");
  const gauntletFill = document.getElementById("gauntletFill");
  const gauntletCount = document.getElementById("gauntletCount");
  const constellationLore = document.getElementById("constellationLore");
  const reelLightbox = document.getElementById("reelLightbox");
  const lightboxVideo = document.getElementById("lightboxVideo");
  const lightboxTitle = document.getElementById("lightboxTitle");
  const lightboxClose = document.getElementById("lightboxClose");
  const lightboxAudio = document.getElementById("lightboxAudio");
  const doomsdayType = document.getElementById("doomsdayType");
  const cursorHome = cursor
    ? { parent: cursor.parentNode, next: cursor.nextSibling }
    : null;

  const chapterLabels = {
    hero: "00 · Entry",
    vault: "01 · Vault",
    metrics: "02 · Intel",
    timeline: "03 · Timeline",
    reel: "04 · Reel",
    artifacts: "05 · Artifacts",
    signal: "06 · Signal",
    impact: "07 · Impact",
    portal: "08 · Portal",
    constellation: "09 · Registry",
    moments: "10 · Moments",
    breach: "11 · Breach",
    relics: "12 · Relics",
    stones: "13 · Stones",
    finale: "14 · Finale",
    doomsday: "15 · Future",
  };

  let soundOn = true;
  let pointer = { x: innerWidth / 2, y: innerHeight / 2 };
  let cursorPos = { ...pointer };
  let lastScrollY = scrollY;
  let activeChapter = "";
  let signalTyped = false;
  let lenis = null;
  const gsapReady = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

  const clamp = (v, min = 0, max = 1) => Math.min(Math.max(v, min), max);
  const lerp = (a, b, t) => a + (b - a) * t;

  function syncSoundToggle() {
    if (!soundToggle) return;
    soundToggle.textContent = soundOn ? "Sound On" : "Sound Off";
    soundToggle.setAttribute("aria-pressed", String(soundOn));
  }

  function syncLightboxAudioToggle() {
    if (!lightboxAudio || !lightboxVideo) return;
    const enabled = !lightboxVideo.muted && lightboxVideo.volume > 0;
    lightboxAudio.textContent = enabled ? "Audio On" : "Audio Off";
    lightboxAudio.setAttribute("aria-pressed", String(enabled));
  }

  function moveCursorToLightbox() {
    if (!cursor || !reelLightbox || !hasFinePointer || prefersReduced) return;
    reelLightbox.appendChild(cursor);
    document.body.classList.add("is-lightbox-open", "has-pointer");
  }

  function restoreCursorHome() {
    if (!cursor || !cursorHome?.parent) return;
    if (cursor.parentNode !== cursorHome.parent) {
      cursorHome.parent.insertBefore(
        cursor,
        cursorHome.next?.parentNode === cursorHome.parent ? cursorHome.next : cursorHome.parent.firstChild
      );
    }
    document.body.classList.remove("is-lightbox-open", "cursor-hover");
    if (cursorLabel) cursorLabel.textContent = "";
  }

  /* ── Lenis smooth scroll (must sync with ScrollTrigger) ── */
  function initLenis() {
    if (prefersReduced || typeof Lenis === "undefined") return null;
    const instance = new Lenis({
      duration: 1.12,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.15,
    });

    instance.on("scroll", () => {
      updateScrollUI(instance.scroll);
    });

    if (gsapReady) {
      ScrollTrigger.scrollerProxy(document.documentElement, {
        scrollTop(value) {
          if (arguments.length) {
            instance.scrollTo(value, { immediate: true });
          }
          return instance.scroll;
        },
        getBoundingClientRect() {
          return {
            top: 0,
            left: 0,
            width: innerWidth,
            height: innerHeight,
          };
        },
      });

      ScrollTrigger.addEventListener("refresh", () => instance.resize());
      gsap.ticker.add((time) => instance.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => {
        instance.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }

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

  function playSceneVideo(video) {
    if (video.dataset.forceMuted === "true") {
      video.muted = true;
      video.volume = 0;
      video.play().catch(() => {});
      return;
    }
    const wantsAudio = shouldSceneVideoPlayAudio(video);
    video.muted = !wantsAudio;
    const attempt = video.play();
    if (!attempt?.catch) return;
    attempt.catch(() => {
      video.muted = true;
      video.play().catch(() => {});
    });
  }

  function shouldSceneVideoPlayAudio(video) {
    return soundOn && video.dataset.audioScene === "true" && video.dataset.forceMuted !== "true";
  }

  function syncSceneAudioState() {
    document.querySelectorAll("video").forEach((v) => {
      if (v === lightboxVideo) v.muted = !soundOn;
      else if (v.src) v.muted = !shouldSceneVideoPlayAudio(v);
    });
    syncSoundToggle();
    syncLightboxAudioToggle();
  }

  const videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          hydrateVideo(video);
          playSceneVideo(video);
        } else video.pause();
      });
    },
    { threshold: 0.32 }
  );
  videos.forEach((v) => videoObserver.observe(v));
  syncSoundToggle();

  ["pointerdown", "keydown", "touchstart"].forEach((eventName) => {
    window.addEventListener(
      eventName,
      () => {
        syncSceneAudioState();
        document.querySelectorAll("video[data-audio-scene='true']").forEach((video) => {
          if (video.src && !video.paused) playSceneVideo(video);
        });
        toggleAmbient(soundOn);
      },
      { once: true, passive: true }
    );
  });

  soundToggle?.addEventListener("click", () => {
    soundOn = !soundOn;
    syncSceneAudioState();
    toggleAmbient(soundOn);
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
      "[data-magnetic], [data-tilt], [data-cursor], .reel-card, .artifact-piece, .relic-card, .constellation-node, .stone-btn, .hero-cta, .lightbox-close, .lightbox-audio, .reel-lightbox video"
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

    hero.querySelectorAll(".hero-poster").forEach((poster) => {
      const depth = parseFloat(poster.dataset.depth || 1);
      const dx = (x - innerWidth / 2) * depth * 0.012;
      const dy = (y - innerHeight / 2) * depth * 0.012;
      const scrollFactor = scrollY * 0.015 * depth;
      poster.style.transform = `translate(calc(-50% + var(--px) + ${dx}px), calc(-50% + var(--py) + ${dy - scrollFactor}px)) rotate(var(--rot, 0deg))`;
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

  const heroLore = {
    Steve: "Worthy of the shield — carries a standard, not a weapon.",
    Tony: "Genius, billionaire, playboy, philanthropist — proof of a heart.",
    Thor: "Not a god of hammers. A king who learns humility.",
    Strange: "Fourteen million futures. One path left to win.",
    "T'Challa": "Wakanda forever — courage without borders.",
    Thanos: "Perfectly balanced. The villain who believes he's right.",
  };

  const stoneLoreText = {
    space: "Space · Tesseract blue — bend distance itself.",
    mind: "Mind · Scepter gold — rewrite thought and will.",
    reality: "Reality · Aether crimson — laws of physics optional.",
    power: "Power · Orb violet — raw destructive force.",
    time: "Time · Eye of Agamotto green — rewrite the clock.",
    soul: "Soul · Orange whisper — the price of sacrifice.",
  };

  /* ── Constellation nodes ── */
  function initConstellation() {
    document.querySelectorAll(".constellation-node").forEach((node) => {
      node.addEventListener("click", () => {
        document.querySelectorAll(".constellation-node").forEach((n) => n.classList.remove("is-active"));
        node.classList.add("is-active");
        const name = node.dataset.hero || "";
        if (constellationLabel) {
          constellationLabel.style.opacity = "0";
          window.setTimeout(() => {
            constellationLabel.textContent = name;
            constellationLabel.style.opacity = "1";
          }, 150);
        }
        if (constellationLore) {
          constellationLore.style.opacity = "0";
          window.setTimeout(() => {
            constellationLore.textContent = heroLore[name] || "";
            constellationLore.style.opacity = "1";
          }, 150);
        }
      });
    });
  }

  /* ── Infinity stone collector ── */
  function initStonesCollector() {
    const stonesSection = document.getElementById("stones");
    const buttons = [...document.querySelectorAll(".stone-btn")];
    if (!buttons.length) return;

    const collected = new Set();

    const updateGauntlet = () => {
      const n = collected.size;
      if (gauntletFill) gauntletFill.style.width = `${(n / 6) * 100}%`;
      if (gauntletCount) gauntletCount.textContent = `${n} / 6`;
      if (stonesSection) stonesSection.classList.toggle("is-complete", n === 6);
      if (n === 6 && stoneLore) {
        stoneLore.textContent = "Gauntlet complete. The universe holds its breath.";
        const finale = document.getElementById("finale");
        if (finale && gsapReady && !prefersReduced) {
          gsap.to(stonesSection, { boxShadow: "inset 0 0 120px rgba(201,169,98,0.15)", duration: 1.2 });
        }
      }
    };

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.stone;
        if (!id) return;
        collected.add(id);
        btn.classList.add("is-collected");
        if (stoneLore) stoneLore.textContent = stoneLoreText[id] || "";
        updateGauntlet();
        if (gsapReady && !prefersReduced) {
          gsap.fromTo(btn, { scale: 1.2 }, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.5)" });
        }
      });
    });
  }

  /* ── Reel lightbox + spotlight ── */
  function initReelLightbox() {
    const cards = [...document.querySelectorAll(".reel-card[data-clip]")];
    if (!cards.length || !reelLightbox) return;

    const open = (card) => {
      const src = card.dataset.clip;
      const poster = card.dataset.poster;
      const title = card.dataset.title;
      if (!src || !lightboxVideo) return;
      if (lightboxTitle) lightboxTitle.textContent = title || "";
      lightboxVideo.src = src;
      lightboxVideo.poster = poster || "";
      lightboxVideo.muted = !soundOn;
      syncLightboxAudioToggle();
      moveCursorToLightbox();
      reelLightbox.showModal();
      lightboxVideo.play().catch(() => {});
    };

    const close = () => {
      if (!lightboxVideo) return;
      lightboxVideo.pause();
      lightboxVideo.removeAttribute("src");
      reelLightbox.close();
    };

    cards.forEach((card) => {
      card.addEventListener("click", () => open(card));
    });

    lightboxAudio?.addEventListener("click", () => {
      if (!lightboxVideo?.src) return;
      lightboxVideo.muted = !lightboxVideo.muted;
      soundOn = !lightboxVideo.muted;
      syncSoundToggle();
      syncLightboxAudioToggle();
      toggleAmbient(soundOn);
      lightboxVideo.play().catch(() => {});
    });
    lightboxClose?.addEventListener("click", close);
    reelLightbox.addEventListener("click", (e) => {
      if (e.target === reelLightbox) close();
    });
    reelLightbox.addEventListener("close", () => {
      if (lightboxVideo) {
        lightboxVideo.pause();
        lightboxVideo.removeAttribute("src");
        syncLightboxAudioToggle();
      }
      restoreCursorHome();
    });
  }

  function initReelSpotlight() {
    const cards = [...document.querySelectorAll(".reel-card")];
    if (!cards.length) return;

    const setSpotlight = (index) => {
      cards.forEach((c, i) => c.classList.toggle("is-spotlight", i === index));
    };

    cards.forEach((card, i) => {
      card.addEventListener("mouseenter", () => setSpotlight(i));
      card.addEventListener("focus", () => setSpotlight(i));
    });

    document.querySelector(".reel-track")?.addEventListener("mouseleave", () => {
      cards.forEach((c) => c.classList.remove("is-spotlight"));
    });
  }

  function initSnapBrightnessCue() {
    const snapSlide = document.querySelector('.finale-slide[data-theme="snap"]');
    const snapVideo = snapSlide?.querySelector("video");
    const finalePin = document.querySelector(".finale-pin");
    if (!snapSlide || !snapVideo) return;

    const start = Number(snapVideo.dataset.cueStart || 8.4);
    const end = Number(snapVideo.dataset.cueEnd || 15.8);
    const syncCue = () => {
      const active = snapVideo.currentTime >= start && snapVideo.currentTime <= end;
      snapSlide.classList.toggle("snap-cue", active);
      finalePin?.classList.toggle("snap-cue", active);
    };

    snapVideo.addEventListener("timeupdate", syncCue);
    snapVideo.addEventListener("seeked", syncCue);
    snapVideo.addEventListener("play", syncCue);
    snapVideo.addEventListener("pause", () => {
      snapSlide.classList.remove("snap-cue");
      finalePin?.classList.remove("snap-cue");
    });
  }

  /* ── Begin ride CTA ── */
  function initBeginRide() {
    beginRide?.addEventListener("click", () => {
      const vault = document.getElementById("vault");
      if (!vault) return;
      if (lenis) lenis.scrollTo(vault, { duration: 1.6 });
      else vault.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
    });
  }

  /* ── Ambient sound (Web Audio) ── */
  let ambientCtx = null;
  let ambientNodes = null;

  function toggleAmbient(on) {
    if (prefersReduced) return;
    try {
      if (on) {
        if (!ambientCtx) ambientCtx = new AudioContext();
        if (ambientCtx.state === "suspended") ambientCtx.resume();
        const osc = ambientCtx.createOscillator();
        const gain = ambientCtx.createGain();
        const filter = ambientCtx.createBiquadFilter();
        osc.type = "sine";
        osc.frequency.value = 55;
        filter.type = "lowpass";
        filter.frequency.value = 180;
        gain.gain.value = 0.028;
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ambientCtx.destination);
        osc.start();
        ambientNodes = { osc, gain };
      } else if (ambientNodes) {
        ambientNodes.gain.gain.exponentialRampToValueAtTime(0.001, ambientCtx.currentTime + 0.4);
        ambientNodes.osc.stop(ambientCtx.currentTime + 0.45);
        ambientNodes = null;
      }
    } catch {
      /* Web Audio unavailable */
    }
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

    if (chapterCounter) chapterCounter.textContent = chapterLabels[id]?.slice(0, 2) || "00";
    if (id === "stones") toggleAmbient(false);
    else if (soundOn) toggleAmbient(true);
    if (id === "signal") startSignalTypewriter();
  }

  function getScrollY() {
    return lenis?.scroll ?? scrollY;
  }

  function updateScrollUI(scrollOverride) {
    const currentScroll = scrollOverride ?? getScrollY();
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const pct = clamp(currentScroll / max);
    if (scrollProgress) scrollProgress.style.height = `${pct * 100}%`;

    const goingDown = currentScroll > lastScrollY && currentScroll > innerHeight * 0.55;
    hud?.classList.toggle("is-hidden", goingDown);
    lastScrollY = currentScroll;

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

  /* ── Static memory console ── */
  function initMemoryConsole() {
    const consoleEl = document.querySelector("[data-memory-console]");
    if (!consoleEl) return;

    const screen = consoleEl.querySelector("[data-memory-screen]");
    const visual = consoleEl.querySelector("[data-memory-visual]");
    const caseEl = consoleEl.querySelector("[data-memory-case]");
    const statusEl = consoleEl.querySelector("[data-memory-status]");
    const quoteEl = consoleEl.querySelector("[data-memory-quote]");
    const sourceEl = consoleEl.querySelector("[data-memory-source]");
    const captionEl = consoleEl.querySelector("[data-memory-caption]");
    const traceEl = consoleEl.querySelector("[data-memory-trace]");
    const levelEl = consoleEl.querySelector("[data-memory-level]");
    const archiveEl = consoleEl.querySelector("[data-memory-id]");
    const tabs = [...consoleEl.querySelectorAll("[data-memory]")];

    const files = {
      sacrifice: {
        case: "CASE 001 / SACRIFICE",
        quote: "“We don't trade lives.”",
        caption: "The moment morality became heavier than victory.",
        source: "VISION · INFINITY WAR",
        trace: "Morality / Loss",
        level: "94%",
        id: "MD-001",
        image: "assets/artifacts/vision-avengers-vjxy2blr2sv4m60j.jpg",
      },
      fate: {
        case: "CASE 002 / FATE",
        quote: "“Part of the journey is the end.”",
        caption: "The warning that every heroic arc eventually sends a bill.",
        source: "STEPHEN STRANGE · ENDGAME",
        trace: "Fate / Debt",
        level: "97%",
        id: "MD-002",
        image: "assets/posters/strange-spider.jpg",
      },
      love: {
        case: "CASE 003 / LOVE",
        quote: "“I love you 3000.”",
        caption: "A line so small it carried the weight of an entire universe.",
        source: "TONY STARK · ENDGAME",
        trace: "Family / Legacy",
        level: "100%",
        id: "MD-003",
        image: "assets/posters/tony-heart.jpg",
      },
      return: {
        case: "CASE 004 / RETURN",
        quote: "“On your left.”",
        caption: "The sound of hope arriving through fire and light.",
        source: "SAM WILSON · ENDGAME",
        trace: "Hope / Arrival",
        level: "99%",
        id: "MD-004",
        image: "assets/MV5BMWIyZDljYWMtZGZkNS00YWE0LTkxOWYtM2I1NzJhYmRjMDM3XkEyXkFqcGc@._V1_.jpg",
      },
    };

    const setFile = (key) => {
      const file = files[key];
      if (!file || !screen) return;

      tabs.forEach((tab) => {
        const active = tab.dataset.memory === key;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
        const state = tab.querySelector("i");
        if (state) state.textContent = active ? "Decoded" : "Locked";
      });

      const write = () => {
        if (visual) visual.src = file.image;
        if (caseEl) caseEl.textContent = file.case;
        if (statusEl) statusEl.textContent = "DECODED";
        if (quoteEl) quoteEl.textContent = file.quote;
        if (sourceEl) sourceEl.textContent = file.source;
        if (captionEl) captionEl.textContent = file.caption;
        if (traceEl) traceEl.textContent = file.trace;
        if (levelEl) levelEl.textContent = file.level;
        if (archiveEl) archiveEl.textContent = file.id;
      };

      if (prefersReduced) {
        write();
        return;
      }

      screen.classList.remove("is-decoded");
      screen.classList.add("is-switching");
      window.setTimeout(() => {
        write();
        screen.classList.add("is-decoded");
      }, 120);
      window.setTimeout(() => screen.classList.remove("is-switching"), 560);
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => setFile(tab.dataset.memory));
      if (hasFinePointer) tab.addEventListener("mouseenter", () => setFile(tab.dataset.memory));
    });

    screen?.classList.add("is-decoded");
  }

  /* ── Future coda ── */
  function initFutureCoda() {
    const coda = document.getElementById("doomsday");
    const stage = coda?.querySelector(".coda-stage");
    const scenes = [...document.querySelectorAll("[data-coda-scene]")];
    if (!coda || !stage || !scenes.length) return;

    let typed = false;
    const typeFinal = () => {
      if (typed || !doomsdayType) return;
      typed = true;
      const text = doomsdayType.dataset.text || "";
      doomsdayType.textContent = "";
      if (prefersReduced) {
        doomsdayType.textContent = text;
        return;
      }
      let i = 0;
      const words = text.split(" ");
      const tick = () => {
        doomsdayType.textContent = words.slice(0, i).join(" ");
        i += 1;
        const previous = words[i - 2] || "";
        if (i <= words.length) window.setTimeout(tick, /[.!?]$/.test(previous) ? 360 : 92);
      };
      tick();
    };

    const setScene = (index) => {
      scenes.forEach((scene, i) => scene.classList.toggle("is-active", i === index));
      if (index === 2) typeFinal();
    };

    setScene(0);

    if (prefersReduced || !gsapReady) {
      coda.classList.add("is-unpinned");
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const scene = entry.target;
            if (scene.classList.contains("coda-terminal")) typeFinal();
          });
        },
        { threshold: 0.48 }
      );
      scenes.forEach((scene) => scene.classList.add("is-active"));
      scenes.forEach((scene) => observer.observe(scene));
      return;
    }

    coda.classList.add("is-scrubbing");
    gsap.set(scenes, { autoAlpha: 0, zIndex: 1 });
    gsap.set(scenes[0], { autoAlpha: 1, zIndex: 3 });
    gsap.set(scenes[0].querySelector("img"), { scale: 1.08 });
    gsap.set(scenes[1].querySelector("img"), { scale: 1.08 });

    const codaTl = gsap.timeline({
      scrollTrigger: {
        trigger: coda,
        start: "top top",
        end: () => `+=${innerHeight * 3.6}`,
        pin: true,
        scrub: 0.7,
        anticipatePin: 1,
      },
    });

    codaTl
      .to(scenes[0].querySelector("img"), { scale: 1, duration: 1.1, ease: "none" })
      .to({}, { duration: 0.4 })
      .to(scenes[0], { autoAlpha: 0, duration: 0.65, ease: "power1.inOut" })
      .call(() => setScene(1), [], "<")
      .set(scenes[1], { zIndex: 4 }, "<")
      .fromTo(
        scenes[1],
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.65, ease: "power1.inOut" },
        "<"
      )
      .to(scenes[1].querySelector("img"), { scale: 1, duration: 1.2, ease: "none" })
      .to({}, { duration: 0.45 })
      .to(scenes[1], { autoAlpha: 0, duration: 0.65, ease: "power1.inOut" })
      .call(() => setScene(2), [], "<")
      .set(scenes[2], { zIndex: 5 }, "<")
      .fromTo(
        scenes[2],
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.65, ease: "power1.inOut", onStart: typeFinal },
        "<"
      )
      .to({}, { duration: 1.45 });
  }

  /* ── Breach before/after scrubber ── */
  function initBreachScrubber() {
    const compare = document.getElementById("breachCompare");
    const scrubber = document.getElementById("breachScrubber");
    if (!compare || !scrubber) return;

    const setBreach = (pct) => {
      const value = clamp(pct, 2, 98);
      compare.style.setProperty("--breach", `${value}%`);
      scrubber.value = String(Math.round(value));
    };

    setBreach(parseFloat(scrubber.value) || 50);

    scrubber.addEventListener("input", () => setBreach(parseFloat(scrubber.value)));

    let dragging = false;

    const pointerScrub = (clientX) => {
      const rect = compare.getBoundingClientRect();
      const pct = ((clientX - rect.left) / rect.width) * 100;
      setBreach(pct);
    };

    compare.addEventListener("pointerdown", (e) => {
      dragging = true;
      compare.setPointerCapture(e.pointerId);
      pointerScrub(e.clientX);
    });

    compare.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      pointerScrub(e.clientX);
    });

    compare.addEventListener("pointerup", () => {
      dragging = false;
    });

    compare.addEventListener("pointercancel", () => {
      dragging = false;
    });

    if (prefersReduced || !gsapReady) return;

    gsap.fromTo(
      compare,
      { "--breach": "78%" },
      {
        "--breach": "22%",
        ease: "none",
        scrollTrigger: {
          trigger: "#breach",
          start: "top 65%",
          end: "bottom 35%",
          scrub: 1.2,
        },
      }
    );
  }

  /* ── Saga timeline (pinned 3-act) ── */
  function initTimelinePin() {
    const eras = [...document.querySelectorAll(".timeline-era")];
    const ticks = [...document.querySelectorAll(".timeline-tick")];
    const wrap = document.querySelector(".timeline-pin-wrap");
    if (!eras.length || !wrap) return;

    let activeIndex = 0;

    const activateEra = (index) => {
      const next = clamp(index, 0, eras.length - 1);
      if (next === activeIndex && eras[next].classList.contains("is-active")) return;
      activeIndex = next;
      eras.forEach((era, i) => {
        const on = i === next;
        era.classList.toggle("is-active", on);
        if (!on) gsap.set(era, { clearProps: "opacity,visibility,transform,autoAlpha" });
      });
      ticks.forEach((tick, i) => tick.classList.toggle("is-active", i === next));
    };

    ticks.forEach((tick, i) => {
      tick.addEventListener("click", () => {
        const st = ScrollTrigger.getById("timelinePin");
        if (st) {
          const progress = i / Math.max(1, eras.length - 1);
          const y = st.start + (st.end - st.start) * progress;
          if (lenis) lenis.scrollTo(y, { duration: 1.2 });
          else window.scrollTo({ top: y, behavior: prefersReduced ? "auto" : "smooth" });
        }
        activateEra(i);
      });
    });

    activateEra(0);

    if (prefersReduced || !gsapReady) return;

    ScrollTrigger.create({
      id: "timelinePin",
      trigger: wrap,
      start: "top top",
      end: () => `+=${innerHeight * Math.max(eras.length, 2)}`,
      pin: wrap,
      pinSpacing: true,
      scrub: 0.85,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const index = Math.min(eras.length - 1, Math.floor(self.progress * eras.length));
        activateEra(index);
      },
      onLeave: () => activateEra(eras.length - 1),
      onLeaveBack: () => activateEra(0),
    });
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
        pin: wrap,
        pinSpacing: true,
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

    gsap.from(".hero-boarding", {
      opacity: 0,
      y: 40,
      rotate: 8,
      duration: 1.2,
      ease: "power3.out",
      delay: 1.4,
    });

    /* Vault arc reactor reveal */
    const vaultVideo = document.querySelector(".vault-video");
    const vaultStage = document.querySelector(".vault-stage");
    if (vaultVideo && vaultStage) {
      const vaultTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".vault-pin-wrap",
          start: "top top",
          end: "+=185%",
          pin: true,
          scrub: 0.9,
        },
      });

      vaultTl
        .fromTo(
          vaultVideo,
          {
            autoAlpha: 0,
            y: "0vh",
            scale: 1,
            clipPath: "circle(1% at 50% 78%)",
          },
          {
            autoAlpha: 1,
            y: "0vh",
            scale: 1,
            clipPath: "circle(150% at 50% 78%)",
            ease: "power3.inOut",
            duration: 0.92,
          },
          0.22
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

    }

    /* Timeline pin must register before reel/artifacts so ranges don't overlap */
    initTimelinePin();

    mm.add("(min-width: 901px)", () => {
      pinHorizontal(".reel-track", ".reel-pin-wrap");
      pinHorizontal(".artifacts-track", ".artifacts-pin-wrap");
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

    gsap.from(".breach-compare", {
      opacity: 0,
      scale: 0.92,
      duration: 1.1,
      ease: "power3.out",
      scrollTrigger: { trigger: "#breach", start: "top 72%" },
    });

    initBreachScrubber();

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

    gsap.from(".stones-copy > *, .stones-stage", {
      opacity: 0,
      y: 50,
      stagger: 0.1,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: { trigger: "#stones", start: "top 70%" },
    });

    if (!prefersReduced) {
      gsap.to(".stone-orbit", { rotate: 360, duration: 80, repeat: -1, ease: "none" });
    }

    if (finaleSlides.length) {
      gsap.set(finaleSlides, { autoAlpha: 0, zIndex: 0 });
      gsap.set(finaleSlides[0], { autoAlpha: 1, zIndex: 1 });
      finaleSlides[0].classList.add("is-current");
      const finaleTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".finale-pin-wrap",
          start: "top top",
          end: () => `+=${innerHeight * (finaleSlides.length + 1.15)}`,
          pin: true,
          scrub: 0.72,
          anticipatePin: 1,
        },
      });
      finaleSlides.forEach((slide, i) => {
        if (i === 0) return;
        const previous = finaleSlides[i - 1];
        finaleTl.to({}, { duration: 0.95 });
        finaleTl.add(() => {
          finaleSlides.forEach((s, j) => s.classList.toggle("is-current", j === i));
        });
        finaleTl
          .set(slide, { zIndex: i + 1 })
          .to(previous, { autoAlpha: 0, duration: 0.48, ease: "power3.inOut" })
          .fromTo(
            slide,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.48, ease: "power3.inOut" },
            "<"
          )
          .to({}, { duration: 0.82 });
      });
    }

    initCounters();

    ScrollTrigger.sort();
    ScrollTrigger.refresh(true);

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
    initStonesCollector();
    initReelLightbox();
    initReelSpotlight();
    initSnapBrightnessCue();
    initMemoryConsole();
    initFutureCoda();
    initBeginRide();
    if (prefersReduced) initBreachScrubber();
    setChapter("hero");

    if (prefersReduced) {
      initReducedMotion();
      document.body.classList.remove("is-loading");
    } else {
      await runPreloader();
      if (gsapReady) {
        lenis = initLenis();
        initGSAP();
        ScrollTrigger.refresh(true);
        window.setTimeout(() => ScrollTrigger.refresh(true), 400);
      }
    }

    window.addEventListener("load", () => {
      if (gsapReady) ScrollTrigger.refresh(true);
    });

    updateScrollUI();
    updateHeroReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
