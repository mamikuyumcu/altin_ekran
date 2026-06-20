const http = require('http');

// Sanal bekçinin (cron-job) uyanık tutması için canlı sayfa açıyoruz
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write("Kasimpasa Kuyumcusu Botu 7/24 Aktif!");
  res.end();
}).listen(process.env.PORT || 3000);

const firebaseUrl = "https://kasimpasakuyumcusu-aa3cc-default-rtdb.firebaseio.com";
const apiUrl = "https://prdprc.saglamoglu.app/api/v1/prices/currentmarketproductprices";

async function fiyatlariGuncelle() {
  try {
    // 1. Sağlamoğlu API'sinden taze HAS ALTIN fiyatını çekiyoruz
    const apiYaniti = await fetch(apiUrl);
    const jsonVeri = await apiYaniti.json();
    
    // API içinden Has Altın'ı (ID: 1) buluyoruz
    const hasAltinVerisi = jsonVeri.data.find(urun => urun.marketProductId == 1);
    const hasAlis = Number(hasAltinVerisi.customerBuysAt);
    const hasSatis = Number(hasAltinVerisi.customerSellsAt);

    // 2. Firebase'den senin Excel'de güncellediğin çarpanları (katsayıları) alıyoruz
    const ayarYaniti = await fetch(firebaseUrl + "/ayarlar.json");
    const carpanlar = await ayarYaniti.json();

    if (!carpanlar) {
      console.log("Excel'den gelecek çarpanlar bekleniyor...");
      return; 
    }

    // 3. HESAPLAMA: Has Altın fiyatı ile senin çarpanlarını tek tek çarpıyoruz
    let urunlerObjesi = {
      hasaltin: { alis: hasAlis, satis: hasSatis } // Has altın çarpan olmadan direkt yansır
    };

    // Excel'deki sıraya göre tüm ürünlerin fiyatını hesapla
    for (const [isim, carpan] of Object.entries(carpanlar)) {
      urunlerObjesi[isim] = {
        // Virgülden sonra borsa gibi uzamasın diye fiyatları 2 hane ile sınırlıyoruz (.toFixed)
        alis: Number((hasAlis * carpan.alis).toFixed(2)),
        satis: Number((hasSatis * carpan.satis).toFixed(2))
      };
    }

    let simdi = new Date();
    let saatString = simdi.toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit', second: '2-digit' });

    let nihaiPaket = {
      sonGuncelleme: saatString,
      urunler: urunlerObjesi
    };

    // 4. Hesaplanmış son fiyat listesini vitrin (HTML) ekranının okuması için Firebase'e gönderiyoruz
    await fetch(firebaseUrl + "/fiyatlar.json", {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nihaiPaket)
    });

    console.log("Fiyatlar başarıyla hesaplandı ve vitrine gönderildi: " + saatString);

  } catch (hata) {
    console.log("Bot hesaplama yaparken bir hata yaşadı: ", hata);
  }
}

// Motoru çalıştır ve her 10 saniyede bir bu hesabı otomatik tekrarla
console.log("Hesaplayıcı Bot göreve başladı...");
fiyatlariGuncelle(); 
setInterval(fiyatlariGuncelle, 10000);
