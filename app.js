// Busca no índice, categoria ativa, sumário da ficha e botão de copiar código.
(() => {
  const norm = (s) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const input = document.getElementById("q");

  // "/" foca a busca, como no GitHub.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    e.preventDefault();
    input?.focus();
    input?.select();
  });

  // Destaca no menu a última seção cujo topo já passou da linha logo abaixo das barras fixas.
  const spy = (links) => {
    const pares = links
      .map((a) => [document.getElementById(decodeURIComponent(a.hash.slice(1))), a])
      .filter(([el]) => el);
    if (!pares.length) return;
    let atual = null;
    const atualizar = () => {
      const topo = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) + 8;
      const linha = Math.max(topo, innerHeight * 0.3);
      const visiveis = pares.filter(([el]) => !el.hidden);
      let escolhido = visiveis[0];
      for (const par of visiveis) if (par[0].getBoundingClientRect().top <= linha) escolhido = par;
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) escolhido = visiveis.at(-1);
      const link = escolhido?.[1] ?? null;
      if (link === atual) return;
      atual?.removeAttribute("aria-current");
      atual = link;
      if (!link) return;
      link.setAttribute("aria-current", "true");
      const nav = link.closest(".catnav");
      if (nav && nav.scrollWidth > nav.clientWidth) {
        nav.scrollTo({ left: link.offsetLeft - 16, behavior: "smooth" });
      }
    };
    let pendente = false;
    addEventListener("scroll", () => {
      if (pendente) return;
      pendente = true;
      requestAnimationFrame(() => { pendente = false; atualizar(); });
    }, { passive: true });
    addEventListener("resize", atualizar);
    atualizar();
    return atualizar;
  };

  if (document.body.classList.contains("page-index")) {
    const items = [...document.querySelectorAll(".item")];
    const cats = [...document.querySelectorAll(".cat")];
    const navLinks = [...document.querySelectorAll(".catnav a")];
    const count = document.getElementById("result-count");
    const empty = document.getElementById("empty");
    const total = items.length;

    const filtrar = () => {
      const termos = norm(input.value.trim()).split(/\s+/).filter(Boolean);
      let shown = 0;
      items.forEach((li) => {
        const ok = termos.every((t) => li.dataset.q.includes(t));
        li.hidden = !ok;
        if (ok) shown++;
      });
      cats.forEach((sec) => {
        const n = sec.querySelectorAll(".item:not([hidden])").length;
        sec.hidden = n === 0;
        sec.querySelector(".cat-count").textContent = n;
        const link = navLinks.find((a) => a.hash === "#" + sec.id);
        if (link) {
          link.classList.toggle("is-empty", n === 0);
          link.querySelector(".nav-count").textContent = n;
        }
      });
      empty.hidden = shown !== 0;
      count.textContent = termos.length
        ? `${shown} de ${total} projetos para “${input.value.trim()}”`
        : "";
      const url = new URL(location.href);
      termos.length ? url.searchParams.set("q", input.value.trim()) : url.searchParams.delete("q");
      history.replaceState(null, "", url);
    };

    const q = new URLSearchParams(location.search).get("q");
    if (q) input.value = q;
    input.addEventListener("input", filtrar);
    input.closest("form").addEventListener("submit", (e) => e.preventDefault());
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && input.value) { input.value = ""; filtrar(); }
    });
    document.getElementById("clear-search").addEventListener("click", () => {
      input.value = "";
      filtrar();
      input.focus();
    });
    if (q) filtrar();
    const atualizarMenu = spy(navLinks);
    input.addEventListener("input", () => atualizarMenu?.());
  }

  if (document.body.classList.contains("page-ficha")) {
    spy([...document.querySelectorAll(".toc a")]);

    document.querySelectorAll(".prose pre").forEach((pre) => {
      const wrap = document.createElement("div");
      wrap.className = "code";
      pre.replaceWith(wrap);
      wrap.append(pre);
      if (!navigator.clipboard) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "copy";
      btn.textContent = "Copiar";
      btn.setAttribute("aria-label", "Copiar código");
      btn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(pre.innerText.replace(/\n$/, ""));
          btn.textContent = "Copiado";
          btn.classList.add("is-done");
        } catch {
          btn.textContent = "Erro ao copiar";
        }
        setTimeout(() => { btn.textContent = "Copiar"; btn.classList.remove("is-done"); }, 1600);
      });
      wrap.append(btn);
    });
  }
})();
