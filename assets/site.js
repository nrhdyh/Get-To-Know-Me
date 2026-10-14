(() => {
  "use strict";
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const desktop = matchMedia("(min-width: 901px)");
  let userPaused = false;
  try {
    userPaused = localStorage.getItem("hidayah-motion") === "off";
  } catch (_) {
    /* Storage is optional. */
  }
  let motion = !reduced.matches && !userPaused;
  root.classList.add("js-enabled");
  const motionButton = document.querySelector("[data-motion-toggle]");
  function setMotion() {
    motion = !reduced.matches && !userPaused;
    root.classList.toggle("motion-active", motion);
    root.classList.toggle("motion-off", !motion);
    if (motionButton) {
      motionButton.hidden = false;
      motionButton.setAttribute("aria-pressed", String(motion));
      motionButton.disabled = reduced.matches;
      motionButton.textContent = reduced.matches
        ? "Reduced motion"
        : motion
          ? "Motion on"
          : "Motion off";
      motionButton.setAttribute(
        "aria-label",
        reduced.matches
          ? "Reduced motion preference is active"
          : motion
            ? "Turn decorative motion off"
            : "Turn decorative motion on",
      );
    }
    if (!motion)
      document
        .querySelectorAll(".reveal-ready")
        .forEach((el) => el.classList.add("is-visible"));
    document.dispatchEvent(new Event("motionchange"));
  }
  motionButton?.addEventListener("click", () => {
    userPaused = !userPaused;
    try {
      localStorage.setItem("hidayah-motion", userPaused ? "off" : "on");
    } catch (_) {
      /* Storage is optional. */
    }
    setMotion();
  });
  reduced.addEventListener("change", setMotion);
  setMotion();

  const nav = document.getElementById("navigation");
  const menu = document.getElementById("menuToggle");
  if (menu && nav) {
    menu.hidden = false;
    function toggleMenu(open, returnFocus = false) {
      nav.classList.toggle("is-open", open);
      menu.setAttribute("aria-expanded", String(open));
      menu.setAttribute(
        "aria-label",
        open ? "Close navigation" : "Open navigation",
      );
      menu.textContent = open ? "×" : "☰";
      if (returnFocus) menu.focus();
    }
    menu.addEventListener("click", () =>
      toggleMenu(menu.getAttribute("aria-expanded") !== "true"),
    );
    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) toggleMenu(false);
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".site-header")) toggleMenu(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.getAttribute("aria-expanded") === "true")
        toggleMenu(false, true);
    });
    matchMedia("(max-width: 900px)").addEventListener("change", () =>
      toggleMenu(false),
    );
  }

  if ("IntersectionObserver" in window && motion) {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.05, rootMargin: "0px 0px 35px 0px" },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      observer.observe(el);
      el.style.setProperty(
        "--reveal-delay",
        `${Math.min(3, Number(el.dataset.step) || 0) * 0.07}s`,
      );
      el.classList.add("reveal-ready");
    });
  }
  document.addEventListener("focusin", (e) => {
    e.target.closest("[data-reveal]")?.classList.add("is-visible");
    if (e.target.closest(".site-header,.back-top,.skip-link")) return;
    const y = e.target.getBoundingClientRect().top;
    const bottom =
      document.querySelector(".site-header")?.getBoundingClientRect().bottom ||
      0;
    if (y < bottom + 12)
      window.scrollBy({ top: y - bottom - 22, behavior: "instant" });
  });

  const projects = [...document.querySelectorAll("[data-project]")];
  const filters = [...document.querySelectorAll("[data-filter]")];
  const search = document.getElementById("projectSearch");
  const status = document.getElementById("projectStatus");
  const library = document.getElementById("projectLibrary");
  if (projects.length && search && status) {
    document.getElementById("projectTools").hidden = false;
    let category = "all";
    const index = projects.map((el) =>
      `${el.textContent} ${el.dataset.search || ""}`.toLowerCase(),
    );
    function filterProjects() {
      const query = search.value.trim().toLowerCase();
      let count = 0;
      projects.forEach((el, i) => {
        el.hidden =
          !(
            category === "all" ||
            el.dataset.category.split(" ").includes(category)
          ) || !index[i].includes(query);
        if (!el.hidden) {
          count++;
          el.querySelectorAll("[data-reveal]").forEach((node) =>
            node.classList.add("is-visible"),
          );
        }
      });
      filters.forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.filter === category),
        ),
      );
      status.textContent =
        category === "all" && !query
          ? "11 projects · selected work below"
          : `${count} of ${projects.length} entries match${query ? ` “${search.value.trim()}”` : ""}`;
      const archiveCount = library
        ? [...library.querySelectorAll("[data-project]")].filter(
            (el) => !el.hidden,
          ).length
        : 0;
      if (library) {
        library.hidden = archiveCount === 0;
        library.querySelector("[data-library-count]").textContent =
          `${String(archiveCount).padStart(2, "0")} more documented projects`;
        if (category !== "all" || query) library.open = true;
      }
      const pair = document.querySelector(".project-pair");
      if (pair)
        pair.hidden = [...pair.querySelectorAll("[data-project]")].every(
          (el) => el.hidden,
        );
      document.getElementById("emptyState").hidden = count > 0;
    }
    filters.forEach((button) =>
      button.addEventListener("click", () => {
        category = button.dataset.filter;
        filterProjects();
      }),
    );
    search.addEventListener("input", filterProjects);
    document.getElementById("resetProjects")?.addEventListener("click", () => {
      category = "all";
      search.value = "";
      filterProjects();
      search.focus();
    });
  }

  const insight = document.getElementById("skillInsight");
  const chips = [...document.querySelectorAll("[data-skill]")];
  chips.forEach((button) =>
    button.addEventListener("click", () => {
      const active = button.getAttribute("aria-pressed") !== "true";
      chips.forEach((chip) =>
        chip.setAttribute("aria-pressed", String(chip === button && active)),
      );
      if (insight)
        insight.textContent = active
          ? `${button.textContent.trim()}: ${button.dataset.skill}`
          : "Choose a tool above to see where it fits into my work.";
    }),
  );

  const progress = document.getElementById("scrollProgress");
  const backTop = document.getElementById("backTop");
  const navSections = [...document.querySelectorAll('.nav-link[href^="#"]')]
    .map((link) => ({
      link,
      section: document.querySelector(link.getAttribute("href")),
    }))
    .filter((item) => item.section);
  const parallaxImage = document.querySelector("[data-parallax]");
  let scrollFrame = 0;
  function updateScroll() {
    scrollFrame = 0;
    const max = root.scrollHeight - innerHeight;
    if (progress)
      progress.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0})`;
    if (backTop) backTop.hidden = scrollY < 600;
    let current = null;
    navSections.forEach((item) => {
      if (item.section.getBoundingClientRect().top <= 180) current = item.link;
    });
    navSections.forEach(({ link }) => {
      if (link === current) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    if (parallaxImage) {
      const rect = parallaxImage.parentElement.getBoundingClientRect();
      const active =
        motion &&
        fine.matches &&
        desktop.matches &&
        rect.top < innerHeight &&
        rect.bottom > 0;
      parallaxImage.style.transform = active
        ? `translateY(${Math.max(-5, Math.min(5, (innerHeight / 2 - rect.top - rect.height / 2) * 0.015))}px)`
        : "";
    }
  }
  window.addEventListener(
    "scroll",
    () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
    },
    { passive: true },
  );
  window.addEventListener("resize", updateScroll);
  document.addEventListener("motionchange", updateScroll);
  backTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: motion ? "smooth" : "auto" });
    document.querySelector(".brand")?.focus({ preventScroll: true });
  });
  updateScroll();

  // One bounded canvas per selected background; no animation outside the viewport.
  document.querySelectorAll("[data-constellation]").forEach((canvas) => {
    const ctx = canvas.getContext("2d");
    if (!ctx || !("IntersectionObserver" in window)) return;
    let width = 0,
      height = 0,
      frame = 0,
      visible = false,
      nodes = [],
      last = 0;
    const pointer = { x: -1000, y: -1000 };
    function size() {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(
        30,
        Math.max(12, Math.round((width * height) / 27000)),
      );
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
      }));
    }
    function allowed() {
      return (
        motion && fine.matches && desktop.matches && visible && !document.hidden
      );
    }
    function paint(time) {
      frame = 0;
      if (!allowed()) return;
      if (time - last < 33) {
        frame = requestAnimationFrame(paint);
        return;
      }
      const delta = Math.min(2, (time - last) / 33 || 1);
      last = time;
      ctx.clearRect(0, 0, width, height);
      nodes.forEach((n) => {
        n.x += n.vx * delta;
        n.y += n.vy * delta;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
        const dx = n.x - pointer.x,
          dy = n.y - pointer.y,
          distance = Math.hypot(dx, dy);
        if (distance > 0 && distance < 110) {
          n.x += (dx / distance) * 0.12;
          n.y += (dy / distance) * 0.12;
        }
      });
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j],
            d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 150) {
            ctx.strokeStyle = `rgba(70,133,173,${0.12 * (1 - d / 150)})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        ctx.fillStyle = "rgba(61,130,175,.2)";
        ctx.beginPath();
        ctx.arc(a.x, a.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      frame = requestAnimationFrame(paint);
    }
    function sync() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      if (allowed()) {
        last = performance.now();
        frame = requestAnimationFrame(paint);
      } else if (!motion || !desktop.matches || !fine.matches)
        ctx.clearRect(0, 0, width, height);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        sync();
      },
      { threshold: 0 },
    );
    observer.observe(canvas);
    canvas.parentElement.addEventListener(
      "pointermove",
      (e) => {
        if (!allowed()) return;
        const r = canvas.getBoundingClientRect();
        pointer.x = e.clientX - r.left;
        pointer.y = e.clientY - r.top;
      },
      { passive: true },
    );
    canvas.parentElement.addEventListener("pointerleave", () => {
      pointer.x = pointer.y = -1000;
    });
    window.addEventListener("resize", () => {
      size();
      sync();
    });
    fine.addEventListener("change", sync);
    desktop.addEventListener("change", sync);
    document.addEventListener("motionchange", sync);
    document.addEventListener("visibilitychange", sync);
    size();
  });

  // Retain the native cursor. The trail has at most 16 dots and stops when idle.
  const trail = document.getElementById("cursorTrail");
  const label = document.getElementById("cursorLabel");
  if (trail) {
    const ctx = trail.getContext("2d");
    let dots = [],
      frame = 0,
      lastPoint = { x: -1000, y: -1000 };
    function enabled() {
      return motion && fine.matches && desktop.matches && !document.hidden;
    }
    function size() {
      trail.width = innerWidth;
      trail.height = innerHeight;
    }
    function draw(now) {
      frame = 0;
      if (!ctx) return;
      ctx.clearRect(0, 0, trail.width, trail.height);
      dots = dots.filter((dot) => now - dot.time < 440 && enabled());
      dots.forEach((dot) => {
        ctx.fillStyle = `rgba(66,147,196,${0.4 * (1 - (now - dot.time) / 440)})`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
      if (dots.length) frame = requestAnimationFrame(draw);
    }
    document.addEventListener(
      "pointermove",
      (e) => {
        if (!enabled() || e.pointerType === "touch") return;
        const target = e.target.closest("[data-cursor]");
        if (label) {
          label.classList.toggle("is-visible", Boolean(target));
          label.textContent = target?.dataset.cursor || "";
          label.style.left = `${Math.min(e.clientX, innerWidth - 125)}px`;
          label.style.top = `${Math.min(e.clientY, innerHeight - 55)}px`;
        }
        if (Math.hypot(e.clientX - lastPoint.x, e.clientY - lastPoint.y) > 13) {
          dots.push({ x: e.clientX, y: e.clientY, time: performance.now() });
          dots = dots.slice(-16);
          lastPoint = { x: e.clientX, y: e.clientY };
          if (!frame) frame = requestAnimationFrame(draw);
        }
      },
      { passive: true },
    );
    function clear() {
      dots = [];
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      ctx?.clearRect(0, 0, trail.width, trail.height);
      label?.classList.remove("is-visible");
    }
    document.documentElement.addEventListener("pointerleave", clear);
    document.addEventListener("motionchange", clear);
    document.addEventListener("visibilitychange", clear);
    fine.addEventListener("change", clear);
    desktop.addEventListener("change", clear);
    window.addEventListener("resize", () => {
      size();
      clear();
    });
    size();
  }

  document.querySelectorAll("[data-magnetic],[data-tilt]").forEach((el) => {
    let frame = 0,
      x = 0,
      y = 0;
    const magnetic = el.hasAttribute("data-magnetic");
    function reset() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      el.style.transform = "";
    }
    el.addEventListener(
      "pointermove",
      (e) => {
        if (
          !motion ||
          !fine.matches ||
          !desktop.matches ||
          e.pointerType === "touch"
        )
          return;
        const r = el.getBoundingClientRect();
        x = (e.clientX - r.left) / r.width - 0.5;
        y = (e.clientY - r.top) / r.height - 0.5;
        if (!frame)
          frame = requestAnimationFrame(() => {
            frame = 0;
            el.style.transform = magnetic
              ? `translate(${x * 7}px,${y * 7}px)`
              : `perspective(1200px) rotateX(${-y * 1.8}deg) rotateY(${x * 1.8}deg) translateY(-2px)`;
          });
      },
      { passive: true },
    );
    el.addEventListener("pointerleave", reset);
    el.addEventListener("blur", reset, true);
    document.addEventListener("motionchange", reset);
    fine.addEventListener("change", reset);
    desktop.addEventListener("change", reset);
  });
  document.addEventListener("visibilitychange", () =>
    root.classList.toggle("page-hidden", document.hidden),
  );
})();
