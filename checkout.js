/* =========================================================
   ZACK4GAMES — CHECKOUT
========================================================= */

const CART_KEY =
  "zack4games_cart";

const whatsappNumber =
  "212605689697";

const GAME_PRICE =
  25;

const PAID_FOR_FREE_GAME =
  5;


/* =========================================================
   PLACEHOLDER
========================================================= */

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1100">' +
      '<defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1">' +
      '<stop stop-color="#191b20"/>' +
      '<stop offset="1" stop-color="#0b0c0f"/>' +
      "</linearGradient></defs>" +
      '<rect width="1600" height="1100" fill="url(#g)"/>' +
      '<text x="80" y="140" fill="#6d28d9" font-family="Arial" font-size="52" font-weight="700">Zack4Games</text>' +
      "</svg>"
  );


/* =========================================================
   STATE
========================================================= */

const state = {
  games: [],
  selected: [],
};


/* =========================================================
   DOM
========================================================= */

const dom = {

  items:
    document.getElementById(
      "checkoutItems"
    ),

  empty:
    document.getElementById(
      "checkoutEmpty"
    ),

  count:
    document.getElementById(
      "checkoutCount"
    ),

  summaryCount:
    document.getElementById(
      "summaryCount"
    ),

  summaryTotal:
    document.getElementById(
      "summaryTotal"
    ),

  confirmButton:
    document.getElementById(
      "confirmOrderBtn"
    ),

  modal:
    document.getElementById(
      "confirmModal"
    ),

  modalGameList:
    document.getElementById(
      "modalGameList"
    ),

  modalConfirm:
    document.getElementById(
      "modalConfirmBtn"
    ),
};


/* =========================================================
   OFFER CALCULATOR
========================================================= */

function getOffer(count) {

  const safeCount =
    Math.max(
      0,
      Number(count) || 0
    );

  const freeGames =
    Math.floor(
      safeCount / 6
    );

  const paidGames =
    safeCount -
    freeGames;

  const total =
    paidGames *
    GAME_PRICE;

  const savings =
    freeGames *
    GAME_PRICE;

  const remainder =
    safeCount % 6;

  let progress = 0;
  let remaining = 0;
  let message = "";

  if (safeCount === 0) {

    progress = 0;
    remaining = 5;

    message =
      "Add 5 games to unlock your FREE game";

  } else if (remainder === 5) {

    progress = 100;
    remaining = 1;

    message =
      "FREE GAME UNLOCKED — add 1 more game";

  } else {

    progress =
      (remainder / 5) *
      100;

    remaining =
      5 - remainder;

    message =
      `${remaining} more ${
        remaining === 1
          ? "game"
          : "games"
      } to unlock your FREE game`;

  }

  return {
    count: safeCount,
    freeGames,
    paidGames,
    total,
    savings,
    progress,
    remaining,
    message,
  };
}


/* =========================================================
   CART
========================================================= */

function loadCart() {

  try {

    const saved =
      localStorage.getItem(
        CART_KEY
      );

    if (!saved) {

      state.selected = [];

      return;
    }

    const parsed =
      JSON.parse(saved);

    if (
      Array.isArray(parsed)
    ) {

      state.selected =
        parsed.map(String);

    } else {

      state.selected = [];

    }

  } catch (error) {

    console.error(
      "Failed to load cart:",
      error
    );

    state.selected = [];

  }
}


function saveCart() {

  try {

    localStorage.setItem(
      CART_KEY,
      JSON.stringify(
        state.selected
      )
    );

  } catch (error) {

    console.error(
      "Failed to save cart:",
      error
    );

  }
}


/* =========================================================
   HELPERS
========================================================= */

function decodeHtml(value) {

  const element =
    document.createElement(
      "textarea"
    );

  element.innerHTML =
    value ?? "";

  return element.value;
}


