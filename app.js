(() => {
  "use strict";
  const api = (window.YAHYASF_API || "").replace(/\/+$/, "");
  const $ = (id) => document.getElementById(id);
  const player = $("player");
  const playerFrame = $("player-frame");
  const empty = $("player-empty");
  const loading = $("player-loading");
  const grid = $("episode-grid");
  const status = $("player-status");
  const search = $("episode-search");
  const speed = $("speed-select");
  let episodes = [];
  let activeIndex = -1;
  let favoritesOnly = false;
  let autoplayNext = localStorage.getItem("yahyasf-autoplay-next") !== "false";

  $("year").textContent = new Date().getFullYear();

  const progressKey = (id) => `yahyasf-progress-${id}`;
  const favoriteKey = "yahyasf-favorites";

  function getFavorites() {
    try { return new Set(JSON.parse(localStorage.getItem(favoriteKey) || "[]")); }
    catch { return new Set(); }
  }
  function saveFavorites(set) {
    localStorage.setItem(favoriteKey, JSON.stringify([...set]));
  }
  function getProgress(id) {
    const raw = localStorage.getItem(progressKey(id));
    if (!raw) return 0;
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === "number" ? parsed : Number(parsed.time || 0);
    } catch { return Number(raw) || 0; }
  }
  function setStatus(message, kind = "") {
    status.textContent = message;
    status.dataset.kind = kind;
  }
  function setConnection(connected) {
    const el = $("connection");
    el.classList.toggle("online", connected);
    el.classList.toggle("offline", !connected);
    el.lastChild.textContent = connected ? " متصل بالخادم" : " الخادم غير متصل";
  }
  function setPlayerBusy(busy) {
    loading.hidden = !busy;
    if (busy) empty.hidden = true;
  }
  function updatePlayerButtons() {
    $("previous-btn").disabled = activeIndex <= 0;
    $("next-btn").disabled = activeIndex < 0 || activeIndex >= episodes.length - 1;
    $("back-10").disabled = !player.src;
    $("forward-10").disabled = !player.src;
  }

  function createEpisodeCard(ep, index) {
    const card = document.createElement("article");
    card.className = "episode-card";
    if (index === activeIndex) card.classList.add("active");
    card.dataset.id = ep.id;

    const top = document.createElement("div");
    top.className = "episode-card-top";
    const number = document.createElement("span");
    number.className = "episode-number";
    number.textContent = String(ep.number).padStart(2, "0");
    const format = document.createElement("span");
    format.className = "source-format";
    format.textContent = ep.available ? (ep.sourceFormat || "VIDEO") : "غير مضافة";
    top.append(number, format);

    const title = document.createElement("h3");
    title.textContent = ep.title;
    const foot = document.createElement("div");
    foot.className = "episode-card-foot";
    const play = document.createElement("button");
    play.type = "button";
    play.className = "episode-play";
    play.textContent = ep.available ? "مشاهدة الحلقة ↗" : "الملف غير موجود";
    play.disabled = !ep.available;
    play.addEventListener("click", () => playEpisode(index));
    const fav = document.createElement("button");
    fav.type = "button";
    fav.className = "favorite-btn";
    const favorites = getFavorites();
    fav.textContent = favorites.has(ep.id) ? "♥" : "♡";
    fav.setAttribute("aria-label", favorites.has(ep.id) ? "إزالة من المفضلة" : "إضافة للمفضلة");
    fav.setAttribute("aria-pressed", favorites.has(ep.id) ? "true" : "false");
    fav.addEventListener("click", () => {
      const next = getFavorites();
      if (next.has(ep.id)) next.delete(ep.id); else next.add(ep.id);
      saveFavorites(next);
      renderEpisodes();
    });
    foot.append(play, fav);

    const progress = document.createElement("div");
    progress.className = "episode-progress";
    const fill = document.createElement("span");
    const saved = getProgress(ep.id);
    const savedDuration = (() => {
      try { return Number(JSON.parse(localStorage.getItem(progressKey(ep.id)) || "{}").duration || 0); }
      catch { return 0; }
    })();
    const percentage = savedDuration > 0 ? Math.min(100, (saved / savedDuration) * 100) : 0;
    fill.style.width = `${percentage}%`;
    progress.append(fill);
    card.append(top, title, foot, progress);
    card.addEventListener("click", (event) => {
      if (!event.target.closest("button")) playEpisode(index);
    });
    return card;
  }

  function renderEpisodes() {
    const query = search.value.trim().toLocaleLowerCase("ar");
    const favorites = getFavorites();
    const filtered = episodes.filter(ep => {
      const matchesQuery = ep.title.toLocaleLowerCase("ar").includes(query) || String(ep.number).includes(query);
      return matchesQuery && (!favoritesOnly || favorites.has(ep.id));
    });
    grid.replaceChildren();
    if (!filtered.length) {
      const emptyRow = document.createElement("div");
      emptyRow.className = "loading-row";
      emptyRow.textContent = favoritesOnly ? "لم تضف أي حلقة إلى المفضلة بعد." : "لا توجد حلقات تطابق البحث.";
      grid.append(emptyRow);
      return;
    }
    filtered.forEach(ep => {
      const originalIndex = episodes.findIndex(item => item.id === ep.id);
      grid.append(createEpisodeCard(ep, originalIndex));
    });
  }

  function playEpisode(index) {
    const ep = episodes[index];
    if (!ep || !ep.available) return;
    activeIndex = index;
    updatePlayerButtons();
    renderEpisodes();
    $("playing-title").textContent = ep.title;
    setPlayerBusy(true);
    setStatus(`يتم تجهيز ${ep.title}…`);
    empty.hidden = true;

    const expectedUrl = `${api}/video/${encodeURIComponent(ep.id)}`;
    if (player.dataset.episode !== ep.id) {
      player.pause();
      player.src = expectedUrl;
      player.dataset.episode = ep.id;
      player.load();
      player.addEventListener("loadedmetadata", function restoreProgress() {
        const saved = getProgress(ep.id);
        if (saved > 5 && saved < player.duration - 10) {
          try { player.currentTime = saved; } catch {}
        }
        player.removeEventListener("loadedmetadata", restoreProgress);
      });
    } else {
      player.currentTime = getProgress(ep.id) || player.currentTime;
    }
    player.play().catch(() => setStatus(`تم تجهيز ${ep.title}. اضغط تشغيل من المشغل.`, "info"));
    location.hash = "watch";
  }

  async function loadLibrary() {
    if (!api || api.includes("REPLACE-WITH")) {
      setConnection(false);
      grid.innerHTML = '<div class="loading-row error-row">ضع رابط نفق HTTPS في ملف site/config.js أولاً.</div>';
      setStatus("لم يتم إعداد رابط خادم الفيديو بعد.", "error");
      return;
    }
    try {
      const health = await fetch(`${api}/health`, {cache: "no-store"});
      if (!health.ok) throw new Error("Health check failed");
      const response = await fetch(`${api}/api/episodes`, {cache: "no-store"});
      if (!response.ok) throw new Error("Episode API failed");
      const data = await response.json();
      episodes = data.episodes || [];
      setConnection(true);
      $("episode-count").textContent = String(episodes.filter(ep => ep.available).length);
      renderEpisodes();
      setStatus("اتصلنا بالخادم. اختر حلقة للمشاهدة.");
    } catch (error) {
      setConnection(false);
      grid.innerHTML = '<div class="loading-row error-row">الخادم غير متاح حالياً. تأكد من تشغيل جهاز الاستضافة والنفق.</div>';
      setStatus("تعذر الاتصال بخادم YahyaSF.", "error");
    }
  }

  player.addEventListener("loadstart", () => setPlayerBusy(true));
  player.addEventListener("waiting", () => setPlayerBusy(true));
  player.addEventListener("canplay", () => {
    setPlayerBusy(false);
    if (activeIndex >= 0) setStatus(`جاهز للمشاهدة: ${episodes[activeIndex].title}`);
  });
  player.addEventListener("playing", () => {
    setPlayerBusy(false);
    if (activeIndex >= 0) setStatus(`أنت تشاهد ${episodes[activeIndex].title}`);
  });
  player.addEventListener("error", async () => {
    setPlayerBusy(false);
    let message = "تعذر تشغيل الفيديو. تحقق من الملف وصيغته.";
    try {
      const response = await fetch(`${api}/video/${episodes[activeIndex].id}`, {method: "HEAD"});
      if (!response.ok) {
        const detail = await response.json();
        message = detail.message || message;
      }
    } catch {}
    setStatus(message, "error");
  });
  player.addEventListener("timeupdate", () => {
    const id = player.dataset.episode;
    if (id && Number.isFinite(player.currentTime)) {
      localStorage.setItem(progressKey(id), JSON.stringify({
        time: player.currentTime,
        duration: Number.isFinite(player.duration) ? player.duration : 0
      }));
    }
  });
  player.addEventListener("ended", () => {
    if (autoplayNext && activeIndex >= 0 && activeIndex < episodes.length - 1) playEpisode(activeIndex + 1);
    else setStatus("انتهت الحلقة. يمكنك اختيار الحلقة التالية.");
  });

  $("previous-btn").addEventListener("click", () => playEpisode(activeIndex - 1));
  $("next-btn").addEventListener("click", () => playEpisode(activeIndex + 1));
  $("back-10").addEventListener("click", () => { player.currentTime = Math.max(0, player.currentTime - 10); });
  $("forward-10").addEventListener("click", () => { player.currentTime = Math.min(player.duration || Infinity, player.currentTime + 10); });
  speed.addEventListener("change", () => { player.playbackRate = Number(speed.value); });
  search.addEventListener("input", renderEpisodes);
  $("favorites-filter").addEventListener("click", () => {
    favoritesOnly = !favoritesOnly;
    $("favorites-filter").setAttribute("aria-pressed", String(favoritesOnly));
    renderEpisodes();
  });

  document.addEventListener("keydown", (event) => {
    if (event.target.matches("input, select, textarea, button")) return;
    if (event.code === "Space" || event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (player.paused) player.play().catch(() => {});
      else player.pause();
    } else if (event.key === "ArrowLeft" || event.key.toLowerCase() === "j") {
      if (player.src) player.currentTime = Math.max(0, player.currentTime - 10);
    } else if (event.key === "ArrowRight" || event.key.toLowerCase() === "l") {
      if (player.src) player.currentTime = Math.min(player.duration || Infinity, player.currentTime + 10);
    } else if (event.key.toLowerCase() === "f") {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else playerFrame.requestFullscreen?.();
    }
  });

  loadLibrary();
})();
