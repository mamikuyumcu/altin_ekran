const http = require('http');

// Sanal bekçinin (cron-job) uyanık tutması için canlı sayfa açıyoruz
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write("Kasimpasa Kuyumcusu Akilli Botu Aktif!");
  res.end();
}).listen(process.env.PORT || 3000);

const firebaseUrl = "https://kasimpasakuyumcusu-aa3cc-default-rtdb.firebaseio.com";
const apiUrl = "https://prdprc.saglamoglu.app/api/v1/prices/currentmarketproductprices";

async function fiyatlariGuncelle() {
  try {
    // 1. API'den anlık fiyatı çek
    const apiYaniti = await fetch(apiUrl);
    const jsonVeri = await apiYaniti.json();
    const hasAltinVerisi = jsonVeri.data.find(urun => urun.marketProductId == 1);
    const hasAlis = Number(hasAltinVerisi.customerBuysAt);
    const hasSatis = Number(hasAltinVerisi.customerSellsAt);

    // 2. Excel'den gelen çarpanları oku
    const ayarYaniti = await fetch(firebaseUrl + "/ayarlar.json");
    const carpanlar = await ayarYaniti.json();
    if (!carpanlar) return;

    // 3. Günlük 11:00 Hafıza Kontrolü
    const simdi = new Date();
    let bugunTarih = simdi.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' });
    
    const acilisYaniti = await fetch(firebaseUrl + "/gunun_acilisi.json");
    let acilisVerisi = await acilisYaniti.json();

    // Hafıza hiç yoksa veya dünden kalmaysa, saat 11:00 olana kadar geçici olarak şu anki fiyatı yaz
    if (!acilisVerisi || acilisVerisi.tarih !== bugunTarih) {
      acilisVerisi = { satis: hasSatis, tarih: bugunTarih };
      await fetch(firebaseUrl + "/gunun_acilisi.json", {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(acilisVerisi)
      });
    }

    // Saat tam 11:00 olduğunda bugünün asıl fiyatını kalıcı olarak kilitle
    let anlikSaat = simdi.toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit', hour12: false });
    if (anlikSaat === "11:00") {
      acilisVerisi = { satis: hasSatis, tarih: bugunTarih };
      await fetch(firebaseUrl + "/gunun_acilisi.json", {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(acilisVerisi)
      });
      console.log("Saat 11:00 fiyatı hafızaya kilitlendi.");
    }

    // 4. Yüzde farkı hesapla
    let baslangicSatis = acilisVerisi.satis;
    let yuzdeFark = baslangicSatis > 0 ? ((hasSatis - baslangicSatis) / baslangicSatis) * 100 : 0;

    // 5. Tüm ürünleri çarpanlarıyla hesapla ve paketle
    let urunlerObjesi = {
      hasaltin: { alis: hasAlis, satis: hasSatis, fark: yuzdeFark }
    };

    for (const [isim, carpan] of Object.entries(carpanlar)) {
      urunlerObjesi[isim] = {
        alis: Number((hasAlis * carpan.alis).toFixed(2)),
        satis: Number((hasSatis * carpan.satis).toFixed(2)),
        fark: yuzdeFark
      };
    }

    let saatString = simdi.toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let nihaiPaket = { sonGuncelleme: saatString, urunler: urunlerObjesi };

    // 6. Sonuçları vitrine (fiyatlar.json) fırlat
    await fetch(firebaseUrl + "/fiyatlar.json", {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nihaiPaket)
    });

    console.log("Fiyatlar ve farklar başarıyla hesaplandı: " + saatString);

  } catch (hata) {
    console.log("Bot hesaplama yaparken bir hata yaşadı: ", hata);
  }
}

console.log("11:00 Hafızalı Akilli Bot göreve başladı...");
fiyatlariGuncelle(); 
setInterval(fiyatlariGuncelle, 10000);
