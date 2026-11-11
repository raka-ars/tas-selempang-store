let allProducts = [];
let currentCategory = "all";
let currentSearch = "";
let currentSort = "default";
let chatHistory = [];

const productGrid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const sortSelect = document.getElementById("sortSelect");
const categoryPills = document.getElementById("categoryPills");
const productCountInfo = document.getElementById("productCountInfo");

// Chatbot Elements
const chatbotWidget = document.getElementById("chatbotWidget");
const chatLauncher = document.getElementById("chatLauncher");
const chatWindow = document.getElementById("chatWindow");
const chatCloseBtn = document.getElementById("chatCloseBtn");
const openChatBtnNav = document.getElementById("openChatBtnNav");
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatSuggestions = document.getElementById("chatSuggestions");

// Format IDR Currency
function formatIDR(num) {
  const n = Number(num);
  if (isNaN(n)) return num;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(n);
}

// Generate WhatsApp direct order link
function generateWALink(product) {
  const phone = "6281234567890"; // Nomor WA bisnis (bisa disesuaikan pengguna)
  const text = `Halo kak! Saya tertarik dan ingin order *${product.nama}* seharga *${formatIDR(product.harga)}* dari katalog Shopee tas.selempang.\nApakah produk ini masih ready stock?`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

// Load Products
async function loadProducts() {
  try {
    const res = await fetch("data/products.json");
    if (!res.ok) throw new Error("Gagal mengambil data katalog");
    allProducts = await res.json();
    renderProducts();
  } catch (err) {
    console.error("Error loading products:", err);
    productGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b;">
        <p>Gagal memuat katalog produk. Pastikan file <code>data/products.json</code> tersedia.</p>
      </div>
    `;
  }
}

// Filter and Sort Products
function getFilteredProducts() {
  let filtered = [...allProducts];

  // Category filter
  if (currentCategory !== "all") {
    if (currentCategory === "Dompet") {
      filtered = filtered.filter(p => p.kategori.includes("Dompet") || p.kategori.includes("Clutch"));
    } else {
      filtered = filtered.filter(p => p.kategori.toLowerCase() === currentCategory.toLowerCase());
    }
  }

  // Search filter
  if (currentSearch.trim()) {
    const q = currentSearch.toLowerCase().trim();
    filtered = filtered.filter(p =>
      p.nama.toLowerCase().includes(q) ||
      p.kategori.toLowerCase().includes(q) ||
      p.deskripsi.toLowerCase().includes(q)
    );
  }

  // Sort
  if (currentSort === "price-asc") {
    filtered.sort((a, b) => a.harga - b.harga);
  } else if (currentSort === "price-desc") {
    filtered.sort((a, b) => b.harga - a.harga);
  } else if (currentSort === "name-asc") {
    filtered.sort((a, b) => a.nama.localeCompare(b.nama));
  }

  return filtered;
}

// Render Products Grid
function renderProducts() {
  const filtered = getFilteredProducts();

  productCountInfo.textContent = `Menampilkan ${filtered.length} dari ${allProducts.length} produk`;

  if (filtered.length === 0) {
    productGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: white; border-radius: 12px; border: 1px dashed #cbd5e1;">
        <span style="font-size: 40px; display: block; margin-bottom: 12px;">🔍</span>
        <h3 style="font-size: 18px; color: #0f172a; margin-bottom: 6px;">Produk Tidak Ditemukan</h3>
        <p style="color: #64748b; font-size: 14px;">Coba gunakan kata kunci lain seperti "ransel", "waistbag", "selempang", atau "dompet".</p>
      </div>
    `;
    return;
  }

  productGrid.innerHTML = filtered.map(p => {
    const waUrl = generateWALink(p);
    const fallbackImg = "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80";
    const discountBadge = p.diskon ? `<span class="badge-discount">${p.diskon}</span>` : "";
    const tagBadge = p.badge ? `<span class="badge-tag">${p.badge}</span>` : "";

    return `
      <article class="product-card">
        <div class="card-img-wrap">
          <img src="${p.gambar || fallbackImg}" alt="${p.nama}" loading="lazy" onerror="this.src='${fallbackImg}'">
          ${discountBadge}
          ${tagBadge}
        </div>
        <div class="card-body">
          <span class="card-category">${p.kategori}</span>
          <h2 class="card-title" title="${p.nama}">${p.nama}</h2>
          <p class="card-desc">${p.deskripsi}</p>
          <div class="card-price-row">
            <span class="card-price">${formatIDR(p.harga)}</span>
          </div>
          <div class="card-actions">
            <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="btn-card btn-card-shopee" title="Beli di Shopee">
              🛍️ Shopee
            </a>
            <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn-card btn-card-wa" title="Pesan via WhatsApp">
              💬 Order WA
            </a>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

// Event Listeners for Controls
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    currentSearch = e.target.value;
    clearSearchBtn.style.display = currentSearch ? "block" : "none";
    renderProducts();
  });
}

if (clearSearchBtn) {
  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    currentSearch = "";
    clearSearchBtn.style.display = "none";
    renderProducts();
  });
}

if (sortSelect) {
  sortSelect.addEventListener("change", (e) => {
    currentSort = e.target.value;
    renderProducts();
  });
}

if (categoryPills) {
  categoryPills.addEventListener("click", (e) => {
    const btn = e.target.closest(".pill");
    if (!btn) return;
    document.querySelectorAll(".pill").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    currentCategory = btn.dataset.category;
    renderProducts();
  });
}

// ================= CHATBOT WIDGET LOGIC =================
function toggleChat(forceOpen = null) {
  const isHidden = chatWindow.classList.contains("hidden");
  const shouldOpen = forceOpen !== null ? forceOpen : isHidden;

  if (shouldOpen) {
    chatWindow.classList.remove("hidden");
    chatInput.focus();
  } else {
    chatWindow.classList.add("hidden");
  }
}

if (chatLauncher) {
  chatLauncher.addEventListener("click", () => toggleChat());
}

if (chatCloseBtn) {
  chatCloseBtn.addEventListener("click", () => toggleChat(false));
}

if (openChatBtnNav) {
  openChatBtnNav.addEventListener("click", () => toggleChat(true));
}

// Suggestion Chips Click
if (chatSuggestions) {
  chatSuggestions.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    const query = chip.dataset.query;
    if (query) {
      chatInput.value = query;
      submitChatMessage(query);
    }
  });
}

// Format Markdown Bold and Links
function formatChatMarkdown(text) {
  if (!text) return "";
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
  return formatted;
}

// Append Chat Message
function appendChatMessage(role, content, products = []) {
  const bubble = document.createElement("div");
  bubble.className = `message-bubble ${role}`;

  let html = `<p>${formatChatMarkdown(content)}</p>`;

  if (products && products.length > 0 && role === "bot") {
    html += `
      <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 6px;">
        ${products.map(p => `
          <a href="${p.url}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; gap: 8px; background: white; padding: 6px 10px; border-radius: 8px; border: 1px solid #e2e8f0; text-decoration: none; color: inherit; font-size: 11px;">
            <span style="font-size: 16px;">🎒</span>
            <div style="flex:1; overflow:hidden;">
              <strong style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.nama}</strong>
              <span style="color: #ee4d2d; font-weight: 700;">${formatIDR(p.harga)}</span>
            </div>
            <span style="font-weight: 700; color: #ee4d2d;">Beli &rarr;</span>
          </a>
        `).join("")}
      </div>
    `;
  }

  bubble.innerHTML = html;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Typing Indicator
function showTypingIndicator() {
  const indicator = document.createElement("div");
  indicator.className = "typing-indicator";
  indicator.id = "typingIndicator";
  indicator.innerHTML = `<span></span><span></span><span></span>`;
  chatMessages.appendChild(indicator);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
  const indicator = document.getElementById("typingIndicator");
  if (indicator) indicator.remove();
}

// Client-Side RAG Engine (Fallback if serverless API unreachable)
function clientRAGAnswer(query) {
  const q = query.toLowerCase().trim();
  const tokens = q.replace(/[^\w\s]/g, " ").split(/\s+/).filter(t => t.length > 2);

  const scored = allProducts.map(p => {
    let score = 0;
    const text = `${p.nama} ${p.kategori} ${p.deskripsi} ${p.harga}`.toLowerCase();
    for (const t of tokens) {
      if (p.nama.toLowerCase().includes(t)) score += 8;
      if (p.kategori.toLowerCase().includes(t)) score += 5;
      if (p.deskripsi.toLowerCase().includes(t)) score += 3;
      if (text.includes(t)) score += 1;
    }
    return { product: p, score };
  })
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score);

  const matched = scored.slice(0, 3).map(i => i.product);

  if (matched.length > 0) {
    let reply = `Berikut produk yang cocok dari katalog resmi toko kami:\n\n`;
    matched.forEach(p => {
      reply += `• **${p.nama}** (${formatIDR(p.harga)})\n  _${p.deskripsi}_\n\n`;
    });
    reply += `Anda dapat mengklik produk di bawah ini untuk melihat detail dan langsung melakukan pemesanan di Shopee ya! 😊`;
    return { reply, relevantProducts: matched };
  }

  return {
    reply: `Halo! Di toko *Tas Selempang Official* (Shopee: tas.selempang), kami menyediakan aneka *Tas Selempang Pria/Wanita*, *Waistbag*, *Tas Ransel Laptop*, *Tote Bag*, *Dompet*, serta *Layanan Embos Nama*.\n\nSilakan sebutkan jenis tas yang Anda cari, dan kami siap bantu carikan rekomendasi terbaik!`,
    relevantProducts: allProducts.slice(0, 2)
  };
}

// Submit Chat Message
async function submitChatMessage(text) {
  if (!text || !text.trim()) return;
  const message = text.trim();

  // Show user bubble
  appendChatMessage("user", message);
  chatInput.value = "";
  showTypingIndicator();

  chatHistory.push({ role: "user", content: message });

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history: chatHistory })
    });

    if (!res.ok) throw new Error("Gagal menghubungi serverless chat function");
    const data = await res.json();

    hideTypingIndicator();
    appendChatMessage("bot", data.reply, data.relevantProducts || []);
    chatHistory.push({ role: "assistant", content: data.reply });
  } catch (err) {
    console.warn("Menggunakan client-side RAG fallback:", err.message);
    hideTypingIndicator();

    const localResult = clientRAGAnswer(message);
    appendChatMessage("bot", localResult.reply, localResult.relevantProducts);
    chatHistory.push({ role: "assistant", content: localResult.reply });
  }
}

if (chatForm) {
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    submitChatMessage(chatInput.value);
  });
}

// Initialize on page load
loadProducts();
