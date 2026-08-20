/* =========================================================
   ZACK4GAMES — STORE APP
========================================================= */

const state = {
  games: [],
  filter: "all",
  query: "",
  sort: "featured",
  selected: [],
  currentPage: 1,
};

const pageSize = 30;

const whatsappNumber = "212605689797";

const CART_KEY = "zack4games_cart";


/* =========================================================
   PLACEHOLDER IMAGE
========================================================= */

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1100">' +
      "<defs>" +
        '<linearGradient id="g" x1="0" x2="1" y1="0" y2="1">' +
          '<stop stop-color="#191b20"/>' +
          '<stop offset="1" stop-color="#0b0c0f"/>' +
        "</linearGradient>" +
      "</defs>" +
      '<rect width="1600" height="1100" fill="url(#g)"/>' +
      '<path d="M0 850L420 610L760 720L1160 430L1600 610V1100H0Z" fill="#050608" fill-opacity="0.58"/>' +
      '<text x="88" y="140" fill="#6d28d9" font-family="Arial, sans-serif" font-size="52" font-weight="700">Zack4Games</text>' +
    "</svg>"
  );


/* =========================================================
   DOM
========================================================= */

const dom = {

  grid:
    document.getElementById("catalogGrid"),

  empty:
    document.getElementById("emptyState"),

  search:
    document.getElementById("searchInput"),

  sort:
    document.getElementById("sortSelect"),

  featuredStrip:
    document.getElementById("featuredStrip"),

  filterButtons: [
    ...document.querySelectorAll("[data-filter]"),
  ],

  pageButtons: [
    ...document.querySelectorAll("[data-page-action]"),
  ],

  stats: {

    total:
      document.querySelector(
        '[data-stat="total-games"]'
      ),

    totalPanel:
      document.querySelector(
        '[data-stat="total-games-panel"]'
      ),

    visible:
      document.querySelector(
        '[data-stat="visible-games"]'
      ),

    visibleInline:
      document.querySelector(
        '[data-stat="visible-games-inline"]'
      ),

    selected:
      document.querySelector(
        '[data-stat="selected-games"]'
      ),

    selectedPanel:
      document.querySelector(
        '[data-stat="selected-games-panel"]'
      ),

    pageRange:
      document.querySelector(
        '[data-stat="page-range"]'
      ),

    pageCurrent:
      document.querySelector(
        '[data-stat="page-current"]'
      ),

    pageCurrentTop:
      document.querySelector(
        '[data-stat="page-current-top"]'
      ),

    pageCurrentBottom:
      document.querySelector(
        '[data-stat="page-current-bottom"]'
      ),

    pageTotal:
      document.querySelector(
        '[data-stat="page-total"]'
      ),

    pageTotalTop:
      document.querySelector(
        '[data-stat="page-total-top"]'
      ),

    pageTotalBottom:
      document.querySelector(
        '[data-stat="page-total-bottom"]'
      ),
  },

  floatingCart:
    document.getElementById("floatingCart"),

  floatingCartCount:
    document.getElementById("floatingCartCount"),

  navCartCount:
    document.getElementById("navCartCount"),

  toast:
    document.getElementById("storeToast"),
};


/* =========================================================
   CART STORAGE
========================================================= */

function loadCart() {

  try {

    const saved =
      localStorage.getItem(CART_KEY);

    if (!saved) {

      state.selected = [];

      return;
    }

    const parsed =
      JSON.parse(saved);

    if (Array.isArray(parsed)) {

      state.selected =
        parsed.map(String);

    }

  } catch {

    state.selected = [];

  }
}


function saveCart() {

  try {

    localStorage.setItem(
      CART_KEY,
      JSON.stringify(state.selected)
    );

  } catch {

    // Ignore localStorage errors.

  }
}


/* =========================================================
   HELPERS
========================================================= */

function decodeHtml(value) {

  const element =
    document.createElement("textarea");

  element.innerHTML =
    value ?? "";

  return element.value;
}


function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function normalizeTag(tag) {

  if (!tag) {
    return "";
  }

  const cleaned =
    String(tag).trim();

  if (
    /^u+ubisoft$/i.test(cleaned) ||
    /^ubisoft$/i.test(cleaned)
  ) {

    return "Ubisoft";

  }

  if (/^online$/i.test(cleaned)) {

    return "Online";

  }

  if (/^denuvo$/i.test(cleaned)) {

    return "Denuvo";

  }

  if (/^rockstar$/i.test(cleaned)) {

    return "Rockstar";

  }

  return cleaned
    .replace(/^u\s*/i, "")
    .trim();
}


/* =========================================================
   NORMALIZE GAME
========================================================= */

