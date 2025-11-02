const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

/* ===========================
   ROUTE: récupération prix
=========================== */
app.get("/get-price/:barcode", async (req, res) => {
  const barcode = req.params.barcode;
  if (!barcode) return res.status(400).json({ price: null });

  try {
    const url = `https://www.momox.fr/offer/${barcode}`;

    // Headers réalistes pour éviter le 403
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        "Connection": "keep-alive",
        "Referer": "https://www.momox.fr/"
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Récupération du prix dans le div
    let priceText = $("div.searchresult-price.text-center.text-xxl.font-medium")
                      .first()
                      .text()
                      .replace(/\s/g, "") // supprime les espaces
                      .replace(",", "."); // remplace virgule par point

    if (priceText) {
      const price = parseFloat(priceText.replace("€", ""));
      res.json({ price });
    } else {
      res.json({ price: false });
    }

  } catch (err) {
    console.error("Erreur récupération prix:", err.message);
    res.json({ price: false });
  }
});

/* ===========================
   LANCEMENT DU SERVEUR
=========================== */
app.listen(PORT, () => {
  console.log(`Serveur Node.js en ligne sur le port ${PORT}`);
});
