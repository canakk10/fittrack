export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { food } = req.body;
  if (!food) return res.status(400).json({ error: 'food required' });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key eksik. Vercel Environment Variables kontrol et.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: `Diyetisyen olarak su yiyecegin toplam kalori ve makrolarini hesapla: "${food}"\n\nSADECE asagidaki gibi gecerli JSON dondur. Baska hicbir kelime yazma:\n{"kcal":250,"protein":12,"karb":30,"yag":8,"ozet":"Kisa aciklama"}`
        }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return res.status(500).json({ error: 'Anthropic API hatasi: ' + response.status });
    }

    const data = await response.json();
    const rawText = data?.content?.[0]?.text ?? '';

    // JSON bloğunu regex ile çıkar
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('JSON bulunamadi. Ham metin:', rawText);
      return res.status(500).json({ error: 'Gecersiz AI yaniti' });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // NaN önlemek için Number() ile zorla
    const result = {
      kcal: Number(parsed.kcal) || 0,
      protein: Number(parsed.protein) || 0,
      karb: Number(parsed.karb) || 0,
      yag: Number(parsed.yag) || 0,
      ozet: String(parsed.ozet || '')
    };

    return res.status(200).json(result);
  } catch (e) {
    console.error('FitTrack analyze error:', e);
    return res.status(500).json({ error: e.message || 'Bilinmeyen hata' });
  }
}
