import Head from 'next/head';
import { useState, useEffect } from 'react';

const MOTIVATIONS = [
  "Bugün yapabileceğin en küçük şeyi yap. Küçük adımlar büyük değişimler yaratır.",
  "Kilo vermek bir maraton, sprint değil. Sabır en güçlü silahın.",
  "Dün ne yediğin değil, bugün ne yapacağın önemli.",
  "Vücudun sana teşekkür edecek. Sadece başla.",
  "Motivasyon gelip gider, alışkanlık kalır. Bugün alışkanlık kur.",
  "Her hayır dediğin fast food, hedefe bir adım daha yakın.",
  "Mükemmel olmak zorunda değilsin, sadece devam et.",
  "Yazın aynaya baktığında bu günleri hatırlayacaksın.",
  "Su iç. Yürü. Uyu. Tekrarla.",
  "Her gün biraz daha güçlü, biraz daha yakın."
];

const EXERCISES = [
  { label: 'Spor yapmadım', kcal: 0, icon: '😴' },
  { label: '10 şınav', kcal: 30, icon: '💪' },
  { label: '20 şınav', kcal: 60, icon: '💪' },
  { label: '30 şınav', kcal: 90, icon: '💪' },
  { label: '20 mekik', kcal: 25, icon: '🏋️' },
  { label: '50 mekik', kcal: 60, icon: '🏋️' },
  { label: '20 squat', kcal: 25, icon: '🦵' },
  { label: '50 squat', kcal: 50, icon: '🦵' },
  { label: '1 dk plank', kcal: 5, icon: '🧘' },
  { label: '30 dk yürüyüş', kcal: 150, icon: '🚶' },
  { label: '60 dk yürüyüş', kcal: 280, icon: '🚶' },
  { label: '30 dk koşu', kcal: 300, icon: '🏃' },
  { label: '60 dk koşu', kcal: 550, icon: '🏃' },
  { label: '45 dk gym', kcal: 250, icon: '🏋️' },
  { label: '90 dk gym', kcal: 450, icon: '🏋️' },
  { label: '30 dk bisiklet', kcal: 200, icon: '🚴' },
  { label: '30 dk yüzme', kcal: 300, icon: '🏊' },
  { label: '30 dk HIIT', kcal: 350, icon: '🔥' },
];

