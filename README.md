# GRAY BIT.. — Trading Analysis Website

A black-and-green starter dashboard for CRT, POI, and PO3 trading analysis.

## Publish with GitHub Pages
Upload `index.html`, `README.md`, and `.nojekyll` to the root of a GitHub repository. In repository Settings → Pages, select deploy from branch `main` and folder `/ (root)`.

## Use
Upload OHLC CSV data with columns `time,open,high,low,close` (time optional), choose M15 or H1, and click Analyze loaded data.

## Limitations
This is a prototype with simplified sweep/shift checks. Full HTF CRT closure, first qualifying OB sequencing, PO3 classification, SBR/SLP, multi-candle 50% confirmation, live MT5 connection, and backend Telegram alerts are not implemented yet. It does not place trades.
