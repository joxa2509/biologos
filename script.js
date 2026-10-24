const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");
const navLinks = document.querySelectorAll(".nav a");

function closeMenu() {
  nav?.classList.remove("is-open");
  navToggle?.classList.remove("is-active");
  navToggle?.setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");
}

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");

    navToggle.classList.toggle("is-active", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("menu-open", isOpen);
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

const progress = document.getElementById("progress");

function updateProgress() {
  if (!progress) return;

  const scrollable = document.documentElement.scrollHeight - window.innerHeight;

  const value = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;

  progress.style.width = `${value}%`;
}

window.addEventListener("scroll", updateProgress, { passive: true });
updateProgress();

if (!window.AOS) {
  // без интернета AOS не загрузится — показываем блоки сразу
  document.querySelectorAll("[data-aos]").forEach((el) => el.removeAttribute("data-aos"));
}

if (window.AOS) {
  AOS.init({
    duration: 750,
    easing: "ease-out-cubic",
    once: true,
    offset: 70,
    disable: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  });
}

const copyButton = document.getElementById("copyNotes");
const status = document.getElementById("formStatus");

if (copyButton && status) {
  copyButton.addEventListener("click", async () => {
    const labels = [...document.querySelectorAll(".observation-form label")];

    const values = labels.map((label) => {
      const field = label.querySelector("input, textarea");
      const title = label.childNodes[0]?.textContent.trim() || "Поле";
      const value = field?.value.trim() || "не заполнено";

      return `${title}: ${value}`;
    });

    const text = `Карточка микроскопического наблюдения\n\n${values.join("\n")}`;

    try {
      await navigator.clipboard.writeText(text);
      status.textContent = "Заметки скопированы.";
    } catch {
      const helper = document.createElement("textarea");

      helper.value = text;
      helper.style.position = "fixed";
      helper.style.opacity = "0";

      document.body.appendChild(helper);
      helper.select();

      const copied = document.execCommand("copy");
      helper.remove();

      status.textContent = copied
        ? "Заметки скопированы."
        : "Не удалось скопировать. Выделите и скопируйте текст вручную.";
    }
  });
}


/* ---------- Просмотр фотографий (lightbox) ---------- */
(function () {
  const items = [...document.querySelectorAll("img[data-zoom]")];
  if (!items.length) return;

  const box = document.createElement("div");
  box.className = "lightbox";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "Просмотр фотографии");
  box.hidden = true;
  box.innerHTML = `
    <button class="lightbox__close" type="button" aria-label="Закрыть">×</button>
    <button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="Предыдущее фото">‹</button>
    <figure class="lightbox__figure">
      <img class="lightbox__img" alt="" />
      <figcaption class="lightbox__caption"></figcaption>
    </figure>
    <button class="lightbox__nav lightbox__nav--next" type="button" aria-label="Следующее фото">›</button>
    <span class="lightbox__count" aria-hidden="true"></span>`;
  document.body.appendChild(box);

  const view = box.querySelector(".lightbox__img");
  const caption = box.querySelector(".lightbox__caption");
  const count = box.querySelector(".lightbox__count");
  let group = [];
  let index = 0;
  let lastFocus = null;

  function captionFor(img) {
    const fig = img.closest("figure")?.querySelector("figcaption");
    const card = img.closest(".gallery-item")?.querySelector(".gallery-item__caption");
    if (fig) return fig.textContent.trim();
    if (card) return card.innerText.replace(/\s*\n\s*/g, " — ").trim();
    return img.alt;
  }

  function show(i) {
    index = (i + group.length) % group.length;
    const img = group[index];
    view.src = img.currentSrc || img.src;
    view.alt = img.alt;
    caption.textContent = captionFor(img);
    const multi = group.length > 1;
    box.classList.toggle("lightbox--single", !multi);
    count.textContent = multi ? `${index + 1} / ${group.length}` : "";
  }

  function open(img) {
    const key = img.dataset.zoom;
    group = items.filter((el) => el.dataset.zoom === key);
    lastFocus = document.activeElement;
    show(group.indexOf(img));
    box.hidden = false;
    document.body.classList.add("menu-open");
    box.querySelector(".lightbox__close").focus();
  }

  function close() {
    box.hidden = true;
    view.removeAttribute("src");
    document.body.classList.remove("menu-open");
    lastFocus?.focus?.();
  }

  items.forEach((img) => {
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.addEventListener("click", () => open(img));
    img.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open(img);
      }
    });
  });

  box.addEventListener("click", (e) => {
    if (e.target === box || e.target.closest(".lightbox__close")) close();
    else if (e.target.closest(".lightbox__nav--prev")) show(index - 1);
    else if (e.target.closest(".lightbox__nav--next")) show(index + 1);
  });

  document.addEventListener("keydown", (e) => {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });

  let startX = 0;
  box.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
  });
})();
