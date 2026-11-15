(() => {
  const api = (window.YAHYASF_API || "").replace(/\/+$/, "");
  const grid = document.getElementById("episode-grid");
  const player = document.getElementById("player");
  const placeholder = document.getElementById("placeholder");
  const status = document.getElementById("player-status");
  const title = document.getElementById("playing-title");
  document.getElementById("year").textContent = new Date().getFullYear();

  function showError(message) {
    grid.innerHTML = `<div class="loading error">${message}</div>`;
    status.textContent = message;
  }
  function playEpisode(ep) {
    title.textContent = ep.title;
    placeholder.hidden = true;
    player.hidden = false;
    const source = `${api}/video/${encodeURIComponent(ep.id)}`;
    if (player.dataset.episode !== ep.id) {
      player.pause();
      player.src = source;
      player.dataset.episode = ep.id;
      const saved = Number(localStorage.getItem(`yahyasf-progress-${ep.id}`) || 0);
      player.addEventListener("loadedmetadata", function restore() {
        if (saved > 5 && saved < player.duration - 10) player.currentTime = saved;
        player.removeEventListener("loadedmetadata", restore);
      });
    }
    status.textContent = "أنت تشاهد " + ep.title;
    player.play().catch(() => { status.textContent = "اضغط تشغيل لبدء الحلقة."; });
    document.querySelectorAll(".episode").forEach(el => el.classList.toggle("active", el.dataset.id === ep.id));
    location.hash = "watch";
  }
  player.addEventListener("timeupdate", () => {
    const id = player.dataset.episode;
    if (id && Number.isFinite(player.currentTime)) localStorage.setItem(`yahyasf-progress-${id}`, String(player.currentTime));
  });
  player.addEventListener("error", () => { status.textContent = "تعذر تشغيل الحلقة. تأكد أن جهاز الاستضافة متصل وأن ملف الحلقة موجود."; });

  async function load() {
    if (!api || api.includes("REPLACE-WITH")) {
      showError("أكمل إعداد رابط الخادم في ملف site/config.js أولاً.");
      return;
    }
    try {
      const response = await fetch(`${api}/api/episodes`);
      if (!response.ok) throw new Error("HTTP " + response.status);
      const data = await response.json();
      document.getElementById("episode-count").textContent = data.episodes.length;
      grid.innerHTML = "";
      data.episodes.forEach(ep => {
        const card = document.createElement("button");
        card.className = "episode";
        card.type = "button";
        card.dataset.id = ep.id;
        card.innerHTML = `<span class="episode-number">${String(ep.number).padStart(2,"0")}</span><span class="episode-info"><strong>${ep.title}</strong><small>مشاهدة الحلقة</small></span><span class="episode-play">▶</span>`;
        card.addEventListener("click", () => playEpisode(ep));
        grid.appendChild(card);
      });
      status.textContent = "تم الاتصال بالخادم. اختر حلقة للمشاهدة.";
    } catch (err) {
      showError("الخادم غير متاح حالياً. قد يكون جهاز الاستضافة مغلقاً أو النفق متوقفاً.");
    }
  }
  load();
})();
