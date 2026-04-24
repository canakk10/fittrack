# FitTrack 💪

Kilo takip uygulaması — AI destekli kalori hesaplama, kilo grafiği, fotoğraf karşılaştırması.

## Deploy Talimatları (5 dakika)

### 1. GitHub'a yükle

1. [github.com](https://github.com) → "New repository" → `fittrack` adını ver → Create
2. Bu klasördeki dosyaları upload et (veya git kullan):
   ```
   git init
   git add .
   git commit -m "ilk commit"
   git remote add origin https://github.com/KULLANICI_ADIN/fittrack.git
   git push -u origin main
   ```

### 2. Vercel'e bağla

1. [vercel.com](https://vercel.com) → "Sign up with GitHub"
2. "Add New Project" → GitHub reposunu seç → Import
3. **Environment Variables** bölümüne ekle:
   - Key: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-...` (kendi API key'in)
4. "Deploy" — bitti!

### 3. API Key nereden alınır?

[console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key

### Kullanım

- Vercel sana `fittrack-xxx.vercel.app` gibi bir link verir
- Bu linki annen, kardeşin, kız arkadaşın paylaşabilirsin
- Herkes kendi verilerini kendi tarayıcısında saklar (localStorage)

## Özellikler

- Gün gün kilo grafiği (interaktif)
- AI ile kalori hesaplama (yemek yaz, AI hesaplar)
- Yaza kaç gün kaldı sayacı
- BMI ve ilerleme takibi
- Fotoğraf karşılaştırması
- Günlük motivasyon mesajları
