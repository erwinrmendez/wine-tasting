// Wine descriptors — edit this list to match your tasting.
const DESCRIPTORS = [
  "Fruity", "Floral", "Citrusy", "Tropical", "Berry",
  "Earthy", "Spicy", "Oaky", "Vanilla", "Smoky",
  "Mineral", "Herbal", "Sweet", "Dry", "Tannic",
  "Acidic", "Light", "Medium-bodied", "Full-bodied",
  "Smooth", "Crisp", "Rich", "Complex", "Fresh", "Is this gasoline?",
  "Smells pretentious", "Notes of regret", "Tastes expensive"
].sort(() => Math.random() - 0.5);


// Optional central saving.
// Create a Google Sheet + Apps Script endpoint as described in README.md,
// then paste the deployed Web App URL here.
const GOOGLE_SCRIPT_URL = "";

window.saveToCloud = GOOGLE_SCRIPT_URL ? async function(card) {
  const body = new URLSearchParams({
    id: card.id,
    rating: String(card.rating),
    broughtBy: card.broughtBy,
    goesWith: card.goesWith,
    descriptors: card.descriptors.join(", "),
    notes: card.notes,
    createdAt: card.createdAt
  });

  // no-cors is intentional: the browser does not need to read the response.
  await fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    body
  });
} : null;

const form = document.getElementById("wineForm");
const ratingValue = document.getElementById("ratingValue");
const status = document.getElementById("status");
const descriptors = document.getElementById("descriptors");
const savedCards = document.getElementById("savedCards");
const clearLocal = document.getElementById("clearLocal");

DESCRIPTORS.forEach(text => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "chip";
  button.textContent = text;
  button.dataset.value = text;
  button.addEventListener("click", () => button.classList.toggle("selected"));
  descriptors.appendChild(button);
});

document.querySelectorAll(".glass").forEach(glass => {
  glass.addEventListener("click", () => {
    const value = Number(glass.dataset.value);
    ratingValue.value = value;
    document.querySelectorAll(".glass").forEach(g => {
      g.classList.toggle("active", Number(g.dataset.value) <= value);
    });
  });
});

function getLocalCards() {
  return JSON.parse(localStorage.getItem("wineCards") || "[]");
}
function setLocalCards(cards) {
  localStorage.setItem("wineCards", JSON.stringify(cards));
}
function renderLocalCards() {
  const cards = getLocalCards();
  if (!cards.length) {
    savedCards.innerHTML = '<div class="empty">No cards saved on this device yet.</div>';
    return;
  }
  savedCards.innerHTML = cards.slice().reverse().map(card => `
    <article class="saved-item">
      <div class="saved-title">
        <span>${escapeHtml(card.broughtBy)}</span>
        <span>${"🍷".repeat(card.rating)}</span>
      </div>
      <div class="saved-meta">
        ${card.goesWith ? `Goes with: ${escapeHtml(card.goesWith)}<br>` : ""}
        ${card.descriptors.length ? `Style: ${card.descriptors.map(escapeHtml).join(", ")}` : ""}
      </div>
      ${card.notes ? `<div class="saved-notes">${escapeHtml(card.notes)}</div>` : ""}
    </article>
  `).join("");
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[c]));
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!ratingValue.value) {
    status.textContent = "Choose a rating first.";
    return;
  }

  const card = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    rating: Number(ratingValue.value),
    broughtBy: document.getElementById("broughtBy").value.trim(),
    goesWith: document.getElementById("goesWith").value.trim(),
    descriptors: [...document.querySelectorAll(".chip.selected")].map(x => x.dataset.value),
    notes: document.getElementById("notes").value.trim(),
    createdAt: new Date().toISOString()
  };

  const cards = getLocalCards();
  cards.push(card);
  setLocalCards(cards);
  renderLocalCards();

  // Optional cloud saving: fill SUPABASE_URL and SUPABASE_ANON_KEY below.
  if (window.saveToCloud) {
    try {
      await window.saveToCloud(card);
      status.textContent = "Saved ✓";
    } catch (err) {
      status.textContent = "Saved on this device, but cloud save failed.";
      console.error(err);
    }
  } else {
    status.textContent = "Saved on this device ✓";
  }

  form.reset();
  ratingValue.value = "";
  document.querySelectorAll(".glass").forEach(g => g.classList.remove("active"));
  document.querySelectorAll(".chip").forEach(c => c.classList.remove("selected"));
});

clearLocal.addEventListener("click", () => {
  if (confirm("Clear the wine cards saved on this device?")) {
    localStorage.removeItem("wineCards");
    renderLocalCards();
  }
});

renderLocalCards();