function escapeHtml(value) {

  return String(
    value ?? ""
  )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function normalizeGame(game) {

  return {

    ...game,

    appid:
      String(
        game.appid
      ),

    title:
      decodeHtml(
        game.name ||
        game.title ||
        ""
      ),

    desc:
      decodeHtml(
        game.description ||
        game.desc ||
        ""
      ),

    image:
      game.image_url ||
      game.img ||
      game.image ||
      "",

    tags:
      Array.isArray(
        game.tags
      )
        ? game.tags
        : [],

  };
}


/* =========================================================
   IMAGE
========================================================= */

function imageUrlFor(game) {

  return game.image || "";
}


async function loadImage(
  img,
  url
) {

  if (!url) {

    img.src =
      PLACEHOLDER_IMAGE;

    return;

  }

  /*
    Important:
    We don't fetch the image with JS.
    That avoids the SteamGridDB CORS problem.
  */

  img.src =
    url;

  img.onerror = () => {

    img.onerror = null;

    img.src =
      PLACEHOLDER_IMAGE;

  };
}


/* =========================================================
   SELECTED GAMES
========================================================= */

function getSelectedGames() {

  const ids =
    new Set(
      state.selected.map(
        String
      )
    );

  return state.games.filter(
    (game) =>
      ids.has(
        String(
          game.appid
        )
      )
  );
}


/* =========================================================
   OFFER BOX
========================================================= */

function createCheckoutOffer(
  count
) {

  const offer =
    getOffer(count);

  const box =
    document.createElement(
      "section"
    );

  box.className =
    "checkout-offer-box";

  if (
    offer.freeGames > 0
  ) {

    box.classList.add(
      "has-free"
    );

  } else if (
    offer.remaining === 1
  ) {

    box.classList.add(
      "almost-free"
    );

  }

  box.innerHTML = `

    <div class="checkout-offer-top">

      <div class="checkout-offer-icon">
        🎁
      </div>

      <div class="checkout-offer-copy">

        <div class="checkout-offer-title">
          BUY 5, GET 1 FREE
        </div>

        <div class="checkout-offer-message">
          ${offer.message}
        </div>

      </div>

      ${
        offer.freeGames > 0
          ? `
            <div class="checkout-free-badge">
              ${offer.freeGames} FREE
            </div>
          `
          : ""
      }

    </div>


    <div class="checkout-offer-progress">

      <div
        class="checkout-offer-fill"
        style="width:${offer.progress}%"
      ></div>

    </div>


    <div class="checkout-offer-bottom">

      <span>
        ${
          offer.freeGames > 0
            ? `${offer.freeGames} free game${offer.freeGames > 1 ? "s" : ""}`
            : `${Math.min(count % 6, 5)} / 5`
        }
      </span>

      ${
        offer.savings > 0
          ? `
            <strong>
              You save ${offer.savings} DH
            </strong>
          `
          : `
            <span>
              ${GAME_PRICE} DH / game
            </span>
          `
      }

    </div>

  `;

  return box;
}


/* =========================================================
   REMOVE
========================================================= */

function removeGame(
  appid
) {

  state.selected =
    state.selected.filter(
      (id) =>
        String(id) !==
        String(appid)
    );

  saveCart();

  render();
}


/* =========================================================
   CHECKOUT ITEM
========================================================= */

function createCheckoutItem(
  game,
  free
) {

  const article =
    document.createElement(
      "article"
    );

  article.className =
    "checkout-item";

  if (free) {

    article.classList.add(
      "is-free"
    );

  }

  const tags =
    game.tags
      .slice(0, 3)
      .map(
        (tag) =>
          `<span class="checkout-item-tag">${escapeHtml(tag)}</span>`
      )
      .join("");

  article.innerHTML = `

    <div class="checkout-item-image">

      <img
        src="${PLACEHOLDER_IMAGE}"
        alt="${escapeHtml(
          game.title
        )}"
      />

      ${
        free
          ? `
            <span class="checkout-free-label">
              FREE
            </span>
          `
          : ""
      }

    </div>


    <div class="checkout-item-content">

      <div class="checkout-item-top">

        <div>

          <p class="checkout-item-label">

            ${
              free
                ? "FREE GAME"
                : "STEAM GAME"
            }

          </p>

          <h3>
            ${escapeHtml(
              game.title
            )}
          </h3>

        </div>

        <button
          class="checkout-remove"
          type="button"
          data-remove-id="${escapeHtml(
            game.appid
          )}"
          aria-label="Remove ${escapeHtml(
            game.title
          )}"
        >
          Remove
        </button>

      </div>


      <div class="checkout-item-tags">

        ${tags}

      </div>


      <p class="checkout-item-description">

        ${
          escapeHtml(
            game.desc ||
            "Steam game available in the Zack4Games catalog."
          )
        }

      </p>


      <div class="checkout-item-price">

        ${
          free
            ? `
              <span class="checkout-old-price">
                ${GAME_PRICE} DH
              </span>

              <strong>
                FREE
              </strong>
            `
            : `
              <strong>
                ${GAME_PRICE} DH
              </strong>
            `
        }

      </div>

    </div>

  `;

  const image =
    article.querySelector(
      "img"
    );

  loadImage(
    image,
    imageUrlFor(game)
  );

  return article;
}


/* =========================================================
   RENDER
========================================================= */

function render() {

  const games =
    getSelectedGames();

  const count =
    games.length;

  const offer =
    getOffer(count);


  /* EMPTY */

  if (
    count === 0
  ) {

    dom.items.innerHTML =
      "";

    dom.items.hidden =
      true;

    dom.empty.hidden =
      false;

    dom.confirmButton.disabled =
      true;

    dom.count.textContent =
      "0 games";

    dom.summaryCount.textContent =
      "0";

    dom.summaryTotal.textContent =
      "0 DH";

    return;

  }


  /* SHOW ITEMS */

  dom.items.hidden =
    false;

  dom.empty.hidden =
    true;

  dom.confirmButton.disabled =
    false;

  dom.items.innerHTML =
    "";


  /*
    Offer box
  */

  dom.items.appendChild(
    createCheckoutOffer(
      count
    )
  );


  /*
    Display games.
    The LAST game(s) of each group of 6
    are free.
  */

  games.forEach(
    (game, index) => {

      const isFree =
        offer.freeGames > 0 &&
        index >=
          offer.paidGames;

      dom.items.appendChild(
        createCheckoutItem(
          game,
          isFree
        )
      );

    }
  );


  /* SUMMARY */

  dom.count.textContent =
    count === 1
      ? "1 game"
      : `${count} games`;


  dom.summaryCount.textContent =
    String(count);


  dom.summaryTotal.textContent =
    `${offer.total} DH`;


  /*
    Update any existing summary
    fields if they exist.
  */

  const summaryPaid =
    document.getElementById(
      "summaryPaidGames"
    );

  const summaryFree =
    document.getElementById(
      "summaryFreeGames"
    );

  const summarySavings =
    document.getElementById(
      "summarySavings"
    );

  if (summaryPaid) {

    summaryPaid.textContent =
      String(
        offer.paidGames
      );

  }

  if (summaryFree) {

    summaryFree.textContent =
      String(
        offer.freeGames
      );

  }

  if (summarySavings) {

    summarySavings.textContent =
      `${offer.savings} DH`;

  }

}


/* =========================================================
   LOAD CATALOG
========================================================= */

async function loadGames() {

  try {

    /*
      IMPORTANT:
      GitHub Pages doesn't have /api/games.
      Use the static games.json.
    */

    const response =
      await fetch(
        "./games.json"
      );

    if (!response.ok) {

      throw new Error(
        `Catalog request failed (${response.status})`
      );

    }

    const payload =
      await response.json();

    const data =
      Array.isArray(payload)
        ? payload
        : payload.games;

    if (
      !Array.isArray(data)
    ) {

      throw new Error(
        "Invalid catalog response."
      );

    }

    state.games =
      data.map(
        normalizeGame
      );

    render();

  } catch (error) {

    console.error(error);

    dom.items.hidden =
      false;

    dom.empty.hidden =
      true;

    dom.items.innerHTML = `

      <div class="checkout-error">

        <h3>
          Unable to load your cart
        </h3>

        <p>
          ${escapeHtml(
            error.message
          )}
        </p>

        <a
          href="index.html"
          class="button button-secondary"
        >
          Return to store
        </a>

      </div>

    `;

    dom.confirmButton.disabled =
      true;

  }
}


/* =========================================================
   WHATSAPP MESSAGE
========================================================= */

function buildWhatsappMessage() {

  const games =
    getSelectedGames();

  if (
    !games.length
  ) {

    return "";

  }

  const offer =
    getOffer(
      games.length
    );

  const titles =
    games
      .map(
        (game, index) => {

          const free =
            index >=
            offer.paidGames;

          return free
            ? `- ${game.title} — FREE`
            : `- ${game.title} — ${GAME_PRICE} DH`;

        }
      )
      .join("\n");


  return (
    `Hello, I want these Steam games from Zack4Games:\n\n` +
    `${titles}\n\n` +
    `Games: ${games.length}\n` +
    `Paid games: ${offer.paidGames}\n` +
    `Free games: ${offer.freeGames}\n` +
    `Total: ${offer.total} DH\n` +
    `Savings: ${offer.savings} DH\n\n` +
    `Please send me the details.`
  );

}


/* =========================================================
   MODAL
========================================================= */

function openModal() {

  const games =
    getSelectedGames();

  if (
    !games.length
  ) {

    return;

  }

  const offer =
    getOffer(
      games.length
    );

  dom.modalGameList.innerHTML =
    games
      .map(
        (game, index) => {

          const free =
            index >=
            offer.paidGames;

          return `

            <div class="modal-game">

              <span>

                ${escapeHtml(
                  game.title
                )}

                ${
                  free
                    ? `
                      <small class="modal-free">
                        FREE
                      </small>
                    `
                    : ""
                }

              </span>

              <strong class="modal-game-check">

                ${
                  free
                    ? "FREE"
                    : `${GAME_PRICE} DH`
                }

              </strong>

            </div>

          `;

        }
      )
      .join("");


  dom.modal.hidden =
    false;

  document.body.classList.add(
    "modal-open"
  );

  setTimeout(
    () => {

      dom.modalConfirm.focus();

    },
    50
  );

}


function closeModal() {

  dom.modal.hidden =
    true;

  document.body.classList.remove(
    "modal-open"
  );

}


/* =========================================================
   WHATSAPP
========================================================= */

function confirmOrder() {

  const message =
    buildWhatsappMessage();

  if (!message) {

    return;

  }

  const url =
    `https://wa.me/${whatsappNumber}?text=` +
    encodeURIComponent(
      message
    );

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );

}


/* =========================================================
   EVENTS
========================================================= */

dom.items.addEventListener(
  "click",
  (event) => {

    const button =
      event.target.closest(
        "[data-remove-id]"
      );

    if (!button) {

      return;

    }

    removeGame(
      button.dataset.removeId
    );

  }
);


dom.confirmButton.addEventListener(
  "click",
  (event) => {

    event.preventDefault();

    openModal();

  }
);


dom.modalConfirm.addEventListener(
  "click",
  (event) => {

    event.preventDefault();

    confirmOrder();

  }
);


document
  .querySelectorAll(
    "[data-close-modal]"
  )
  .forEach(
    (element) => {

      element.addEventListener(
        "click",
        closeModal
      );

    }
  );


document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Escape" &&
      !dom.modal.hidden
    ) {

      closeModal();

    }

  }
);


/* =========================================================
   INIT
========================================================= */

loadCart();

loadGames();