function normalizeGame(game, index) {

  const tags = [
    ...new Set(
      (game.tags ?? [])
        .map(normalizeTag)
        .filter(Boolean)
    ),
  ];

  const title =
    decodeHtml(
      game.name ||
      game.title ||
      ""
    );

  const description =
    decodeHtml(
      game.description ||
      game.desc ||
      ""
    );

  return {

    ...game,

    index,

    title,

    desc: description,

    image:
      game.image_url ||
      game.img ||
      game.image ||
      "",

    releaseTs:
      game.release_ts ||
      0,

    createdAt:
      game.created_at ||
      "",

    tags,

    searchText:
      `${title} ${description} ${tags.join(" ")}`
        .toLowerCase(),
  };
}


/* =========================================================
   SORTING
========================================================= */

function sortGames(list) {

  const sorted = [...list];

  switch (state.sort) {

    case "title-asc":

      return sorted.sort(
        (a, b) =>
          a.title.localeCompare(b.title)
      );


    case "release-oldest":

      return sorted.sort(
        (a, b) =>
          (a.releaseTs || 0) -
          (b.releaseTs || 0)
      );


    case "release-newest":

      return sorted.sort(
        (a, b) =>
          (b.releaseTs || 0) -
          (a.releaseTs || 0)
      );


    case "newest":

      return sorted.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );


    case "featured":

    default:

      return sorted.sort(
        (a, b) =>
          (b.gen_count || 0) -
            (a.gen_count || 0) ||
          a.index -
            b.index
      );
  }
}


/* =========================================================
   IMAGES
   IMPORTANT:
   We DO NOT use fetch() here.
   We directly assign the external URL to <img>.
========================================================= */

function imageUrlFor(game) {

  return (
    game.image ||
    PLACEHOLDER_IMAGE
  );
}


function setImageSource(img) {

  const url =
    img.dataset.imageUrl || "";

  if (!url) {

    img.src =
      PLACEHOLDER_IMAGE;

    return;
  }

  img.onerror = function () {

    /*
      Prevent an infinite loop if the
      placeholder itself ever fails.
    */

    img.onerror = null;

    img.src =
      PLACEHOLDER_IMAGE;
  };

  /*
    Direct image loading.

    NO fetch()
    NO blob()
    NO object URL
    NO CORS issue from JavaScript
  */

  img.src = url;
}


function hydrateImages(scope = document) {

  const images = [
    ...scope.querySelectorAll(
      "img[data-image-url]"
    ),
  ];

  images.forEach((img) => {

    if (
      img.dataset.hydrated === "true"
    ) {

      return;
    }

    img.dataset.hydrated = "true";

    setImageSource(img);

  });
}


/* =========================================================
   FILTERING
========================================================= */

function filterGames() {

  const query =
    state.query
      .trim()
      .toLowerCase();

  return sortGames(
    state.games.filter(
      (game) => {

        const matchesFilter =
          state.filter === "all" ||
          game.tags.some(
            (tag) =>
              tag.toLowerCase() ===
              state.filter.toLowerCase()
          );

        const matchesQuery =
          !query ||
          game.searchText.includes(query);

        return (
          matchesFilter &&
          matchesQuery
        );
      }
    )
  );
}


/* =========================================================
   PAGINATION
========================================================= */

function getPageCount(total) {

  return Math.max(
    1,
    Math.ceil(
      total / pageSize
    )
  );
}


function getPageSlice(list) {

  const totalPages =
    getPageCount(list.length);

  const currentPage =
    Math.min(
      state.currentPage,
      totalPages
    );

  const start =
    (currentPage - 1) *
    pageSize;

  const end =
    start +
    pageSize;

  return {

    currentPage,

    totalPages,

    start,

    end,

    items:
      list.slice(
        start,
        end
      ),
  };
}


/* =========================================================
   SELECTED GAMES
========================================================= */

function selectedGames() {

  const selectedIds =
    new Set(state.selected);

  return state.games.filter(
    (game) =>
      selectedIds.has(
        String(game.appid)
      )
  );
}


/* =========================================================
   CART UI
========================================================= */

function updateCartUI() {

  const count =
    state.selected.length;

  if (dom.navCartCount) {

    dom.navCartCount.textContent =
      String(count);

  }

  if (
    dom.floatingCart &&
    dom.floatingCartCount
  ) {

    dom.floatingCartCount.textContent =
      String(count);

    dom.floatingCart.classList.toggle(
      "has-items",
      count > 0
    );

    dom.floatingCartCount.classList.toggle(
      "is-empty",
      count === 0
    );

  }

  if (dom.stats.selected) {

    dom.stats.selected.textContent =
      String(count);

  }

  if (dom.stats.selectedPanel) {

    dom.stats.selectedPanel.textContent =
      String(count);

  }
}


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

  if (!dom.toast) {

    return;
  }

  dom.toast.textContent =
    message;

  dom.toast.classList.add(
    "is-visible"
  );

  clearTimeout(
    dom.toast._timer
  );

  dom.toast._timer =
    setTimeout(
      () => {

        dom.toast.classList.remove(
          "is-visible"
        );

      },
      1800
    );
}


