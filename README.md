# Moneta — Personal Currency Converter

A responsive HTML / CSS / JavaScript website using Frankfurter's free daily reference exchange rate API.

## Local preview
Open `index.html` in a browser, or preferably run a local web server:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000/.

## Deploy on GitHub Pages
1. Create a new public GitHub repository, e.g. `moneta-currency`.
2. Upload `index.html`, `style.css`, and `script.js` **to the repository root**.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch `main`, folder `/(root)`, and save.
6. Your URL will typically be `https://YOUR-USERNAME.github.io/moneta-currency/` after deployment completes.

No API key, build system, backend, or dependencies needed.

## Notes
- Rates are **daily reference rates**, not live exchange/trading or bank rates.
- A previously fetched rate is cached in your browser and can be used without a network connection. Opening the site completely offline for the first time is not supported.
- If browser storage is cleared, cached rates are lost.
