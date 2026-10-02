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
const SESSIONS_KEY = "wineTastingSessions";

window.saveToCloud = GOOGLE_SCRIPT_URL ? async function(card) {
  const body = new URLSearchParams({
    id: card.id,
    rating: String(card.rating),
    category: card.category,
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
const statusMessage = document.getElementById("status");
const descriptors = document.getElementById("descriptors");
const savedCards = document.getElementById("savedCards");
const clearLocal = document.getElementById("clearLocal");
const sortSavedCards = document.getElementById("sortSavedCards");
const saveButton = document.querySelector("#wineForm .save");
const cancelEditButton = document.getElementById("cancelEdit");
const sessionHome = document.getElementById("sessionHome");
const sessionHistory = document.getElementById("sessionHistory");
const sessionList = document.getElementById("sessionList");
const sessionWorkspace = document.getElementById("sessionWorkspace");
const sessionTitle = document.getElementById("sessionTitle");
let activeSessionId = null;
let editingCardId = null;

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

function createId() {
  return window.crypto?.randomUUID?.() || String(Date.now());
}
function getSessions() {
  const storedSessions = localStorage.getItem(SESSIONS_KEY);
  if (storedSessions !== null) return JSON.parse(storedSessions);

  const legacyCards = JSON.parse(localStorage.getItem("wineCards") || "[]");
  const sessions = legacyCards.length ? [{
    id: createId(),
    name: "Previous tasting",
    createdAt: legacyCards[0].createdAt || new Date().toISOString(),
    cards: legacyCards
  }] : [];
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  if (legacyCards.length) localStorage.removeItem("wineCards");
  return sessions;
}
function setSessions(sessions) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}
function getLocalCards() {
  const session = getSessions().find(item => item.id === activeSessionId);
  return (session?.cards || []).map((card, index) => ({
    ...card,
    number: Number(card.number) || index + 1
  }));
}
function setLocalCards(cards) {
  setSessions(getSessions().map(session =>
    session.id === activeSessionId ? { ...session, cards } : session
  ));
}
function formatSessionDate(date) {
  return new Date(date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
function renderSessionHome() {
  const sessions = getSessions().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  sessionHistory.hidden = sessions.length === 0;
  sessionList.innerHTML = sessions.map(session => `
    <div class="session-entry">
      <button type="button" class="session-item" data-session-id="${escapeHtml(session.id)}">
        <span class="session-item-name">${escapeHtml(session.name)}</span>
        <span class="session-item-meta">${formatSessionDate(session.createdAt)} · ${(session.cards || []).length} wines</span>
      </button>
      <button type="button" class="session-delete" data-session-id="${escapeHtml(session.id)}" aria-label="Delete ${escapeHtml(session.name)}">Delete</button>
    </div>
  `).join("");
  sessionList.querySelectorAll(".session-item").forEach(button => {
    button.addEventListener("click", () => openSession(button.dataset.sessionId));
  });
  sessionList.querySelectorAll(".session-delete").forEach(button => {
    button.addEventListener("click", () => {
      const session = getSessions().find(item => item.id === button.dataset.sessionId);
      if (!session || !confirm(`Delete "${session.name}" and all its wine cards? This cannot be undone.`)) return;
      setSessions(getSessions().filter(item => item.id !== session.id));
      renderSessionHome();
    });
  });
}
function openSession(id) {
  const session = getSessions().find(item => item.id === id);
  if (!session) return;
  activeSessionId = id;
  sessionTitle.textContent = session.name;
  sessionHome.hidden = true;
  sessionWorkspace.hidden = false;
  resetFormState();
  renderLocalCards();
}
function resetFormState() {
  form.reset();
  ratingValue.value = "";
  document.querySelectorAll(".glass").forEach(g => g.classList.remove("active"));
  document.querySelectorAll(".chip").forEach(c => c.classList.remove("selected"));
  editingCardId = null;
  saveButton.textContent = "Save wine";
  cancelEditButton.hidden = true;
}
function renderLocalCards() {
  const cards = getLocalCards();
  if (!cards.length) {
    savedCards.innerHTML = '<div class="empty">No wines saved yet. Start tasting and save your first card.</div>';
    return;
  }

  const sortedCards = [...cards].sort((a, b) => {
    const order = sortSavedCards ? sortSavedCards.value : "newest";
    if (order === "highest") return Number(b.rating) - Number(a.rating);
    if (order === "lowest") return Number(a.rating) - Number(b.rating);

    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });

  savedCards.innerHTML = sortedCards.map(card => {
    return `
      <article class="saved-item">
        <div class="saved-title">
          <span>Wine #${card.number}</span>
          <span>${"🍷".repeat(card.rating)}</span>
        </div>
        <div class="saved-meta">
          ${card.category ? `Category: ${escapeHtml(card.category)}<br>` : ""}
          ${card.broughtBy ? `Brought by: ${escapeHtml(card.broughtBy)}<br>` : ""}
          ${card.goesWith ? `Goes with: ${escapeHtml(card.goesWith)}<br>` : ""}
          ${card.descriptors.length ? `Style: ${card.descriptors.map(escapeHtml).join(", ")}` : ""}
        </div>
        ${card.notes ? `<div class="saved-notes">${escapeHtml(card.notes)}</div>` : ""}
        <div class="saved-actions">
          <button type="button" class="saved-action" data-action="edit" data-id="${card.id}">Edit</button>
          <button type="button" class="saved-action danger" data-action="delete" data-id="${card.id}">Delete</button>
        </div>
      </article>
    `;
  }).join("");

  document.querySelectorAll(".saved-action").forEach(button => {
    button.addEventListener("click", () => {
      const { action, id } = button.dataset;
      const cards = getLocalCards();
      const card = cards.find(item => item.id === id);
      if (!card) return;

      if (action === "delete") {
        const filtered = cards.filter(item => item.id !== id);
        setLocalCards(filtered.map((item, index) => ({ ...item, number: index + 1 })));
        renderLocalCards();
        if (editingCardId === id) {
          resetFormState();
        }
        statusMessage.textContent = "Wine card deleted.";
        return;
      }

      editingCardId = id;
      saveButton.textContent = "Update wine";
      cancelEditButton.hidden = false;
      ratingValue.value = String(card.rating);
      document.querySelectorAll(".glass").forEach(g => {
        const isActive = Number(g.dataset.value) <= Number(card.rating);
        g.classList.toggle("active", isActive);
      });
      document.getElementById("broughtBy").value = card.broughtBy || "";
      document.getElementById("category").value = card.category || "";
      document.getElementById("goesWith").value = card.goesWith || "";
      document.getElementById("notes").value = card.notes || "";
      document.querySelectorAll(".chip").forEach(chip => {
        chip.classList.toggle("selected", (card.descriptors || []).includes(chip.dataset.value));
      });
      statusMessage.textContent = `Editing wine #${card.number}`;
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function cancelEdit() {
  resetFormState();
  statusMessage.textContent = "Edit cancelled.";
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[c]));
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!ratingValue.value) {
    statusMessage.textContent = "Choose a rating first.";
    return;
  }

  const cards = getLocalCards();
  const existingCard = editingCardId ? cards.find(item => item.id === editingCardId) : null;
  const nextNumber = existingCard
    ? existingCard.number
    : cards.reduce((max, card) => Math.max(max, Number(card.number) || 0), 0) + 1;

  const card = {
    id: existingCard ? existingCard.id : createId(),
    number: nextNumber,
    rating: Number(ratingValue.value),
    category: document.getElementById("category").value,
    broughtBy: document.getElementById("broughtBy").value.trim(),
    goesWith: document.getElementById("goesWith").value.trim(),
    descriptors: [...document.querySelectorAll(".chip.selected")].map(x => x.dataset.value),
    notes: document.getElementById("notes").value.trim(),
    createdAt: existingCard ? existingCard.createdAt : new Date().toISOString()
  };

  let updatedCards;
  if (existingCard) {
    updatedCards = cards.map(item => item.id === existingCard.id ? card : item);
    statusMessage.textContent = "Updated successfully ✓";
  } else {
    updatedCards = [...cards, card];
    statusMessage.textContent = "Saved successfully ✓";
  }

  setLocalCards(updatedCards);
  renderLocalCards();

  // Optional cloud saving: fill SUPABASE_URL and SUPABASE_ANON_KEY below.
  if (window.saveToCloud) {
    try {
      await window.saveToCloud(card);
      statusMessage.textContent = existingCard ? "Updated successfully ✓" : "Saved successfully ✓";
    } catch (err) {
      statusMessage.textContent = existingCard
        ? "Updated on this device, but cloud save failed."
        : "Saved on this device, but cloud save failed.";
      console.error(err);
    }
  }

  resetFormState();
  statusMessage.textContent = existingCard ? "Updated successfully ✓" : "Saved successfully ✓";
});

cancelEditButton.addEventListener("click", cancelEdit);
sortSavedCards.addEventListener("change", renderLocalCards);

clearLocal.addEventListener("click", () => {
  if (!confirm("Clear the wine cards in this tasting?")) return;
  setLocalCards([]);
  resetFormState();
  renderLocalCards();
});

document.getElementById("startSession").addEventListener("click", () => {
  const createdAt = new Date().toISOString();
  const session = {
    id: createId(),
    name: `Tasting - ${formatSessionDate(createdAt)}`,
    createdAt,
    cards: []
  };
  setSessions([...getSessions(), session]);
  openSession(session.id);
});
document.getElementById("backToSessions").addEventListener("click", () => {
  resetFormState();
  activeSessionId = null;
  sessionWorkspace.hidden = true;
  sessionHome.hidden = false;
  renderSessionHome();
});

renderSessionHome();
