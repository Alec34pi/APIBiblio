const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors()); // autorise tout le monde, ou spécifie origin
const PORT = process.env.PORT || 3000;

async function getMomoxBuyPrice(isbn) {
    try {
        const url = `https://www.momox-shop.fr/verkaufen/ISBN${isbn}`;
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(response.data);
        let price = $('span.price-amount').first().text().trim();
        if (price) {
            price = price.replace('€', '').replace(',', '.').trim();
            return parseFloat(price);
        }
        return null;
    } catch (err) {
        console.error('Erreur récupération prix:', err.message);
        return null;
    }
}

app.get('/get-price/:isbn', async (req, res) => {
    const isbn = req.params.isbn;
    const price = await getMomoxBuyPrice(isbn);
    res.json({ price });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
