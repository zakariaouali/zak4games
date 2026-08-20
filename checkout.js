const CART_KEY = "zack4games_cart";
const whatsappNumber = "212605689797";


/* =========================================================
   PLACEHOLDER
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
      '<text x="80" y="140" fill="#4f8ef7" font-family="Arial" font-size="52" font-weight="700">Zack4Games</text>' +
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
   STORAGE
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
      JSON.parse(
        saved
      );


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
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}


/* =========================================================
   NORMALIZE GAME
========================================================= */

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

/*
  IMPORTANT:

  We DO NOT use fetch() for images.

  GitHub Pages cannot proxy SteamGridDB images
  through /api/image.

  We simply give the external URL directly
  to the <img> element.
*/

function imageUrlFor(game) {

  return (
    game.image ||
    PLACEHOLDER_IMAGE
  );

}


/*
  Direct browser image loading.

  If the external image fails, replace it
  with our local placeholder.
*/

function setupImage(
  img,
  url
) {

  if (!url) {

    img.src =
      PLACEHOLDER_IMAGE;

    return;

  }


  img.src = url;


  img.addEventListener(
    "error",
    () => {

      /*
        Prevent an infinite loop if
        the placeholder itself somehow fails.
      */

      if (
        img.dataset.failed ===
        "true"
      ) {

        return;

      }


      img.dataset.failed =
        "true";


      img.src =
        PLACEHOLDER_IMAGE;

    },
    {
      once: true,
    }
  );

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
   CART OPERATIONS
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
  game
) {

  const article =
    document.createElement(
      "article"
    );


  article.className =
    "checkout-item";


  const tags =
    game.tags
      .slice(
        0,
        3
      )
      .map(
        (tag) =>
          `<span class="checkout-item-tag">${escapeHtml(tag)}</span>`
      )
      .join("");


  article.innerHTML = `

    <div class="checkout-item-image">

      <img
        src="${PLACEHOLDER_IMAGE}"
        alt="${escapeHtml(game.title)}"
      />

    </div>


    <div class="checkout-item-content">

      <div class="checkout-item-top">

        <div>

          <p class="checkout-item-label">
            Steam game
          </p>

          <h3>
            ${escapeHtml(game.title)}
          </h3>

        </div>


        <button
          class="checkout-remove"
          type="button"
          data-remove-id="${escapeHtml(game.appid)}"
          aria-label="Remove ${escapeHtml(game.title)}"
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

    </div>

  `;


  const image =
    article.querySelector(
      "img"
    );


  setupImage(
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


  /*
    EMPTY CART
  */

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
      "0";


    return;

  }


  /*
    CART HAS ITEMS
  */

  dom.items.hidden =
    false;


  dom.empty.hidden =
    true;


  dom.confirmButton.disabled =
    false;


  dom.items.innerHTML =
    "";


  games.forEach(
    (game) => {

      dom.items.appendChild(
        createCheckoutItem(
          game
        )
      );

    }
  );


  dom.count.textContent =
    count === 1
      ? "1 game"
      : `${count} games`;


  dom.summaryCount.textContent =
    String(
      count
    );


  dom.summaryTotal.textContent =
    String(
      count
    );

}


/* =========================================================
   LOAD CATALOG
========================================================= */

async function loadGames() {

  try {

    /*
      GitHub Pages:

      CORRECT:
      ./games.json

      NOT:
      /api/games
    */

    const response =
      await fetch(
        "./games.json"
      );


    if (
      !response.ok
    ) {

      throw new Error(
        `Catalog request failed (${response.status})`
      );

    }


    const payload =
      await response.json();


    /*
      Your games.json format is:

      {
        "games": [
          ...
        ]
      }

      But we also support a plain array.
    */

    const data =
      Array.isArray(payload)
        ? payload
        : payload.games;


    if (
      !Array.isArray(data)
    ) {

      throw new Error(
        "Invalid games.json format."
      );

    }


    state.games =
      data.map(
        normalizeGame
      );


    render();

  } catch (error) {

    console.error(
      "Catalog loading error:",
      error
    );


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


  const titles =
    games
      .map(
        (game) =>
          `- ${game.title}`
      )
      .join(
        "\n"
      );


  return (
    `Hello, I want these Steam games from Zack4Games:\n\n` +
    `${titles}\n\n` +
    `Total games: ${games.length}\n\n` +
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


  dom.modalGameList.innerHTML =
    games
      .map(
        (game) => `

          <div class="modal-game">

            <span>
              ${escapeHtml(
                game.title
              )}
            </span>

            <strong
              class="modal-game-check"
            >
              ✓
            </strong>

          </div>

        `
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


  if (
    !message
  ) {

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


/* REMOVE GAME */

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


/* CONFIRM ORDER */

dom.confirmButton.addEventListener(
  "click",
  (event) => {

    event.preventDefault();

    openModal();

  }
);


/* MODAL CONFIRM */

dom.modalConfirm.addEventListener(
  "click",
  (event) => {

    event.preventDefault();

    confirmOrder();

  }
);


/* CLOSE MODAL */

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


/* ESC */

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