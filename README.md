# GRAY BIT.. — Live MT5 next-candle analysis

## Website workflow
Type a pair (e.g. EURUSD), choose timeframe (M15/H1/etc.), and tap LOAD ANALYSIS. The server analyzes the latest candles pushed from MT5 and returns a probabilistic next-candle bias.

## MT5 bridge
Render cannot directly open an MT5 desktop terminal. Install the included `GRAY_BIT_MT5_Bridge.mq5` Expert Advisor on an MT5 terminal that stays online. Set `BridgeURL` to `https://YOUR-RENDER-SERVICE.onrender.com/api/mt5/candles`. The EA sends recent OHLC candles to the server.

Never put MT5 account passwords, API secrets, or investor credentials in the website code.

## Important
The next-candle result is probabilistic, not guaranteed. The included analysis is a starting CRT/POI/PO3-style rule engine, not a claim of predictive certainty.
