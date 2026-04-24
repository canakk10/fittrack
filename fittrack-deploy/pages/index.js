import Head from 'next/head';
import { useEffect, useState } from 'react';

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

const SPORTS = [
  { id: 'none', label: 'Spor yapmadım', kcal: 0, icon: '😴' },
  { id: 'walk30', label: '30 dk yürüyüş', kcal: 150, icon: '🚶' },
  { id: 'walk60', label: '60 dk yürüyüş', kcal: 280, icon: '🚶' },
  { id: 'run30', label: '30 dk koşu', kcal: 300, icon: '🏃' },
  { id: 'run60', label: '60 dk koşu', kcal: 550, icon: '🏃' },
  { id: 'gym45', label: '45 dk gym', kcal: 250, icon: '🏋️' },
  { id: 'gym90', label: '90 dk gym', kcal: 450, icon: '🏋️' },
  { id: 'bike30', label: '30 dk bisiklet', kcal: 200, icon: '🚴' },
  { id: 'swim30', label: '30 dk yüzme', kcal: 300, icon: '🏊' },
  { id: 'hiit30', label: '30 dk HIIT', kcal: 350, icon: '🔥' },
];

const todayStr = () => new Date().toISOString().split('T')[0];
const getLS = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const setLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const S = {
  page: { minHeight: '100vh', background: '#f8f9fa', fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif' },
  app: { maxWidth: 430, margin: '0 auto', paddingBottom: 90 },
  screen: { padding: '0 16px' },
  hero: { background: 'linear-gradient(135deg,#1D9E75,#0F6E56)', borderRadius: 20, padding: 20, margin: '14px 0 16px', color: 'white' },
  countBox: { marginTop: 14, background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  bmiPill: { display: 'inline-block', background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 12px', fontSize: 12, marginTop: 10 },
  secTitle: { fontSize: 12, fontWeight: 600, color: '#888', margin: '18px 0 10px', textTransform: 'uppercase', letterSpacing: '0.06em' },
  card: { background: 'white', border: '0.5px solid #eee', borderRadius: 16, padding: 16, marginBottom: 12 },
  statGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 },
  statCard: { background: 'white', border: '0.5px solid #eee', borderRadius: 14, padding: 14 },
  statLbl: { fontSize: 12, color: '#888', marginBottom: 4 },
  statVal: { fontSize: 20, fontWeight: 700 },
  progWrap: { background: '#f0f0f0', borderRadius: 8, height: 8, overflow: 'hidden', margin: '6px 0 2px' },
  progBar: { height: '100%', borderRadius: 8, background: 'linear-gradient(90deg,#1D9E75,#9FE1CB)', transition: 'width 0.4s' },
  motivCard: { background: 'linear-gradient(135deg,#FAC775,#EF9F27)', borderRadius: 16, padding: 16, marginBottom: 12 },
  tabBar: { display: 'flex', background: 'white', borderTop: '0.5px solid #eee', position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, zIndex: 100 },
  tabBtn: { flex: 1, padding: '10px 4px 8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontSize: 10 },
  inp: { width: '100%', border: '0.5px solid #ddd', borderRadius: 10, padding: '10px 12px', fontSize: 15, background: '#fafafa', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  lbl: { display: 'block', fontSize: 13, color: '#666', marginBottom: 5 },
  btnP: { width: '100%', padding: 13, background: '#1D9E75', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  btnS: { width: '100%', padding: 11, background: 'transparent', color: '#1D9E75', border: '1.5px solid #1D9E75', borderRadius: 12, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
  row: { marginBottom: 12 },
  genderBtn: (active) => ({ flex: 1, padding: '10px 0', border: active ? '2px solid #1D9E75' : '1px solid #ddd', borderRadius: 10, background: active ? '#E1F5EE' : 'white', color: active ? '#0F6E56' : '#888', fontWeight: active ? 600 : 400, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }),
  sportBtn: (active) => ({ padding: '10px 12px', border: active ? '2px solid #1D9E75' : '1px solid #eee', borderRadius: 10, background: active ? '#E1F5EE' : 'white', cursor: 'pointer', fontSize: 12, color: active ? '#0F6E56' : '#555', fontFamily: 'inherit', textAlign: 'left', width: '100%' }),
};

export default function App() {
  const [st, setSt] = useState(null);
  const [tab, setTab] = useState('home');
  const [ready, setReady] = useState(false);
  const [form, setForm] = useState({ name: '', weight: '94', height: '183', target: '77', date: '', kcal: '1800', gender: 'male', age: '30' });
  const [foodInput, setFoodInput] = useState('');
  const [aiRes, setAiRes] = useState(null);
  const [aiLoad, setAiLoad] = useState(false);
  const [dailyW, setDailyW] = useState('');
  const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });
  const [selectedSport, setSelectedSport] = useState('none');
  const [sf, setSf] = useState({});

  useEffect(() => {
    const saved = getLS('fittrack_v4', null);
    setSt(saved);
    if (saved) setSf({ name: saved.name, height: saved.height, target: saved.targetWeight, date: saved.targetDate, kcal: saved.kcalGoal, gender: saved.gender || 'male', age: saved.age || 30 });
    const d = new Date(); d.setMonth(5); d.setDate(21);
    setForm(f => ({ ...f, date: d.toISOString().split('T')[0] }));
    setReady(true);
  }, []);

  const save = (newSt) => { setSt(newSt); setLS('fittrack_v4', newSt); };

  const calcKcalGoal = (weight, height, age, gender) => {
    const bmr = gender === 'female'
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5;
    return Math.round(bmr * 1.375) - 500;
  };

  const doSetup = () => {
    const w = parseFloat(form.weight), h = parseFloat(form.height), t = parseFloat(form.target), age = parseInt(form.age) || 30;
    if (!w || !h || !t || !form.date) { alert('Lütfen tüm alanları doldur!'); return; }
    const kcalGoal = parseInt(form.kcal) || calcKcalGoal(w, h, age, form.gender);
    save({
      setupDone: true, name: form.name || 'Dostum',
      startWeight: w, currentWeight: w, height: h,
      targetWeight: t, targetDate: form.date,
      kcalGoal, gender: form.gender, age,
      weightLog: [{ date: todayStr(), weight: w }],
      foodLog: {}, sportLog: {}, photos: {}
    });
    setTab('home');
  };

  const logWeight = () => {
    const val = parseFloat(dailyW);
    if (!val || val < 30 || val > 300) { alert('Geçerli kilo gir'); return; }
    const newSt = { ...st, currentWeight: val, weightLog: [...st.weightLog] };
    const idx = newSt.weightLog.findIndex(w => w.date === todayStr());
    if (idx >= 0) newSt.weightLog[idx] = { date: todayStr(), weight: val };
    else newSt.weightLog.push({ date: todayStr(), weight: val });
    save(newSt);
    setDailyW('');
  };

  const logSport = () => {
    const sport = SPORTS.find(s => s.id === selectedSport);
    const newSportLog = { ...st.sportLog, [todayStr()]: sport };
    save({ ...st, sportLog: newSportLog });
    alert(`✓ ${sport.label} kaydedildi! ${sport.kcal > 0 ? sport.kcal + ' kcal yakıldı 🔥' : ''}`);
  };

  const analyzeFood = async () => {
    if (!foodInput.trim()) { alert('Ne yediğini yaz!'); return; }
    setAiLoad(true); setAiRes(null);
    try {
      const r = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food: foodInput })
      });
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      setAiRes(data);
    } catch (e) {
      alert('AI hesaplanamadı: ' + e.message);
    }
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

  const handlePhoto = (n, e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => save({ ...st, photos: { ...(st.photos || {}), [n]: ev.target.result } });
    reader.readAsDataURL(file);
  };

  const saveSettings = () => {
    const age = parseInt(sf.age) || st.age || 30;
    const newKcal = parseInt(sf.kcal) || calcKcalGoal(st.currentWeight, parseFloat(sf.height) || st.height, age, sf.gender || st.gender);
    save({ ...st, name: sf.name || st.name, height: parseFloat(sf.height) || st.height, targetWeight: parseFloat(sf.target) || st.targetWeight, targetDate: sf.date || st.targetDate, kcalGoal: newKcal, gender: sf.gender || st.gender, age });
    alert('Kaydedildi ✓');
  };

  if (!ready) return null;

  // SETUP
  if (!st || !st.setupDone) return (
    <div style={S.page}>
      <Head><title>FitTrack 💪</title><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1" /></Head>
      <div style={{ ...S.app }}>
        <div style={{ padding: '24px 20px' }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>💪</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Merhaba!</h1>
          <p style={{ fontSize: 14, color: '#888', marginBottom: 24, lineHeight: 1.6 }}>Sana özel takip panelini kurmak için birkaç bilgiye ihtiyacım var.</p>

          <div style={S.row}><label style={S.lbl}>Adın</label><input type="text" value={form.name} placeholder="Adını gir" onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={S.inp} /></div>

          <div style={S.row}>
            <label style={S.lbl}>Cinsiyet</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={S.genderBtn(form.gender === 'male')} onClick={() => setForm(p => ({ ...p, gender: 'male' }))}>👨 Erkek</button>
              <button style={S.genderBtn(form.gender === 'female')} onClick={() => setForm(p => ({ ...p, gender: 'female' }))}>👩 Kadın</button>
            </div>
          </div>

          <div style={S.row}><label style={S.lbl}>Yaş</label><input type="number" value={form.age} onChange={e => setForm(p => ({ ...p, age: e.target.value }))} style={S.inp} /></div>
          <div style={S.row}><label style={S.lbl}>Mevcut kilo (kg)</label><input type="number" value={form.weight} step="0.1" onChange={e => setForm(p => ({ ...p, weight: e.target.value }))} style={S.inp} /></div>
          <div style={S.row}><label style={S.lbl}>Boy (cm)</label><input type="number" value={form.height} onChange={e => setForm(p => ({ ...p, height: e.target.value }))} style={S.inp} /></div>
          <div style={S.row}><label style={S.lbl}>Hedef kilo (kg)</label><input type="number" value={form.target} step="0.1" onChange={e => setForm(p => ({ ...p, target: e.target.value }))} style={S.inp} /></div>
          <div style={S.row}><label style={S.lbl}>Hedef tarih (yaz başı)</label><input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={S.inp} /></div>
          <div style={S.row}>
            <label style={S.lbl}>Günlük kalori hedefi (kcal) — boş bırakırsan otomatik hesaplanır</label>
            <input type="number" value={form.kcal} placeholder="Otomatik" onChange={e => setForm(p => ({ ...p, kcal: e.target.value }))} style={S.inp} />
          </div>
          <button onClick={doSetup} style={{ ...S.btnP, marginTop: 8 }}>Başla 🚀</button>
        </div>
      </div>
    </div>
  );

  // Computed values
  const todayFoods = st.foodLog[todayStr()] || [];
  const todayKcal = todayFoods.reduce((s, f) => s + f.kcal, 0);
  const todaySport = st.sportLog && st.sportLog[todayStr()] ? st.sportLog[todayStr()] : null;
  const burnedKcal = todaySport ? todaySport.kcal : 0;
  const netKcal = todayKcal - burnedKcal;
  const kcalRem = st.kcalGoal - netKcal;
  const days = Math.max(0, Math.ceil((new Date(st.targetDate) - new Date()) / 86400000));
  const totalLose = st.startWeight - st.targetWeight;
  const lost = st.startWeight - st.currentWeight;
  const pct = totalLose > 0 ? Math.min(100, Math.max(0, lost / totalLose * 100)) : 0;
  const bmi = st.currentWeight / ((st.height / 100) ** 2);
  const bmiCat = bmi < 18.5 ? 'Zayıf' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Fazla kilolu' : 'Obez';
  const age = st.age || 30;
  const bmr = st.gender === 'female' ? 10 * st.currentWeight + 6.25 * st.height - 5 * age - 161 : 10 * st.currentWeight + 6.25 * st.height - 5 * age + 5;
  const tdee = Math.round(bmr * 1.375);
  const mi = (new Date().getDay() + new Date().getDate()) % MOTIVATIONS.length;
  const hr = new Date().getHours();
  const greet = hr < 12 ? 'Günaydın' : hr < 18 ? 'İyi günler' : 'İyi akşamlar';
  const sortedLogs = [...st.weightLog].sort((a, b) => a.date.localeCompare(b.date));

  // Chart
  const ChartSVG = () => {
    if (sortedLogs.length < 2) return <div style={{ textAlign: 'center', padding: '28px 0', color: '#aaa', fontSize: 13 }}>En az 2 gün kilo gir, grafik oluşsun 📈</div>;
    const W = 360, H = 160, PX = 30, PY = 14;
    const iW = W - PX * 2, iH = H - PY * 2;
    const weights = sortedLogs.map(l => l.weight);
    const minW = Math.min(...weights, st.targetWeight) - 0.5;
    const maxW = Math.max(...weights) + 0.5;
    const xS = i => PX + (i / (sortedLogs.length - 1)) * iW;
    const yS = w => PY + iH - ((w - minW) / (maxW - minW)) * iH;
    const pts = sortedLogs.map((l, i) => [xS(i), yS(l.weight)]);
    const pathD = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
    const fillD = `M${xS(0).toFixed(1)},${(PY + iH).toFixed(1)} ` + pts.map(p => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + ` L${xS(sortedLogs.length - 1).toFixed(1)},${(PY + iH).toFixed(1)} Z`;
    const ty = yS(st.targetWeight);
    const yTicks = [minW, (minW + maxW) / 2, maxW];
    return (
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, overflow: 'visible' }}>
          <defs>
            <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1D9E75" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#1D9E75" stopOpacity="0" />
            </linearGradient>
          </defs>
          {yTicks.map((v, i) => {
            const y = yS(v);
            return <g key={i}>
              <line x1={PX} y1={y} x2={W - PX} y2={y} stroke="#eee" strokeWidth="1" />
              <text x={PX - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#bbb">{v.toFixed(0)}</text>
            </g>;
          })}
          <line x1={PX} y1={ty} x2={W - PX} y2={ty} stroke="#9FE1CB" strokeWidth="1.5" strokeDasharray="5,4" />
          <text x={W - PX + 3} y={ty + 4} fontSize="9" fill="#1D9E75">Hedef</text>
          <path d={fillD} fill="url(#cg)" />
          <path d={pathD} fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {pts.map((p, i) => {
            const l = sortedLogs[i];
            const lbl = new Date(l.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
            return <circle key={i} cx={p[0]} cy={p[1]} r="4.5" fill="#1D9E75" stroke="white" strokeWidth="2" style={{ cursor: 'pointer' }}
              onMouseEnter={() => setTooltip({ visible: true, text: `${lbl}: ${l.weight} kg`, x: p[0] / W * 100, y: p[1] })}
              onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
              onTouchStart={() => setTooltip({ visible: true, text: `${lbl}: ${l.weight} kg`, x: p[0] / W * 100, y: p[1] })}
              onTouchEnd={() => setTimeout(() => setTooltip(t => ({ ...t, visible: false })), 2000)}
            />;
          })}
        </svg>
        {tooltip.visible && <div style={{ position: 'absolute', top: tooltip.y - 34, left: `calc(${tooltip.x}% - 55px)`, background: '#0F6E56', color: 'white', borderRadius: 8, padding: '4px 10px', fontSize: 12, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10 }}>{tooltip.text}</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#bbb', marginTop: 4 }}>
          <span>{new Date(sortedLogs[0].date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
          <span>{new Date(sortedLogs[sortedLogs.length - 1].date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
        </div>
      </div>
    );
  };

  const tabs = [['home', '🏠', 'Ana Sayfa'], ['food', '🍽️', 'Kalori'], ['sport', '🏃', 'Spor'], ['progress', '📊', 'İlerleme'], ['settings', '⚙️', 'Ayarlar']];

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
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: 18, fontWeight: 700 }}>{Math.round(pct)}%</div><div style={{ fontSize: 12, opacity: 0.85 }}>hedefe ulaşıldı</div></div>
            </div>
            <div style={S.bmiPill}>BMI: {bmi.toFixed(1)} · {bmiCat}</div>
          </div>

          <div style={S.secTitle}>Kilo grafiği</div>
          <div style={S.card}><ChartSVG /></div>

          <div style={S.secTitle}>İlerleme</div>
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 6 }}>
              <span>{st.startWeight} kg (başlangıç)</span><span>{st.targetWeight} kg (hedef)</span>
            </div>
            <div style={S.progWrap}><div style={{ ...S.progBar, width: pct + '%' }} /></div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{lost > 0 ? `${lost.toFixed(1)} kg verildi 🎉` : 'Henüz kilo kaydı yok'}</div>
          </div>

          <div style={S.statGrid}>
            <div style={S.statCard}>
              <div style={S.statLbl}>Net kalori</div>
              <div style={S.statVal}>{netKcal}</div>
              <div style={S.progWrap}><div style={{ ...S.progBar, width: Math.min(100, netKcal / st.kcalGoal * 100) + '%', background: 'linear-gradient(90deg,#EF9F27,#FAC775)' }} /></div>
              <div style={{ fontSize: 12, color: kcalRem >= 0 ? '#1D9E75' : '#D85A30', marginTop: 4 }}>{kcalRem >= 0 ? `${kcalRem} kcal kaldı` : `${Math.abs(kcalRem)} kcal fazla!`}</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statLbl}>Bugün yakılan</div>
              <div style={S.statVal}>{burnedKcal}</div>
              <div style={{ fontSize: 12, color: '#1D9E75', marginTop: 4 }}>{todaySport ? todaySport.icon + ' ' + todaySport.label : 'Spor girilmedi'}</div>
            </div>
          </div>

          <div style={S.motivCard}>
            <div style={{ fontSize: 14, lineHeight: 1.6, fontStyle: 'italic', color: '#412402' }}>"{MOTIVATIONS[mi]}"</div>
            <div style={{ fontSize: 12, color: '#633806', marginTop: 8 }}>— Günlük motivasyon</div>
          </div>

          <div style={S.card}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Bugünün kilosunu gir</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" value={dailyW} placeholder="kg" step="0.1" onChange={e => setDailyW(e.target.value)} style={{ ...S.inp, flex: 1 }} />
              <button onClick={logWeight} style={{ ...S.btnP, width: 'auto', padding: '10px 18px' }}>Kaydet</button>
            </div>
          </div>
        </div>}

        {/* FOOD */}
        {tab === 'food' && <div style={S.screen}>
          <div style={S.secTitle}>Bugünkü kalori</div>
          <div style={{ ...S.card, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px 14px' }}>
            <svg width="130" height="130" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r="54" fill="none" stroke="#f0f0f0" strokeWidth="13" />
              <circle cx="65" cy="65" r="54" fill="none" stroke={netKcal > st.kcalGoal ? '#D85A30' : '#1D9E75'} strokeWidth="13"
                strokeDasharray="339" strokeDashoffset={339 - (339 * Math.min(1, netKcal / st.kcalGoal))}
                strokeLinecap="round" transform="rotate(-90 65 65)" />
              <text x="65" y="58" textAnchor="middle" fontSize="20" fontWeight="700" fill="#222">{netKcal}</text>
              <text x="65" y="76" textAnchor="middle" fontSize="11" fill="#888">net kcal</text>
            </svg>
            <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>Hedef: {st.kcalGoal} kcal</div>
            <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 700 }}>{todayKcal}</div><div style={{ fontSize: 11, color: '#888' }}>yenilen</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 700 }}>-{burnedKcal}</div><div style={{ fontSize: 11, color: '#888' }}>spor</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 700, color: kcalRem >= 0 ? '#1D9E75' : '#D85A30' }}>{Math.abs(kcalRem)}</div><div style={{ fontSize: 11, color: '#888' }}>{kcalRem >= 0 ? 'kalan' : 'fazla!'}</div></div>
            </div>
          </div>

          <div style={S.card}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Yemek ekle (AI ile) ✨</div>
            <div style={{ marginBottom: 12 }}>
              <input type="text" value={foodInput} placeholder="örn. 2 yumurta, 1 dilim ekmek, ayran" onChange={e => setFoodInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && analyzeFood()} style={S.inp} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={analyzeFood} style={{ ...S.btnP, flex: 1, width: 'auto', opacity: aiLoad ? 0.7 : 1 }} disabled={aiLoad}>
                {aiLoad ? '⏳ Hesaplanıyor...' : 'AI ile hesapla ✨'}
              </button>
              <button onClick={addManual} style={{ ...S.btnS, width: 'auto', padding: '11px 14px' }}>Manuel</button>
            </div>
            {aiRes && <div style={{ background: '#E1F5EE', borderRadius: 12, padding: 14, marginTop: 12 }}>
              <div style={{ fontSize: 30, fontWeight: 700, color: '#0F6E56' }}>{aiRes.kcal} kcal</div>
              <div style={{ fontSize: 13, color: '#085041', marginTop: 4 }}>Protein: {aiRes.protein}g · Karb: {aiRes.karb}g · Yağ: {aiRes.yag}g</div>
              <div style={{ fontSize: 13, color: '#085041', marginTop: 6 }}>{aiRes.ozet}</div>
              <button onClick={confirmFood} style={{ ...S.btnP, marginTop: 12 }}>Ekle ✓</button>
            </div>}
          </div>

          {todayFoods.length > 0 && <div style={S.card}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Bugün yenenler</div>
            {todayFoods.map((f, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < todayFoods.length - 1 ? '0.5px solid #f0f0f0' : 'none' }}>
                <div><div style={{ fontSize: 14 }}>{f.name}</div><div style={{ fontSize: 11, color: '#bbb' }}>{f.detail}</div></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: '#1D9E75', fontWeight: 600 }}>{f.kcal} kcal</span>
                  <span onClick={() => removeFood(i)} style={{ cursor: 'pointer', color: '#ddd', fontSize: 20 }}>×</span>
                </div>
              </div>
            ))}
            <div style={{ paddingTop: 10, borderTop: '0.5px solid #f0f0f0', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#888' }}>Toplam</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1D9E75' }}>{todayKcal} kcal</span>
            </div>
          </div>}
        </div>}

        {/* SPORT */}
        {tab === 'sport' && <div style={S.screen}>
          <div style={S.secTitle}>Bugünkü spor</div>
          {todaySport && <div style={{ ...S.card, background: '#E1F5EE', border: '1px solid #9FE1CB' }}>
            <div style={{ fontSize: 13, color: '#0F6E56', marginBottom: 4 }}>Bugün kaydedildi ✓</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#085041' }}>{todaySport.icon} {todaySport.label}</div>
            {todaySport.kcal > 0 && <div style={{ fontSize: 14, color: '#0F6E56', marginTop: 4 }}>🔥 {todaySport.kcal} kcal yakıldı</div>}
          </div>}

          <div style={S.card}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Bugün ne yaptın?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SPORTS.map(sport => (
                <button key={sport.id} onClick={() => setSelectedSport(sport.id)} style={S.sportBtn(selectedSport === sport.id)}>
                  <span style={{ fontSize: 16 }}>{sport.icon}</span> {sport.label}
                  {sport.kcal > 0 && <span style={{ color: '#1D9E75', marginLeft: 6, fontSize: 11 }}>~{sport.kcal} kcal</span>}
                </button>
              ))}
            </div>
            <button onClick={logSport} style={{ ...S.btnP, marginTop: 14 }}>Kaydet</button>
          </div>

          <div style={S.secTitle}>Spor geçmişi</div>
          <div style={S.card}>
            {Object.entries(st.sportLog || {}).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14).map(([date, sport]) => (
              <div key={date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '0.5px solid #f5f5f5' }}>
                <span style={{ fontSize: 12, color: '#888' }}>{new Date(date).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                <span style={{ fontSize: 13 }}>{sport.icon} {sport.label}</span>
                {sport.kcal > 0 && <span style={{ fontSize: 12, color: '#1D9E75', fontWeight: 600 }}>🔥 {sport.kcal}</span>}
              </div>
            ))}
            {Object.keys(st.sportLog || {}).length === 0 && <div style={{ color: '#bbb', textAlign: 'center', padding: 16, fontSize: 13 }}>Henüz spor kaydı yok</div>}
          </div>
        </div>}

        {/* PROGRESS */}
        {tab === 'progress' && <div style={S.screen}>
          <div style={S.secTitle}>Kilo geçmişi</div>
          <div style={S.card}>
            {[...st.weightLog].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20).map((l, i, arr) => {
              const weights = arr.map(x => x.weight);
              const mn = Math.min(...weights), mx = Math.max(...weights), rng = mx - mn || 1;
              const p = ((l.weight - mn) / rng * 65 + 20).toFixed(0);
              const lbl = new Date(l.date).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' });
              return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < arr.length - 1 ? '0.5px solid #f5f5f5' : 'none' }}>
                <div style={{ fontSize: 12, color: '#888', width: 95, flexShrink: 0 }}>{lbl}</div>
                <div style={{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: p + '%', height: '100%', background: '#1D9E75', borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, width: 52, textAlign: 'right' }}>{l.weight} kg</div>
              </div>;
            })}
            {st.weightLog.length === 0 && <div style={{ color: '#bbb', textAlign: 'center', padding: 16, fontSize: 13 }}>Henüz kayıt yok</div>}
          </div>

          <div style={S.secTitle}>Fotoğraf karşılaştırması</div>
          <div style={S.card}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[1, 2].map(n => (
                <div key={n}>
                  <div onClick={() => document.getElementById(`ph${n}`).click()}
                    style={{ border: '1.5px dashed #ddd', borderRadius: 14, aspectRatio: '3/4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fafafa', fontSize: 12, color: '#bbb', gap: 6, position: 'relative', overflow: 'hidden' }}>
                    {st.photos && st.photos[n]
                      ? <img src={st.photos[n]} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <><span style={{ fontSize: 32 }}>📷</span><span>Fotoğraf ekle</span></>}
                  </div>
                  <div style={{ fontSize: 11, color: '#888', textAlign: 'center', marginTop: 6 }}>{n === 1 ? '📅 Başlangıç' : '📅 Güncel'}</div>
                  <input type="file" accept="image/*" id={`ph${n}`} style={{ display: 'none' }} onChange={e => handlePhoto(n, e)} />
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: '#bbb', textAlign: 'center', marginTop: 12 }}>Fotoğraflar cihazında saklanır</div>
          </div>
        </div>}

        {/* SETTINGS */}
        {tab === 'settings' && <div style={S.screen}>
          <div style={S.secTitle}>Profil & Ayarlar</div>
          <div style={S.card}>
            <div style={S.row}><label style={S.lbl}>Adın</label><input type="text" value={sf.name || ''} onChange={e => setSf(p => ({ ...p, name: e.target.value }))} style={S.inp} /></div>
            <div style={S.row}>
              <label style={S.lbl}>Cinsiyet</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={S.genderBtn(sf.gender === 'male')} onClick={() => setSf(p => ({ ...p, gender: 'male' }))}>👨 Erkek</button>
                <button style={S.genderBtn(sf.gender === 'female')} onClick={() => setSf(p => ({ ...p, gender: 'female' }))}>👩 Kadın</button>
              </div>
            </div>
            <div style={S.row}><label style={S.lbl}>Yaş</label><input type="number" value={sf.age || ''} onChange={e => setSf(p => ({ ...p, age: e.target.value }))} style={S.inp} /></div>
            <div style={S.row}><label style={S.lbl}>Boy (cm)</label><input type="number" value={sf.height || ''} onChange={e => setSf(p => ({ ...p, height: e.target.value }))} style={S.inp} /></div>
            <div style={S.row}><label style={S.lbl}>Hedef kilo (kg)</label><input type="number" value={sf.target || ''} onChange={e => setSf(p => ({ ...p, target: e.target.value }))} style={S.inp} /></div>
            <div style={S.row}><label style={S.lbl}>Hedef tarih</label><input type="date" value={sf.date || ''} onChange={e => setSf(p => ({ ...p, date: e.target.value }))} style={S.inp} /></div>
            <div style={S.row}><label style={S.lbl}>Günlük kalori hedefi</label><input type="number" value={sf.kcal || ''} onChange={e => setSf(p => ({ ...p, kcal: e.target.value }))} style={S.inp} /></div>
            <button onClick={saveSettings} style={S.btnP}>Kaydet</button>
          </div>
          <div style={S.card}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Hesaplanan değerler</div>
            <div style={{ fontSize: 13, color: '#666', lineHeight: 2 }}>
              BMI: {bmi.toFixed(1)} ({bmiCat})<br />
              Günlük yakım (TDEE): ~{tdee} kcal<br />
              Kalori açığın: ~{tdee - st.kcalGoal} kcal/gün<br />
              Teorik haftalık kayıp: ~{((tdee - st.kcalGoal) * 7 / 7700).toFixed(2)} kg/hafta
            </div>
          </div>
          <button onClick={() => { if (confirm('Tüm veriler silinecek?')) { localStorage.removeItem('fittrack_v4'); window.location.reload(); } }} style={{ ...S.btnS, marginBottom: 20 }}>Sıfırla / Yeniden başla</button>
        </div>}

        {/* TAB BAR */}
        <div style={S.tabBar}>
          {tabs.map(([id, icon, lbl]) => (
            <button key={id} onClick={() => setTab(id)} style={{ ...S.tabBtn, color: tab === id ? '#1D9E75' : '#aaa' }}>
              <span style={{ fontSize: 18 }}>{icon}</span><span>{lbl}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
