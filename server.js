const http = require('http');

// Render.com'un botu kapatmaması için göstermelik bir web sayfası açıyoruz
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write("Altin botu an itibariyla 7/24 calisiyor!");
  res.end();
}).listen(process.env.PORT || 3000);

// Eski kodundaki Firebase adresin
const firebaseUrl = "https://kasimpasakuyumcusu-aa3cc-default-rtdb.firebaseio.com/fiyatlar.json";
const apiUrl = "https://prdprc.saglamoglu.app/api/v1/prices/currentmarketproductprices";

// API'deki ID numaraları ile senin HTML'deki ürün isimlerini eşleştiriyoruz.
// DİKKAT: Has altın 1 numaraydı. Diğerlerinin numaralarını bilmediğim için şimdilik rastgele 2,3,4 yazdım.
// Kendi sistemine göre bu numaraları (marketProductId) kesinlikle düzeltmelisin!
const idEslesmeleri = {
  1: "hasaltin",
  2: "gramaltin",
  3: "eskiceyrek",
  4: "yeniceyrek",
  5: "eskiyarim",
  6: "yeniyarim",
  7: "eskitam",
  8: "yenitam",
  9: "eskiata",
  10: "yeniata",
  11: "22ayargram",
  12: "22ayarbilezik"
};

async function fiyatlariGuncelle() {
  try {
    // 1. API'den verileri çekiyoruz
    const apiYaniti = await fetch(apiUrl);
    const jsonVeri = await apiYaniti.json();
    const dataArray = jsonVeri.data;

    let urunlerObjesi = {};

    // 2. Gelen verilerin içinde dönüp eşleşenleri paketliyoruz
    for (let i = 0; i < dataArray.length; i++) {
      let urun = dataArray[i];
      let htmlKodu = idEslesmeleri[urun.marketProductId];

      if (htmlKodu) {
        urunlerObjesi[htmlKodu] = {
          alis: Number(urun.customerBuysAt),
          satis: Number(urun.customerSellsAt)
        };
      }
    }

    // 3. Saat bilgisini Türkiye formatında alıyoruz
    let simdi = new Date();
    let saatString = simdi.toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // 4. HTML'in beklediği nihai paketi hazırlıyoruz
    let nihaiPaket = {
      sonGuncelleme: saatString,
      urunler: urunlerObjesi
    };

    // 5. Firebase'e fırlatıyoruz (Google Sheets'e gerek kalmadı)
    await fetch(firebaseUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nihaiPaket)
    });

    console.log("Veri Firebase'e başarıyla gönderildi: " + saatString);

  } catch (hata) {
    console.log("Bir hata oluştu: ", hata);
  }
}

// Sistemi başlat ve 10 saniyede (10000 milisaniye) bir sonsuza kadar tekrarla
console.log("Bot başlatıldı, 10 saniyede bir veri çekilecek...");
fiyatlariGuncelle(); // İlk çalışmayı hemen yap
setInterval(fiyatlariGuncelle, 10000);