/* =========================================================
   FEATURED GAMES
========================================================= */

function renderFeatured(games) {

  if (!dom.featuredStrip) {

    return;
  }

  const picks =
    games.slice(0, 5);

  dom.featuredStrip.innerHTML =
    picks
      .map(
        (game, index) => `

          <article
            class="featured-card featured-card-${index + 1}"
          >

            <img
              src="${PLACEHOLDER_IMAGE}"
              data-image-url="${escapeHtml(
                imageUrlFor(game)
              )}"
              alt="${escapeHtml(game.title)}"
              loading="lazy"
            />

            <div
              class="featured-card-overlay"
            >

              <span>
                ${escapeHtml(
                  game.tags[0] ||
                  "Steam"
                )}
              </span>

              <strong>
                ${escapeHtml(
                  game.title
                )}
              </strong>

            </div>

          </article>

        `
      )
      .join("");

  hydrateImages(
    dom.featuredStrip
  );
}


/* =========================================================
   GAME CARD
========================================================= */

function createCard(game, index) {

  const card =
    document.createElement("article");

  card.className =
    "shop-card";

  card.style.setProperty(
    "--delay",
    `${Math.min(index, 20) * 35}ms`
  );

  const isSelected =
    state.selected.includes(
      String(game.appid)
    );

  if (isSelected) {

    card.classList.add(
      "is-selected"
    );
  }

  const tags =
    game.tags.length
      ? game.tags
      : ["Steam"];

  const tagsMarkup =
    tags
      .slice(0, 3)
      .map(
        (tag) =>
          `<span class="shop-tag">${escapeHtml(tag)}</span>`
      )
      .join("");

  card.innerHTML = `

    <div
      class="shop-card-img-wrap"
    >

      <img
        class="shop-card-img"
        src="${PLACEHOLDER_IMAGE}"
        data-image-url="${escapeHtml(
          imageUrlFor(game)
        )}"
        alt="${escapeHtml(game.title)}"
        loading="lazy"
      />

      <div
        class="shop-card-overlay"
      >

        <span
          class="shop-card-overlay-add"
        >

          ${
            isSelected
              ? "✓ In cart"
              : "Add to cart"
          }

        </span>

      </div>

      ${
        isSelected
          ? `
            <div
              class="shop-card-selected-mark"
            >
              ✓
            </div>
          `
          : ""
      }

    </div>


    <div
      class="shop-card-body"
    >

      <div
        class="shop-card-head"
      >

        <div>

          <h3
            class="shop-card-name"
          >
            ${escapeHtml(game.title)}
          </h3>

        </div>


        <button
          class="shop-card-toggle ${
            isSelected
              ? "is-selected"
              : ""
          }"
          type="button"
          data-appid="${game.appid}"
        >

          ${
            isSelected
              ? "✓ Added"
              : "Add"
          }

        </button>

      </div>


      <div
        class="shop-card-tags"
      >

        ${tagsMarkup}

      </div>


      <p
        class="shop-card-desc"
      >

        ${
          escapeHtml(
            game.desc ||
            "Steam game available in the Zack4Games catalog."
          )
        }

      </p>


      <div
        class="shop-card-foot"
      >

        <span
          class="shop-card-meta"
        >
          Steam game
        </span>


        <button
          class="shop-card-button ${
            isSelected
              ? "is-selected"
              : ""
          }"
          type="button"
          data-appid="${game.appid}"
        >

          ${
            isSelected
              ? "✓ In cart"
              : "Add to cart"
          }

        </button>

      </div>

    </div>

  `;

  return card;
}


/* =========================================================
   RENDER
========================================================= */

