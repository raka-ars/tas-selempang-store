const Groq = require("groq-sdk");
const products = require("./products.json");

function formatCurrency(num) {
  const n = Number(num);
  if (isNaN(n)) return num;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(n);
}

function searchRAG(query, topK = 6) {
  if (!query) return [];
  const q = query.toLowerCase().trim();

  // Tokens
  const tokens = q.replace(/[^\w\s]/g, " ").split(/\s+/).filter(t => t.length > 2);
  if (tokens.length === 0) return products.slice(0, topK);

  const scored = products.map(p => {
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

  return scored.slice(0, topK).map(item => item.product);
}

function buildContext(query) {
  const found = searchRAG(query);
  if (found.length === 0) return "";

  const grouped = {};
  for (const p of found) {
    const cat = p.kategori || "Lainnya";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  }

  let text = "Daftar Katalog Produk Toko Resmi (Shopee tas.selempang):\n";
  for (const [cat, items] of Object.entries(grouped)) {
    text += `\n[Kategori: ${cat}]\n`;
    items.forEach(p => {
      text += `• ${p.nama} - Harga: ${formatCurrency(p.harga)}\n  Deskripsi: ${p.deskripsi}\n  Link Shopee: ${p.url}\n`;
    });
  }
  return text.trim();
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method === "GET") {
    return res.status(200).json({ status: "online", message: "API Chatbot Tas Selempang aktif!" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { message, history = [] } = req.body || {};
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Pesan tidak boleh kosong." });
  }

  const apiKey = process.env.GROQ_API_KEY || "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";
  const ragContext = buildContext(message);
  const relevantProducts = searchRAG(message, 3);

  const systemPrompt = `Anda adalah konsultan toko resmi "Tas Selempang Official" (Shopee: tas.selempang). Anda bertugas melayani pelanggan website katalog kami dengan ramah, informatif, dan membantu merekomendasikan tas/dompet sesuai kebutuhan.

Katalog Produk Lapak:
- Toko kami menjual aneka Tas Selempang (Sling bag) Pria & Wanita, Waistbag, Tas Ransel (Backpack, muat laptop & traveling), Tote Bag, Clutch, Pouch, Dompet Kulit/Nylon, serta Jasa Custom Embos Nama.
- Toko resmi Shopee: https://shopee.co.id/tas.selempang#product_list

ATURAN MENJAWAB:
1. Jawab HANYA berdasarkan konteks katalog resmi berikut ini. Jangan mengarang spesifikasi produk yang tidak ada.
2. Tulis jawaban dengan rapi, ramah, gunakan bullet point jika menyebutkan produk, dan sertakan harga resminya dalam Rupiah.
3. Berikan saran jika pelanggan bertanya kebutuhan tertentu (misal: "tas untuk kerja dan laptop", "tas santai kasual", "kado untuk pasangan").
4. Di akhir, ajak pelanggan untuk memesan langsung melalui tombol di website atau link Shopee resmi toko.

${ragContext ? ragContext : "Konteks Katalog: Pelanggan tidak menanyakan produk tertentu atau hanya menyapa. Balas sapaan dengan ramah dan tanyakan tas model apa yang sedang dicari."}`;

  try {
    const groq = new Groq({ apiKey });
    const formattedHistory = Array.isArray(history)
      ? history.slice(-6).map(h => ({
          role: h.role === "assistant" ? "assistant" : "user",
          content: String(h.content || "")
        }))
      : [];

    const messages = [
      { role: "system", content: systemPrompt },
      ...formattedHistory,
      { role: "user", content: message }
    ];

    const candidateModels = [
      process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
      "openai/gpt-oss-20b",
      "allam-2-7b"
    ];

    let reply = null;
    let lastError = null;

    for (const model of candidateModels) {
      try {
        const completion = await groq.chat.completions.create({
          model,
          messages,
          max_tokens: 1200
        });

        if (completion.choices && completion.choices[0] && completion.choices[0].message) {
          reply = completion.choices[0].message.content;
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`[Groq Model ${model}] Error:`, err.message);
      }
    }

    if (!reply) {
      throw lastError || new Error("Gagal mendapatkan respon dari AI.");
    }

    return res.status(200).json({
      reply,
      relevantProducts
    });
  } catch (error) {
    console.error("Vercel Chat Function Error:", error);

    // Fallback response with RAG data if API quota/key fails
    let fallbackReply = "Halo! Terima kasih telah mengunjungi Tas Selempang Official Store. ✨\n\n";
    if (relevantProducts.length > 0) {
      fallbackReply += "Berikut rekomendasi produk dari katalog kami yang sesuai dengan pencarian Anda:\n\n";
      relevantProducts.forEach(p => {
        fallbackReply += `• **${p.nama}** - ${formatCurrency(p.harga)}\n  ${p.deskripsi}\n`;
      });
      fallbackReply += "\nAnda dapat langsung mengklik tombol **Beli di Shopee** pada katalog atau chat WhatsApp untuk memesan ya! 😊";
    } else {
      fallbackReply += "Kami menyediakan berbagai koleksi Tas Selempang, Waistbag, Tas Ransel Laptop, Tote Bag, dan Dompet pria/wanita berkualitas.\n\nAda model atau jenis tas tertentu yang sedang Anda cari?";
    }

    return res.status(200).json({
      reply: fallbackReply,
      relevantProducts,
      fallback: true
    });
  }
};
