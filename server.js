const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json({limit:'1mb'}));
app.use(express.static(__dirname));

// Latest candle snapshots pushed by the MT5 Expert Advisor.
const feeds = new Map();

app.post('/api/mt5/candles',(req,res)=>{
  const {symbol,timeframe,candles,quote,serverTime}=req.body||{};
  if(!symbol || !timeframe || !Array.isArray(candles) || candles.length < 30)
    return res.status(400).json({error:'Need symbol, timeframe and at least 30 candles.'});
  const clean=candles.slice(-300).map(c=>({
    time:Number(c.time),open:Number(c.open),high:Number(c.high),low:Number(c.low),close:Number(c.close),volume:Number(c.volume||0)
  })).filter(c=>[c.time,c.open,c.high,c.low,c.close].every(Number.isFinite));
  if(clean.length<30) return res.status(400).json({error:'Invalid candle data.'});
  feeds.set(String(symbol).toUpperCase(),{symbol:String(symbol).toUpperCase(),timeframe,candles:clean,quote:quote||null,serverTime:serverTime||Date.now()});
  res.json({ok:true,received:clean.length});
});

app.get('/api/mt5/status',(req,res)=>{
  const s=feeds.get(String(req.query.symbol||'').toUpperCase());
  res.json({connected:!!s,lastUpdate:s?.serverTime||null,timeframe:s?.timeframe||null});
});

function atr(cs,n=14){
  if(cs.length<n+1)return null; let sum=0;
  for(let i=cs.length-n;i<cs.length;i++){
    const c=cs[i],p=cs[i-1]; sum+=Math.max(c.high-c.low,Math.abs(c.high-p.close),Math.abs(c.low-p.close));
  } return sum/n;
}
function ema(vals,n){const k=2/(n+1);let e=vals[0];for(let i=1;i<vals.length;i++)e=vals[i]*k+e*(1-k);return e;}
function analyze(cs){
  const c=cs[cs.length-1], p=cs[cs.length-2], a=atr(cs,14)||Math.max(c.high-c.low,1e-8);
  const closes=cs.map(x=>x.close); const e9=ema(closes.slice(-60),9), e21=ema(closes.slice(-60),21);
  const look=cs.slice(-12); const rangeHigh=Math.max(...look.slice(0,-1).map(x=>x.high)); const rangeLow=Math.min(...look.slice(0,-1).map(x=>x.low));
  const body=Math.abs(c.close-c.open), bull=c.close>c.open, bear=c.close<c.open;
  const sweepLow=c.low<rangeLow && c.close>rangeLow; const sweepHigh=c.high>rangeHigh && c.close<rangeHigh;
  // Simple PO3 proxy: contraction -> liquidity run -> displacement.
  const recent=cs.slice(-6); const avgRange=recent.slice(0,5).reduce((s,x)=>s+(x.high-x.low),0)/5;
  const displacement=(c.high-c.low)>avgRange*1.25 && body>(c.high-c.low)*0.55;
  let bullScore=0,bearScore=0,reasons=[];
  if(e9>e21){bullScore+=1;reasons.push('short-term momentum is bullish');} else if(e9<e21){bearScore+=1;reasons.push('short-term momentum is bearish');}
  if(sweepLow){bullScore+=2;reasons.push('recent sell-side liquidity sweep');}
  if(sweepHigh){bearScore+=2;reasons.push('recent buy-side liquidity sweep');}
  if(displacement&&bull){bullScore+=2;reasons.push('bullish displacement');}
  if(displacement&&bear){bearScore+=2;reasons.push('bearish displacement');}
  if(c.close>p.high){bullScore+=1;reasons.push('close above prior high');}
  if(c.close<p.low){bearScore+=1;reasons.push('close below prior low');}
  if(Math.abs(bullScore-bearScore)<2){return {direction:'NEUTRAL',confidence:50,reason:'Signals are mixed; wait for clearer displacement or liquidity confirmation.',atr:a,entry:c.close,levels:{bullTarget:c.close+a*1.5,bearTarget:c.close-a*1.5},features:{sweepHigh,sweepLow,displacement,e9,e21}};}
  const bullish=bullScore>bearScore; const score=Math.max(bullScore,bearScore); const conf=Math.min(90,50+score*8+Math.min(10,Math.abs(bullScore-bearScore)*3));
  return {direction:bullish?'BULLISH':'BEARISH',confidence:Math.round(conf),reason:reasons.slice(0,3).join('; ')+'.',atr:a,entry:c.close,levels:bullish?{target:c.close+a*1.2,invalidation:c.close-a*.7}:{target:c.close-a*1.2,invalidation:c.close+a*.7},features:{sweepHigh,sweepLow,displacement,e9,e21}};
}

app.get('/api/analyze',(req,res)=>{
  const symbol=String(req.query.symbol||'').toUpperCase().trim();
  const timeframe=String(req.query.timeframe||'').toUpperCase().trim();
  if(!symbol||!timeframe)return res.status(400).json({error:'Enter a pair and timeframe.'});
  const feed=feeds.get(symbol);
  if(!feed)return res.status(404).json({error:`No live MT5 feed for ${symbol}. Install/run the GRAY BIT MT5 bridge EA and try again.`});
  const result=analyze(feed.candles);
  res.json({symbol,timeframe:feed.timeframe,updated:feed.serverTime,quote:feed.quote,result});
});

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'index.html')));
app.listen(PORT,()=>console.log(`GRAY BIT.. live server on ${PORT}`));
