const express = require("express");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const cors = require("cors");
const path = require("path");
const os = require("os");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

let browser = null;

// Fonction pour démarrer le navigateur de manière sécurisée
async function startBrowser() {
  if (!browser || !browser.isConnected()) {
    const executablePath = await chromium.executablePath();
    const tempDir = path.join(os.tmpdir(), "chromium_tmp"); // dossier temporaire unique
    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: [...chromium.args, `--user-data-dir=${tempDir}`],
      defaultViewport: chromium.defaultViewport,
    });
  }
  return browser;
}

// Fonction pour récupérer le prix depuis Momox
async function getPriceFromMomox(barcode) {
  if (!barcode) return false;

  try {
    const browserInstance = await startBrowser();
    const page = await browserInstance.newPage();

    // User-Agent et headers pour ressembler à un vrai navigateur
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
      Referer: "https://www.momox.fr/",
    });

    // Eviter détection headless
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    // Navigation avec timeout plus long
    await page.goto(`https://www.momox.fr/offer/${barcode}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000, // 60 secondes
    });

    // Petit délai pour s'assurer que le prix est chargé
    await page.waitForTimeout(2000);

    // Récupération du prix
    const priceText = await page.$eval(
      "div.searchresult-price.text-center.text-xxl.font-medium",
      el => el.textContent.trim()
    );

    await page.close();

    if (priceText) {
      const price = parseFloat(priceText.replace(/\s/g, "").replace(",", ".").replace("€", ""));
      return price;
    } else {
      return false;
    }

  } catch (err) {
    console.error("Erreur Puppeteer:", err.message);
    return false;
  }
}

// Endpoint pour récupérer le prix
app.get("/get-price/:barcode", async (req, res) => {
  const barcode = req.params.barcode;
  if (!barcode) return res.status(400).json({ price: null });

  const price = await getPriceFromMomox(barcode);
  res.json({ price });
});

app.listen(PORT, () => {
  console.log(`Serveur Node.js en ligne sur le port ${PORT}`);
});
