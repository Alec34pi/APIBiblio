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
    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // On cherche la div avec la classe indiquée
    const priceText = $("div.searchresult-price.text-center.text-xxl.font-medium").first().text().trim();

    if (priceText) {
      // Nettoyage du texte : on garde uniquement le nombre avec le point décimal
      const price = parseFloat(priceText.replace("€", "").replace(",", ".").trim());
      res.json({ price });
    } else {
      res.json({ price: false });
    }
  } catch (err) {
    console.error("Erreur récupération prix:", err.message);
    res.json({ price: false });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur Node.js en ligne sur le port ${PORT}`);
});