const todayStr = () => new Date().toISOString().split('T')[0];
const fmtDate = (d) => new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtShort = (d) => new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
const getLS = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const setLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export default function App() {
  const [st, setSt] = useState(null);
  const [tab, setTab] = useState('home');
  const [ready, setReady] = useState(false);
  const [form, setForm] = useState({ name: '', weight: '94', height: '183', target: '77', date: '', kcal: '1800' });
  const [foodInput, setFoodInput] = useState('');
  const [aiRes, setAiRes] = useState(null);
  const [aiLoad, setAiLoad] = useState(false);
  const [dailyW, setDailyW] = useState('');
  const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });
  const [selectedEx, setSelectedEx] = useState([]);
  const [exSaved, setExSaved] = useState(false);

  useEffect(() => {
    const saved = getLS('fittrack_v4', null);
    setSt(saved);
    const d = new Date(); d.setMonth(5); d.setDate(21);
    setForm(f => ({ ...f, date: d.toISOString().split('T')[0] }));
    setReady(true);
  }, []);

  useEffect(() => {
    if (st) {
      const todayEx = (st.exerciseLog || {})[todayStr()] || [];
      setSelectedEx(todayEx.map(e => e.label));
      setExSaved(todayEx.length > 0);
    }
  }, [tab, st]);

  const save = (newSt) => { setSt(newSt); setLS('fittrack_v4', newSt); };

  const doSetup = () => {
    const w = parseFloat(form.weight), h = parseFloat(form.height), t = parseFloat(form.target);
    if (!w || !h || !t || !form.date) { alert('Lütfen tüm alanları doldur!'); return; }
    save({ setupDone: true, name: form.name || 'Dostum', startWeight: w, currentWeight: w, height: h, targetWeight: t, targetDate: form.date, kcalGoal: parseInt(form.kcal) || 1800, weightLog: [{ date: todayStr(), weight: w }], foodLog: {}, exerciseLog: {}, photos: [] });
    setTab('home');
  };

  const logWeight = () => {
    const val = parseFloat(dailyW);
    if (!val || val < 30 || val > 300) { alert('Geçerli kilo gir'); return; }
    const wl = [...st.weightLog];
    const idx = wl.findIndex(w => w.date === todayStr());
    if (idx >= 0) wl[idx] = { date: todayStr(), weight: val };
    else wl.push({ date: todayStr(), weight: val });
    save({ ...st, currentWeight: val, weightLog: wl });
    setDailyW('');
  };

  const analyzeFood = async () => {
    if (!foodInput.trim()) { alert('Ne yediğini yaz!'); return; }
    setAiLoad(true); setAiRes(null);
    try {
      const r = await fetch('/api/analyze-food', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ food: foodInput }) });
      setAiRes(await r.json());
    } catch { alert('AI hesaplanamadı.'); }
    setAiLoad(false);
  };

  const confirmFood = () => {
    if (!aiRes) return;
    const fl = { ...st.foodLog };
    if (!fl[todayStr()]) fl[todayStr()] = [];
    fl[todayStr()] = [...fl[todayStr()], { name: foodInput, kcal: aiRes.kcal, detail: `${aiRes.protein}g protein · ${aiRes.karb}g karb · ${aiRes.yag}g yağ` }];
    save({ ...st, foodLog: fl });
    setFoodInput(''); setAiRes(null);
  };

  const addManual = () => {
    const name = prompt('Yemek adı:'); if (!name) return;
    const kcal = parseInt(prompt('Kalori (kcal):')); if (!kcal) return;
    const fl = { ...st.foodLog };
    if (!fl[todayStr()]) fl[todayStr()] = [];
    fl[todayStr()] = [...fl[todayStr()], { name, kcal, detail: 'Manuel giriş' }];
    save({ ...st, foodLog: fl });
  };

  const removeFood = (i) => {
    const fl = { ...st.foodLog };
    fl[todayStr()] = fl[todayStr()].filter((_, idx) => idx !== i);
    save({ ...st, foodLog: fl });
  };

  const toggleEx = (label) => {
    if (label === 'Spor yapmadım') { setSelectedEx(['Spor yapmadım']); return; }
    setSelectedEx(prev => {
      const without = prev.filter(e => e !== 'Spor yapmadım');
      return without.includes(label) ? without.filter(e => e !== label) : [...without, label];
    });
  };

  const saveExercises = () => {
    const entries = selectedEx.map(label => { const ex = EXERCISES.find(e => e.label === label); return { label, kcal: ex?.kcal || 0, icon: ex?.icon || '💪' }; });
    const el = { ...(st.exerciseLog || {}), [todayStr()]: entries };
    save({ ...st, exerciseLog: el });
    setExSaved(true);
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const photos = [...(st.photos || []), { src: ev.target.result, date: todayStr() }];
      save({ ...st, photos });
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (i) => save({ ...st, photos: (st.photos || []).filter((_, idx) => idx !== i) });

  if (!ready) return null;

  if (!st || !st.setupDone) return (
    <div style={S.page}>
      <Head><title>FitTrack — Kurulum</title><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1" /></Head>
      <div style={{ ...S.screen, paddingTop: 20 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>💪</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Merhaba!</h1>
        <p style={{ fontSize: 14, color: '#888', marginBottom: 24, lineHeight: 1.5 }}>Sana özel takip panelini oluşturalım.</p>
        {[['Adın', 'name', 'text', 'Adını gir'], ['Mevcut kilo (kg)', 'weight', 'number', '94'], ['Boy (cm)', 'height', 'number', '183'], ['Hedef kilo (kg)', 'target', 'number', '77'], ['Hedef tarih', 'date', 'date', ''], ['Günlük kalori hedefi (kcal)', 'kcal', 'number', '1800']].map(([lbl, k, type, ph]) => (
          <div key={k} style={{ marginBottom: 12 }}>
            <label style={S.lbl}>{lbl}</label>
            <input type={type} value={form[k]} placeholder={ph} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} style={S.inp} />
          </div>
        ))}
        <button onClick={doSetup} style={{ ...S.btnP, marginTop: 8 }}>Başla 🚀</button>
      </div>
    </div>
  );

  const todayFoods = st.foodLog[todayStr()] || [];
  const todayKcal = todayFoods.reduce((s, f) => s + f.kcal, 0);
  const todayExList = (st.exerciseLog || {})[todayStr()] || [];
  const todayBurned = todayExList.reduce((s, e) => s + (e.kcal || 0), 0);
  const netKcal = todayKcal - todayBurned;
  const kcalRem = st.kcalGoal - netKcal;
  const days = Math.max(0, Math.ceil((new Date(st.targetDate) - new Date()) / 86400000));
  const lost = st.startWeight - st.currentWeight;
  const pct = (st.startWeight - st.targetWeight) > 0 ? Math.min(100, Math.max(0, lost / (st.startWeight - st.targetWeight) * 100)) : 0;
  const bmi = st.currentWeight / ((st.height / 100) ** 2);
  const bmiCat = bmi < 18.5 ? 'Zayıf' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Fazla kilolu' : 'Obez';
  const tdee = Math.round((10 * st.currentWeight + 6.25 * st.height - 5 * 30 + 5) * 1.375);
  const mi = (new Date().getDay() + new Date().getDate()) % MOTIVATIONS.length;
  const hr = new Date().getHours();
  const greet = hr < 12 ? 'Günaydın' : hr < 18 ? 'İyi günler' : 'İyi akşamlar';
  const sortedLogs = [...st.weightLog].sort((a, b) => a.date.localeCompare(b.date));

  // Son 14 günün kalori verisi
  const kcalHistory = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const eaten = (st.foodLog[ds] || []).reduce((s, f) => s + f.kcal, 0);
    const burned = ((st.exerciseLog || {})[ds] || []).reduce((s, e) => s + e.kcal, 0);
    if (eaten > 0 || burned > 0) kcalHistory.push({ date: ds, eaten, burned, net: eaten - burned });
  }

  const ChartSVG = ({ data, valKey, target, color, gradId }) => {
    if (data.length < 2) return <div style={{ textAlign: 'center', padding: '24px 0', color: '#bbb', fontSize: 13 }}>En az 2 gün veri gir 📈</div>;
    const W = 340, H = 150, PX = 30, PY = 14, iW = W - PX * 2, iH = H - PY * 2;
    const vals = data.map(d => d[valKey]);
    const minV = Math.min(...vals, target !== undefined ? target : Infinity) - (valKey === 'weight' ? 0.5 : 80);
    const maxV = Math.max(...vals) + (valKey === 'weight' ? 0.5 : 80);
    const xS = i => PX + (i / (data.length - 1)) * iW;
    const yS = v => PY + iH - ((v - minV) / (maxV - minV)) * iH;
    const pts = data.map((d, i) => [xS(i), yS(d[valKey])]);
    const pathD = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
    const fillD = `M${xS(0).toFixed(1)},${(PY + iH).toFixed(1)} ` + pts.map(p => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + ` L${xS(data.length - 1).toFixed(1)},${(PY + iH).toFixed(1)} Z`;
    const yTicks = [minV, (minV + maxV) / 2, maxV];
    return (
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, overflow: 'visible' }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.2" /><stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {yTicks.map((v, i) => <g key={i}><line x1={PX} y1={yS(v)} x2={W - PX} y2={yS(v)} stroke="#eee" strokeWidth="1" /><text x={PX - 4} y={yS(v) + 4} textAnchor="end" fontSize="9" fill="#ccc">{Math.round(v)}</text></g>)}
          {target !== undefined && <><line x1={PX} y1={yS(target)} x2={W - PX} y2={yS(target)} stroke={color} strokeWidth="1.5" strokeDasharray="5,4" opacity="0.5" /><text x={W - PX + 3} y={yS(target) + 4} fontSize="9" fill={color}>Hedef</text></>}
          <path d={fillD} fill={`url(#${gradId})`} />
          <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {pts.map((p, i) => {
            const val = valKey === 'weight' ? data[i].weight + ' kg' : data[i].net + ' kcal';
            return <circle key={i} cx={p[0]} cy={p[1]} r="4.5" fill={color} stroke="white" strokeWidth="2" style={{ cursor: 'pointer' }}
              onMouseEnter={() => setTooltip({ visible: true, text: `${fmtShort(data[i].date)}: ${val}`, x: p[0] / W * 100, y: p[1] })}
              onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
              onTouchStart={() => setTooltip({ visible: true, text: `${fmtShort(data[i].date)}: ${val}`, x: p[0] / W * 100, y: p[1] })}
              onTouchEnd={() => setTimeout(() => setTooltip(t => ({ ...t, visible: false })), 1800)} />;
          })}
        </svg>
        {tooltip.visible && <div style={{ position: 'absolute', top: tooltip.y - 36, left: `calc(${tooltip.x}% - 60px)`, background: '#333', color: 'white', borderRadius: 8, padding: '4px 10px', fontSize: 12, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10 }}>{tooltip.text}</div>}
      </div>
    );
  };

  return (
    <div style={S.page}>
      <Head><title>FitTrack 💪</title><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1" /><meta name="theme-color" content="#1D9E75" /></Head>
      <div style={S.app}>

        {/* HOME */}
        {tab === 'home' && <div style={S.screen}>
          <div style={S.hero}>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>{greet}, {st.name}!</div>
            <div style={{ fontSize: 44, fontWeight: 700, lineHeight: 1 }}>{st.currentWeight.toFixed(1)} <span style={{ fontSize: 20, fontWeight: 400 }}>kg</span></div>
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 6 }}>Hedef: {st.targetWeight} kg · {Math.max(0, st.currentWeight - st.targetWeight).toFixed(1)} kg daha</div>
            <div style={S.countBox}>
              <div><div style={{ fontSize: 32, fontWeight: 700 }}>{days}</div><div style={{ fontSize: 12, opacity: 0.85 }}>Yaza kalan gün</div></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: 18, fontWeight: 600 }}>{Math.round(pct)}%</div><div style={{ fontSize: 12, opacity: 0.85 }}>hedefe ulaşıldı</div></div>
            </div>
            <div style={S.bmiPill}>BMI: {bmi.toFixed(1)} · {bmiCat}</div>
          </div>

          <div style={S.secTitle}>Kilo grafiği</div>
          <div style={S.card}>
            <ChartSVG data={sortedLogs} valKey="weight" target={st.targetWeight} color="#1D9E75" gradId="wg" />
            {sortedLogs.length >= 2 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#ccc', marginTop: 4 }}><span>{fmtShort(sortedLogs[0].date)}</span><span>{fmtShort(sortedLogs[sortedLogs.length - 1].date)}</span></div>}
          </div>

          <div style={S.secTitle}>İlerleme</div>
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 6 }}><span>{st.startWeight} kg (başlangıç)</span><span>{st.targetWeight} kg (hedef)</span></div>
            <div style={S.progWrap}><div style={{ ...S.progBar, width: pct + '%' }} /></div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{lost > 0 ? `${lost.toFixed(1)} kg verildi 🎉` : 'Henüz kilo kaydı yok'}</div>
          </div>

          <div style={S.statGrid}>
            <div style={S.statCard}>
              <div style={S.statLbl}>Net kalori (bugün)</div>
              <div style={{ fontSize: 20, fontWeight: 600 }}>{netKcal} <span style={{ fontSize: 12 }}>kcal</span></div>
              <div style={S.progWrap}><div style={{ ...S.progBar, width: Math.min(100, Math.max(0, netKcal / st.kcalGoal * 100)) + '%', background: 'linear-gradient(90deg,#EF9F27,#FAC775)' }} /></div>
              <div style={{ fontSize: 11, color: kcalRem >= 0 ? '#1D9E75' : '#D85A30', marginTop: 4 }}>{kcalRem >= 0 ? `${kcalRem} kcal kaldı` : `${Math.abs(kcalRem)} kcal fazla!`}</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statLbl}>Bugün yakılan</div>
              <div style={{ fontSize: 20, fontWeight: 600 }}>{todayBurned} <span style={{ fontSize: 12 }}>kcal</span></div>
              <div style={{ fontSize: 13, marginTop: 4 }}>{todayExList.filter(e => e.kcal > 0).map(e => e.icon).join(' ') || '—'}</div>
            </div>
          </div>

          <div style={S.motivCard}>
            <div style={{ fontSize: 14, lineHeight: 1.6, fontStyle: 'italic', color: '#412402' }}>"{MOTIVATIONS[mi]}"</div>
            <div style={{ fontSize: 12, color: '#633806', marginTop: 8 }}>— Günlük motivasyon</div>
          </div>

          <div style={S.card}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 10 }}>Bugünün kilosunu gir</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" value={dailyW} placeholder="kg" step="0.1" onChange={e => setDailyW(e.target.value)} style={{ ...S.inp, flex: 1 }} />
              <button onClick={logWeight} style={{ ...S.btnP, width: 'auto', padding: '10px 18px' }}>Kaydet</button>
            </div>
          </div>
        </div>}

        {/* FOOD & SPORT */}
        {tab === 'food' && <div style={S.screen}>
          <div style={S.secTitle}>Bugünkü kalori özeti</div>
          <div style={{ ...S.card, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px 14px' }}>
            <svg width="130" height="130" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r="54" fill="none" stroke="#f0f0f0" strokeWidth="13" />
              <circle cx="65" cy="65" r="54" fill="none" stroke={netKcal > st.kcalGoal ? '#D85A30' : '#1D9E75'} strokeWidth="13"
                strokeDasharray="339" strokeDashoffset={339 - (339 * Math.min(1, Math.max(0, netKcal / st.kcalGoal)))}
                strokeLinecap="round" transform="rotate(-90 65 65)" />
              <text x="65" y="57" textAnchor="middle" fontSize="20" fontWeight="600" fill="#222">{netKcal}</text>
              <text x="65" y="73" textAnchor="middle" fontSize="11" fill="#888">net kcal</text>
            </svg>
            <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>Hedef: {st.kcalGoal} kcal</div>
            <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 600 }}>{todayKcal}</div><div style={{ fontSize: 11, color: '#888' }}>yenilen</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 600, color: '#1D9E75' }}>-{todayBurned}</div><div style={{ fontSize: 11, color: '#888' }}>spor</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 600 }}>{Math.max(0, kcalRem)}</div><div style={{ fontSize: 11, color: '#888' }}>kalan</div></div>
            </div>
          </div>

          {kcalHistory.length >= 2 && <>
            <div style={S.secTitle}>Kalori geçmişi (net, son 14 gün)</div>
            <div style={S.card}>
              <ChartSVG data={kcalHistory} valKey="net" target={st.kcalGoal} color="#EF9F27" gradId="kg" />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#ccc', marginTop: 4 }}><span>{fmtShort(kcalHistory[0].date)}</span><span>{fmtShort(kcalHistory[kcalHistory.length - 1].date)}</span></div>
            </div>
            <div style={S.secTitle}>Gün gün detay</div>
            <div style={S.card}>
              {[...kcalHistory].reverse().map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: i < kcalHistory.length - 1 ? '0.5px solid #f5f5f5' : 'none', gap: 8 }}>
                  <div style={{ fontSize: 12, color: '#888', width: 68, flexShrink: 0 }}>{fmtShort(d.date)}</div>
                  <div style={{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: Math.min(100, d.net / st.kcalGoal * 100) + '%', height: '100%', background: d.net > st.kcalGoal ? '#D85A30' : '#1D9E75', borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: 12, width: 62, textAlign: 'right', color: d.net > st.kcalGoal ? '#D85A30' : '#333', fontWeight: 500 }}>{d.net} kcal</div>
                  {d.burned > 0 && <div style={{ fontSize: 11, color: '#1D9E75', width: 42, textAlign: 'right' }}>-{d.burned}🔥</div>}
                </div>
              ))}
            </div>
          </>}

          <div style={S.secTitle}>Yemek ekle</div>
          <div style={S.card}>
            <div style={{ marginBottom: 12 }}><input type="text" value={foodInput} placeholder="örn. 2 yumurta, 1 dilim ekmek, ayran" onChange={e => setFoodInput(e.target.value)} style={S.inp} /></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={analyzeFood} style={{ ...S.btnP, flex: 1, width: 'auto' }} disabled={aiLoad}>{aiLoad ? 'Hesaplanıyor...' : 'AI ile hesapla ✨'}</button>
              <button onClick={addManual} style={{ ...S.btnS, width: 'auto', padding: '11px 14px' }}>Manuel</button>
            </div>
            {aiRes && <div style={{ background: '#E1F5EE', borderRadius: 10, padding: 12, marginTop: 10 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#0F6E56' }}>{aiRes.kcal} kcal</div>
              <div style={{ fontSize: 12, color: '#085041', marginTop: 4 }}>Protein: {aiRes.protein}g · Karb: {aiRes.karb}g · Yağ: {aiRes.yag}g</div>
              <div style={{ fontSize: 13, color: '#085041', marginTop: 6 }}>{aiRes.ozet}</div>
              <button onClick={confirmFood} style={{ ...S.btnP, marginTop: 12 }}>Ekle ✓</button>
            </div>}
          </div>

          {todayFoods.length > 0 && <div style={S.card}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Bugün yenenler</div>
            {todayFoods.map((f, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < todayFoods.length - 1 ? '0.5px solid #f5f5f5' : 'none' }}>
                <div><div style={{ fontSize: 14 }}>{f.name}</div><div style={{ fontSize: 11, color: '#aaa' }}>{f.detail}</div></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: '#1D9E75', fontWeight: 500 }}>{f.kcal} kcal</span>
                  <span onClick={() => removeFood(i)} style={{ cursor: 'pointer', color: '#ddd', fontSize: 20 }}>×</span>
                </div>
              </div>
            ))}
            <div style={{ paddingTop: 10, borderTop: '0.5px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#888' }}>Toplam yenilen</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#1D9E75' }}>{todayKcal} kcal</span>
            </div>
          </div>}

          <div style={S.secTitle}>Bugün ne yaptın? (çoklu seçim)</div>
          <div style={S.card}>
            {exSaved && todayExList.length > 0 && <div style={{ background: '#E1F5EE', borderRadius: 10, padding: 10, marginBottom: 12, fontSize: 13, color: '#085041' }}>
              ✓ Kaydedildi: {todayExList.map(e => `${e.icon} ${e.label}`).join(', ')} · <strong>{todayBurned} kcal yakıldı</strong>
            </div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {EXERCISES.map(ex => {
                const sel = selectedEx.includes(ex.label);
                return <div key={ex.label} onClick={() => toggleEx(ex.label)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${sel ? '#1D9E75' : '#eee'}`, background: sel ? '#E1F5EE' : 'transparent', cursor: 'pointer' }}>
                  <span style={{ fontSize: 14 }}>{ex.icon} {ex.label}</span>
                  {ex.kcal > 0 && <span style={{ fontSize: 13, color: '#1D9E75', fontWeight: 500 }}>~{ex.kcal} kcal</span>}
                </div>;
              })}
            </div>
            <button onClick={saveExercises} style={{ ...S.btnP, marginTop: 12 }}>Kaydet</button>
            {Object.keys(st.exerciseLog || {}).length > 1 && <>
              <div style={{ fontSize: 11, color: '#bbb', marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Spor geçmişi</div>
              {Object.entries(st.exerciseLog).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 7).map(([date, exs]) => (
                <div key={date} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid #f5f5f5', fontSize: 12 }}>
                  <span style={{ color: '#888', width: 70 }}>{fmtShort(date)}</span>
                  <span style={{ flex: 1, color: '#333' }}>{exs.filter(e => e.kcal > 0).map(e => `${e.icon} ${e.label}`).join(', ') || '—'}</span>
                  <span style={{ color: '#1D9E75', fontWeight: 500 }}>{exs.reduce((s, e) => s + e.kcal, 0)} 🔥</span>
                </div>
              ))}
            </>}
          </div>
        </div>}

        {/* PROGRESS */}
        {tab === 'progress' && <div style={S.screen}>
          <div style={S.secTitle}>Kilo geçmişi</div>
          <div style={S.card}>
            {[...st.weightLog].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20).map((l, i, arr) => {
              const mn = Math.min(...arr.map(x => x.weight)), mx = Math.max(...arr.map(x => x.weight)), rng = mx - mn || 1;
              return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < arr.length - 1 ? '0.5px solid #f5f5f5' : 'none' }}>
                <div style={{ fontSize: 12, color: '#888', width: 90, flexShrink: 0 }}>{new Date(l.date).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                <div style={{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}><div style={{ width: ((l.weight - mn) / rng * 65 + 20) + '%', height: '100%', background: '#1D9E75', borderRadius: 4 }} /></div>
                <div style={{ fontSize: 13, fontWeight: 500, width: 50, textAlign: 'right' }}>{l.weight} kg</div>
              </div>;
            })}
            {st.weightLog.length === 0 && <div style={{ color: '#ccc', textAlign: 'center', padding: 16, fontSize: 13 }}>Henüz kayıt yok</div>}
          </div>

          <div style={S.secTitle}>Gelişim fotoğrafları</div>
          <div style={S.card}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {(st.photos || []).map((p, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={p.src} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: 12, display: 'block' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(0,0,0,0.6))', borderRadius: '0 0 12px 12px', padding: '20px 8px 6px', fontSize: 11, color: 'white', textAlign: 'center' }}>{fmtDate(p.date)}</div>
                  <div onClick={() => removePhoto(i)} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.45)', color: 'white', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14 }}>×</div>
                </div>
              ))}
              <div onClick={() => document.getElementById('ph-input').click()} style={{ border: '1.5px dashed #ddd', borderRadius: 12, aspectRatio: '3/4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fafafa', color: '#bbb', gap: 6 }}>
                <span style={{ fontSize: 28 }}>📷</span><span style={{ fontSize: 12 }}>Fotoğraf ekle</span>
              </div>
            </div>
            <input type="file" accept="image/*" id="ph-input" style={{ display: 'none' }} onChange={handlePhoto} />
            <div style={{ fontSize: 12, color: '#bbb', textAlign: 'center' }}>Fotoğraflar tarihleriyle cihazında saklanır. Dilediğin kadar ekle.</div>
          </div>
        </div>}

        {/* SETTINGS */}
        {tab === 'settings' && <SettingsTab st={st} tdee={tdee} bmi={bmi}
          onSave={sf => { save({ ...st, name: sf.name || st.name, height: parseFloat(sf.height) || st.height, targetWeight: parseFloat(sf.target) || st.targetWeight, targetDate: sf.date || st.targetDate, kcalGoal: parseInt(sf.kcal) || st.kcalGoal }); alert('Kaydedildi ✓'); }}
          onReset={() => { if (confirm('Tüm veriler silinecek?')) { localStorage.removeItem('fittrack_v4'); window.location.reload(); } }} />}

        <div style={S.tabBar}>
          {[['home', '🏠', 'Ana Sayfa'], ['food', '🍽️', 'Kalori & Spor'], ['progress', '📊', 'İlerleme'], ['settings', '⚙️', 'Ayarlar']].map(([id, icon, lbl]) => (
            <button key={id} onClick={() => setTab(id)} style={{ ...S.tabBtn, color: tab === id ? '#1D9E75' : '#bbb' }}>
              <span style={{ fontSize: 20 }}>{icon}</span><span style={{ fontSize: 9 }}>{lbl}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ st, tdee, bmi, onSave, onReset }) {
  const [sf, setSf] = useState({ name: st.name, height: st.height, target: st.targetWeight, date: st.targetDate, kcal: st.kcalGoal });
  return (
    <div style={S.screen}>
      <div style={S.secTitle}>Profil & Ayarlar</div>
      <div style={S.card}>
        {[['Adın', 'name', 'text'], ['Boy (cm)', 'height', 'number'], ['Hedef kilo (kg)', 'target', 'number'], ['Hedef tarih', 'date', 'date'], ['Günlük kalori hedefi', 'kcal', 'number']].map(([lbl, k, type]) => (
          <div key={k} style={{ marginBottom: 12 }}>
            <label style={S.lbl}>{lbl}</label>
            <input type={type} value={sf[k]} onChange={e => setSf(p => ({ ...p, [k]: e.target.value }))} style={S.inp} />
          </div>
        ))}
        <button onClick={() => onSave(sf)} style={S.btnP}>Kaydet</button>
      </div>
      <div style={S.card}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 10 }}>Hesaplanan değerler</div>
        <div style={{ fontSize: 13, color: '#888', lineHeight: 2 }}>
          BMI: {bmi.toFixed(1)}<br />Günlük yakım (TDEE): ~{tdee} kcal<br />Kalori açığın: ~{tdee - st.kcalGoal} kcal/gün<br />Teorik haftalık kayıp: ~{((tdee - st.kcalGoal) * 7 / 7700).toFixed(2)} kg/hafta
        </div>
      </div>
      <button onClick={onReset} style={{ ...S.btnS, marginBottom: 20 }}>Sıfırla / Yeniden başla</button>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', background: '#f8f9fa' },
  app: { maxWidth: 390, margin: '0 auto', paddingBottom: 80 },
  screen: { padding: '0 16px' },
  hero: { background: 'linear-gradient(135deg,#1D9E75,#0F6E56)', borderRadius: 20, padding: 20, margin: '14px 0 16px', color: 'white' },
  countBox: { marginTop: 14, background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  bmiPill: { display: 'inline-block', background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 12px', fontSize: 12, marginTop: 10 },
  secTitle: { fontSize: 11, fontWeight: 600, color: '#aaa', margin: '18px 0 10px', textTransform: 'uppercase', letterSpacing: '0.06em' },
  card: { background: 'white', border: '0.5px solid #eee', borderRadius: 16, padding: 16, marginBottom: 12 },
  statGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 },
  statCard: { background: 'white', border: '0.5px solid #eee', borderRadius: 14, padding: 14 },
  statLbl: { fontSize: 12, color: '#888', marginBottom: 4 },
  progWrap: { background: '#f0f0f0', borderRadius: 8, height: 8, overflow: 'hidden', margin: '6px 0 2px' },
  progBar: { height: '100%', borderRadius: 8, background: 'linear-gradient(90deg,#1D9E75,#9FE1CB)', transition: 'width 0.4s' },
  motivCard: { background: 'linear-gradient(135deg,#FAC775,#EF9F27)', borderRadius: 16, padding: 16, marginBottom: 12 },
  tabBar: { display: 'flex', background: 'white', borderTop: '0.5px solid #eee', position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 390, zIndex: 100 },
  tabBtn: { flex: 1, padding: '10px 4px 8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 },
  inp: { width: '100%', border: '0.5px solid #ddd', borderRadius: 10, padding: '10px 12px', fontSize: 15, background: '#fafafa', fontFamily: 'inherit', outline: 'none' },
  lbl: { display: 'block', fontSize: 13, color: '#888', marginBottom: 5 },
  btnP: { width: '100%', padding: 13, background: '#1D9E75', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnS: { width: '100%', padding: 11, background: 'transparent', color: '#1D9E75', border: '1px solid #1D9E75', borderRadius: 12, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
};
