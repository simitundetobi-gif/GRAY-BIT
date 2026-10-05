#property strict
#property version "1.00"
input string BridgeURL="https://YOUR-RENDER-SERVICE.onrender.com/api/mt5/candles";
input int BarsToSend=120;
input int SecondsBetweenPush=5;
string lastSymbol="";
int OnInit(){EventSetTimer(SecondsBetweenPush); return(INIT_SUCCEEDED);} 
void OnDeinit(const int reason){EventKillTimer();}
string JsonEscape(string s){StringReplace(s,"\\","\\\\");StringReplace(s,"\"","\\\"");return s;}
void OnTimer(){
  if(StringLen(BridgeURL)<10)return;
  string sym=_Symbol; ENUM_TIMEFRAMES tf=_Period;
  MqlRates r[]; ArraySetAsSeries(r,true); int got=CopyRates(sym,tf,0,BarsToSend,r); if(got<30)return;
  string body="{\"symbol\":\""+JsonEscape(sym)+"\",\"timeframe\":\""+EnumToString(tf)+"\",\"serverTime\":"+(string)TimeTradeServer()+",\"candles\":[";
  for(int i=got-1;i>=0;i--){if(i<got-1)body+=",";body+="{\"time\":"+(string)r[i].time+",\"open\":"+DoubleToString(r[i].open,_Digits)+",\"high\":"+DoubleToString(r[i].high,_Digits)+",\"low\":"+DoubleToString(r[i].low,_Digits)+",\"close\":"+DoubleToString(r[i].close,_Digits)+",\"volume\":"+(string)r[i].tick_volume+"}";} body+="]}";
  char data[],result[]; StringToCharArray(body,data,0,WHOLE_ARRAY,CP_UTF8); string headers="Content-Type: application/json\r\n"; string responseHeaders; int code=WebRequest("POST",BridgeURL,headers,5000,data,result,responseHeaders); if(code<200||code>=300)Print("GRAY BIT bridge HTTP ",code," error ",GetLastError());
}
