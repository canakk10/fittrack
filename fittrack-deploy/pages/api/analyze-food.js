export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { food } = req.body;
  if (!food) return res.status(400).json({ error: 'food required' });
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{ role: 'user', content: `Sen bir diyetisyensin. Şu yiyeceklerin kalori ve makro değerlerini hesapla: "${food}"\nSadece JSON döndür, başka hiçbir şey yazma:\n{"kcal": sayı, "protein": sayı, "karb": sayı, "yag": sayı, "ozet": "kısa türkçe özet"}` }]
      })
    });
    const data = await response.json();
    const parsed = JSON.parse(data.content[0].text.trim());
    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: 'AI hesaplanamadı' });
  }
}