function render() {

  const visibleGames =
    filterGames();

  const {
    currentPage,
    totalPages,
    start,
    end,
    items,
  } =
    getPageSlice(
      visibleGames
    );

  state.currentPage =
    currentPage;

  dom.grid.innerHTML =
    "";

  const fragment =
    document.createDocumentFragment();

  items.forEach(
    (game, index) => {

      fragment.appendChild(
        createCard(
          game,
          start + index
        )
      );

    }
  );

  dom.grid.appendChild(
    fragment
  );

  renderFeatured(
    visibleGames.length
      ? visibleGames
      : state.games
  );

  dom.grid.setAttribute(
    "aria-busy",
    "false"
  );

  dom.empty.hidden =
    visibleGames.length > 0;

  hydrateImages(
    dom.grid
  );


  /* =====================================================
     STATS
  ====================================================== */

  if (dom.stats.visible) {

    dom.stats.visible.textContent =
      String(items.length);

  }

  if (dom.stats.visibleInline) {

    dom.stats.visibleInline.textContent =
      String(visibleGames.length);

  }

  if (dom.stats.total) {

    dom.stats.total.textContent =
      String(state.games.length);

  }

  if (dom.stats.totalPanel) {

    dom.stats.totalPanel.textContent =
      String(state.games.length);

  }

  if (dom.stats.pageRange) {

    dom.stats.pageRange.textContent =
      visibleGames.length
        ? `${start + 1}-${Math.min(
            end,
            visibleGames.length
          )}`
        : "0-0";
  }

  if (dom.stats.pageCurrent) {

    dom.stats.pageCurrent.textContent =
      String(currentPage);

  }

  if (dom.stats.pageCurrentTop) {

    dom.stats.pageCurrentTop.textContent =
      String(currentPage);

  }

  if (dom.stats.pageCurrentBottom) {

    dom.stats.pageCurrentBottom.textContent =
      String(currentPage);

  }

  if (dom.stats.pageTotal) {

    dom.stats.pageTotal.textContent =
      String(totalPages);

  }

  if (dom.stats.pageTotalTop) {

    dom.stats.pageTotalTop.textContent =
      String(totalPages);

  }

  if (dom.stats.pageTotalBottom) {

    dom.stats.pageTotalBottom.textContent =
      String(totalPages);

  }

  updateCartUI();
}


/* =========================================================
   TOGGLE CART
========================================================= */

function toggleSelection(appid) {

  const key =
    String(appid);

  const index =
    state.selected.indexOf(key);

  if (index >= 0) {

    state.selected.splice(
      index,
      1
    );

    showToast(
      "Game removed from cart"
    );

  } else {

    state.selected.push(key);

    showToast(
      "Game added to cart"
    );
  }

  saveCart();

  render();
}


/* =========================================================
   LOAD DATA
========================================================= */

async function loadData() {

  const response =
    await fetch(
      "./games.json"
    );

  if (!response.ok) {

    throw new Error(
      `Failed to load catalog (${response.status})`
    );
  }

  const payload =
    await response.json();

  const games =
    Array.isArray(payload)
      ? payload
      : payload.games;

  if (!Array.isArray(games)) {

    throw new Error(
      "Invalid games.json format"
    );
  }

  state.games =
    games.map(
      (game, index) =>
        normalizeGame(
          game,
          index
        )
    );

  render();
}


/* =========================================================
   FILTER
========================================================= */

function setActiveFilter(value) {

  state.filter =
    value;

  state.currentPage =
    1;

  dom.filterButtons.forEach(
    (button) => {

      button.classList.toggle(
        "is-active",
        button.dataset.filter ===
          value
      );

    }
  );

  render();
}


/* =========================================================
   EVENTS
========================================================= */


/* FILTERS */

dom.filterButtons.forEach(
  (button) => {

    button.addEventListener(
      "click",
      () =>
        setActiveFilter(
          button.dataset.filter
        )
    );

  }
);


/* SEARCH */

if (dom.search) {

  dom.search.addEventListener(
    "input",
    (event) => {

      state.query =
        event.target.value;

      state.currentPage =
        1;

      render();

    }
  );

}


/* SORT */

if (dom.sort) {

  dom.sort.addEventListener(
    "change",
    (event) => {

      state.sort =
        event.target.value;

      state.currentPage =
        1;

      render();

    }
  );

}


/* GAME GRID */

if (dom.grid) {

  dom.grid.addEventListener(
    "click",
    (event) => {

      const button =
        event.target.closest(
          "[data-appid]"
        );

      if (!button) {

        return;
      }

      toggleSelection(
        button.dataset.appid
      );

    }
  );

}


/* PAGINATION */

dom.pageButtons.forEach(
  (button) => {

    button.addEventListener(
      "click",
      () => {

        const totalPages =
          getPageCount(
            filterGames().length
          );

        if (
          button.dataset.pageAction ===
          "prev"
        ) {

          state.currentPage =
            Math.max(
              1,
              state.currentPage - 1
            );

        } else {

          state.currentPage =
            Math.min(
              totalPages,
              state.currentPage + 1
            );
        }

        render();

        document
          .getElementById("store")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });

      }
    );

  }
);


/* =========================================================
   INIT
========================================================= */

loadCart();

updateCartUI();


loadData()
  .catch(
    (error) => {

      console.error(
        "Zack4Games catalog error:",
        error
      );

      dom.grid.innerHTML = `

        <div
          class="catalog-load-error"
        >

          <div>
            ⚠️
          </div>

          <h3>
            Catalog failed to load.
          </h3>

          <p>
            ${escapeHtml(
              error.message
            )}
          </p>

        </div>

      `;

      dom.grid.setAttribute(
        "aria-busy",
        "false"
      );

      dom.empty.hidden =
        true;
    }
  );