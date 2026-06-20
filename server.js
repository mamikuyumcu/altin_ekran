{\rtf1\ansi\ansicpg1254\cocoartf2869
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 const http = require('http');\
\
// Render.com'un botu kapatmamas\uc0\u305  i\'e7in g\'f6stermelik bir web sayfas\u305  a\'e7\u305 yoruz\
http.createServer((req, res) => \{\
  res.writeHead(200, \{ 'Content-Type': 'text/plain' \});\
  res.write("Altin botu an itibariyla 7/24 calisiyor!");\
  res.end();\
\}).listen(process.env.PORT || 3000);\
\
// Eski kodundaki Firebase adresin\
const firebaseUrl = "https://kasimpasakuyumcusu-aa3cc-default-rtdb.firebaseio.com/fiyatlar.json";\
const apiUrl = "https://prdprc.saglamoglu.app/api/v1/prices/currentmarketproductprices";\
\
// API'deki ID numaralar\uc0\u305  ile senin HTML'deki \'fcr\'fcn isimlerini e\u351 le\u351 tiriyoruz.\
// D\uc0\u304 KKAT: Has alt\u305 n 1 numarayd\u305 . Di\u287 erlerinin numaralar\u305 n\u305  bilmedi\u287 im i\'e7in \u351 imdilik rastgele 2,3,4 yazd\u305 m.\
// Kendi sistemine g\'f6re bu numaralar\uc0\u305  (marketProductId) kesinlikle d\'fczeltmelisin!\
const idEslesmeleri = \{\
  1: "hasaltin",\
  2: "gramaltin",\
  3: "eskiceyrek",\
  4: "yeniceyrek",\
  5: "eskiyarim",\
  6: "yeniyarim",\
  7: "eskitam",\
  8: "yenitam",\
  9: "eskiata",\
  10: "yeniata",\
  11: "22ayargram",\
  12: "22ayarbilezik"\
\};\
\
async function fiyatlariGuncelle() \{\
  try \{\
    // 1. API'den verileri \'e7ekiyoruz\
    const apiYaniti = await fetch(apiUrl);\
    const jsonVeri = await apiYaniti.json();\
    const dataArray = jsonVeri.data;\
\
    let urunlerObjesi = \{\};\
\
    // 2. Gelen verilerin i\'e7inde d\'f6n\'fcp e\uc0\u351 le\u351 enleri paketliyoruz\
    for (let i = 0; i < dataArray.length; i++) \{\
      let urun = dataArray[i];\
      let htmlKodu = idEslesmeleri[urun.marketProductId];\
\
      if (htmlKodu) \{\
        urunlerObjesi[htmlKodu] = \{\
          alis: Number(urun.customerBuysAt),\
          satis: Number(urun.customerSellsAt)\
        \};\
      \}\
    \}\
\
    // 3. Saat bilgisini T\'fcrkiye format\uc0\u305 nda al\u305 yoruz\
    let simdi = new Date();\
    let saatString = simdi.toLocaleTimeString('tr-TR', \{ timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit', second: '2-digit' \});\
\
    // 4. HTML'in bekledi\uc0\u287 i nihai paketi haz\u305 rl\u305 yoruz\
    let nihaiPaket = \{\
      sonGuncelleme: saatString,\
      urunler: urunlerObjesi\
    \};\
\
    // 5. Firebase'e f\uc0\u305 rlat\u305 yoruz (Google Sheets'e gerek kalmad\u305 )\
    await fetch(firebaseUrl, \{\
      method: 'PUT',\
      headers: \{ 'Content-Type': 'application/json' \},\
      body: JSON.stringify(nihaiPaket)\
    \});\
\
    console.log("Veri Firebase'e ba\uc0\u351 ar\u305 yla g\'f6nderildi: " + saatString);\
\
  \} catch (hata) \{\
    console.log("Bir hata olu\uc0\u351 tu: ", hata);\
  \}\
\}\
\
// Sistemi ba\uc0\u351 lat ve 10 saniyede (10000 milisaniye) bir sonsuza kadar tekrarla\
console.log("Bot ba\uc0\u351 lat\u305 ld\u305 , 10 saniyede bir veri \'e7ekilecek...");\
fiyatlariGuncelle(); // \uc0\u304 lk \'e7al\u305 \u351 may\u305  hemen yap\
setInterval(fiyatlariGuncelle, 10000);}