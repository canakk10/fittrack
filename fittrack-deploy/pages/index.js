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

const ACTIVITY_LEVELS = [
  { id: 'sedanter',   label: 'Hareketsiz',        sub: 'Masa başı, spor yok',          factor: 1.2   },
  { id: 'hafif',      label: 'Az aktif',           sub: 'Haftada 1–2 gün spor',         factor: 1.375 },
  { id: 'orta',       label: 'Orta aktif',         sub: 'Haftada 3–4 gün spor',         factor: 1.55  },
  { id: 'aktif',      label: 'Çok aktif',          sub: 'Haftada 5+ gün spor',          factor: 1.725 },
];

const EXERCISES = [
  { id: 'yuruyus', label: 'Yürüyüş', kcalPerUnit: 4 },
  { id: 'kos', label: 'Koşu', kcalPerUnit: 9 },
  { id: 'bisiklet', label: 'Bisiklet', kcalPerUnit: 7 },
  { id: 'yuzme', label: 'Yüzme', kcalPerUnit: 8 },
  { id: 'fitness', label: 'Fitness', kcalPerUnit: 6 },
  { id: 'dans', label: 'Dans', kcalPerUnit: 5 },
  { id: 'diger', label: 'Diğer', kcalPerUnit: 5 },
];

const todayStr = () => new Date().toISOString().split('T')[0];
const getLS = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const setLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const fmtDate = (str) => new Date(str).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });

// ── IndexedDB for photos (no size limit issues) ──────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('fittrack_photos', 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore('photos', { keyPath: 'id', autoIncrement: true });
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}
async function dbGetAll() {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction('photos', 'readonly').objectStore('photos').getAll();
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}
async function dbAdd(photo) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction('photos', 'readwrite').objectStore('photos').add(photo);
    req.onsuccess = () => res(req.result); // returns generated id
    req.onerror = () => rej(req.error);
  });
}
async function dbDelete(id) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction('photos', 'readwrite').objectStore('photos').delete(id);
    req.onsuccess = () => res();
    req.onerror = () => rej(req.error);
  });
}
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [st, setSt]         = useState(null);
  const [tab, setTab]       = useState('home');
  const [ready, setReady]   = useState(false);
  const [photos, setPhotos] = useState([]);
  const [form, setForm]     = useState({ name: '', weight: '94', height: '183', target: '77', date: '', gender: 'erkek', age: '30', activity: 'hafif' });
  const calcKcal = (f) => {
    const w = parseFloat(f.weight)||94, h = parseFloat(f.height)||183, a = parseInt(f.age)||30;
    const bmr = f.gender === 'kadin' ? 10*w + 6.25*h - 5*a - 161 : 10*w + 6.25*h - 5*a + 5;
    const factor = ACTIVITY_LEVELS.find(x => x.id === f.activity)?.factor || 1.375;
    return Math.round(bmr * factor - 500); // 500 kcal deficit for ~0.5kg/week loss
  };
  const [foodInput, setFoodInput] = useState('');
  const [aiRes, setAiRes]   = useState(null);
  const [aiLoad, setAiLoad] = useState(false);
  const [dailyW, setDailyW] = useState('');
  const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });
  const [exForm, setExForm] = useState({ type: 'yuruyus', duration: '' });

  useEffect(() => {
    const saved = getLS('fittrack_v4', null);
    setSt(saved);
    const d = new Date(); d.setMonth(5); d.setDate(21);
    setForm(f => ({ ...f, date: d.toISOString().split('T')[0] }));
    dbGetAll().then(setPhotos).catch(() => setPhotos([]));
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    setReady(true);
  }, []);

  const save = (newSt) => { setSt(newSt); setLS('fittrack_v4', newSt); };

  const doSetup = () => {
    const w = parseFloat(form.weight), h = parseFloat(form.height), t = parseFloat(form.target);
    if (!w || !h || !t || !form.date) { alert('Lütfen tüm alanları doldur!'); return; }
    const kcalGoal = calcKcal(form);
    save({ setupDone: true, name: form.name || 'Dostum', startWeight: w, currentWeight: w, height: h, targetWeight: t, targetDate: form.date, kcalGoal, gender: form.gender || 'erkek', age: parseInt(form.age) || 30, activity: form.activity || 'hafif', weightLog: [{ date: todayStr(), weight: w }], foodLog: {}, exerciseLog: {} });
    setTab('home');
  };

  const logWeight = () => {
    const val = parseFloat(dailyW);
    if (!val || val < 30 || val > 300) { alert('Geçerli kilo gir'); return; }
    const newSt = { ...st, currentWeight: val, weightLog: [...st.weightLog] };
    const idx = newSt.weightLog.findIndex(w => w.date === todayStr());
    if (idx >= 0) newSt.weightLog[idx] = { date: todayStr(), weight: val };
    else newSt.weightLog.push({ date: todayStr(), weight: val });
    save(newSt); setDailyW('');
  };

  const addExercise = () => {
    const dur = parseInt(exForm.duration);
    if (!dur || dur < 1) { alert('Süre gir'); return; }
    const ex = EXERCISES.find(e => e.id === exForm.type);
    const burned = dur * ex.kcalPerUnit;
    const newLog = { ...st.exerciseLog };
    if (!newLog[todayStr()]) newLog[todayStr()] = [];
    newLog[todayStr()] = [...newLog[todayStr()], { type: ex.label, duration: dur, burned }];
    save({ ...st, exerciseLog: newLog });
    setExForm(f => ({ ...f, duration: '' }));
  };

  const removeExercise = (i) => {
    const newLog = { ...st.exerciseLog };
    newLog[todayStr()] = newLog[todayStr()].filter((_, idx) => idx !== i);
    save({ ...st, exerciseLog: newLog });
  };

  const analyzeFood = async () => {
    if (!foodInput.trim()) { alert('Ne yediğini yaz!'); return; }
    setAiLoad(true); setAiRes(null);
    try {
      const r = await fetch('/api/analyze-food', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ food: foodInput }) });
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      setAiRes(data);
    } catch (e) { alert('AI hesaplanamadı: ' + e.message); }
    setAiLoad(false);
  };

  const confirmFood = () => {
    if (!aiRes) return;
    const fl = { ...st.foodLog };
    if (!fl[todayStr()]) fl[todayStr()] = [];
    fl[todayStr()] = [...fl[todayStr()], { name: foodInput, kcal: aiRes.kcal, detail: `${aiRes.protein}g protein · ${aiRes.karb}g karb · ${aiRes.yag}g yağ` }];
    save({ ...st, foodLog: fl }); setFoodInput(''); setAiRes(null);
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

  // Photos — saved to IndexedDB, NOT localStorage
  const handlePhoto = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const photo = { src: ev.target.result, date: todayStr(), label: fmtDate(todayStr()) };
      const id = await dbAdd(photo);
      setPhotos(prev => [...prev, { ...photo, id }]);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // reset so same file can be added again
  };

  const removePhoto = async (id) => {
    await dbDelete(id);
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const saveSettings = (sf) => {
    save({ ...st, name: sf.name || st.name, height: parseFloat(sf.height) || st.height, targetWeight: parseFloat(sf.target) || st.targetWeight, targetDate: sf.date || st.targetDate, kcalGoal: parseInt(sf.kcal) || st.kcalGoal, age: parseInt(sf.age) || st.age, gender: sf.gender || st.gender, activity: sf.activity || st.activity });
    alert('Kaydedildi ✓');
  };

  if (!ready) return null;

  if (!st || !st.setupDone) return (
    <div style={S.page}>
      <Head><title>FitTrack — Kurulum</title><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1" /></Head>
      <div style={{ padding: '20px 16px', maxWidth: 390, margin: '0 auto' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>💪</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Merhaba!</h1>
        <p style={{ fontSize: 14, color: '#555', marginBottom: 24, lineHeight: 1.5 }}>Sana özel takip panelini kurmak için birkaç bilgiye ihtiyacım var.</p>
        {[['Adın', 'name', 'text', 'Adını gir'], ['Mevcut kilo (kg)', 'weight', 'number', '94'], ['Boy (cm)', 'height', 'number', '183'], ['Yaş', 'age', 'number', '30'], ['Hedef kilo (kg)', 'target', 'number', '77'], ['Hedef tarih', 'date', 'date', '']].map(([lbl, k, type, ph]) => (
          <div key={k} style={{ marginBottom: 12 }}>
            <label style={S.lbl}>{lbl}</label>
            <input type={type} value={form[k]} placeholder={ph} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} style={S.inp} />
          </div>
        ))}
        <div style={{ marginBottom: 12 }}>
          <label style={S.lbl}>Cinsiyet</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {[['erkek', '👨 Erkek'], ['kadin', '👩 Kadın']].map(([val, lbl]) => (
              <button key={val} onClick={() => setForm(p => ({ ...p, gender: val }))}
                style={{ flex: 1, padding: 10, borderRadius: 10, border: `2px solid ${form.gender === val ? '#1D9E75' : '#ddd'}`, background: form.gender === val ? '#E1F5EE' : '#fafafa', color: form.gender === val ? '#085041' : '#444', fontWeight: form.gender === val ? 600 : 400, cursor: 'pointer', fontSize: 14 }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={S.lbl}>Aktivite seviyesi</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ACTIVITY_LEVELS.map(al => (
              <button key={al.id} onClick={() => setForm(p => ({ ...p, activity: al.id }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `2px solid ${form.activity === al.id ? '#1D9E75' : '#ddd'}`, background: form.activity === al.id ? '#E1F5EE' : '#fafafa', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: form.activity === al.id ? 600 : 400, color: form.activity === al.id ? '#085041' : '#222' }}>{al.label}</div>
                  <div style={{ fontSize: 12, color: form.activity === al.id ? '#0F6E56' : '#666', marginTop: 2 }}>{al.sub}</div>
                </div>
                {form.activity === al.id && <span style={{ color: '#1D9E75', fontSize: 18 }}>✓</span>}
              </button>
            ))}
          </div>
        </div>
        <div style={{ background: '#E1F5EE', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#0F6E56', marginBottom: 2 }}>Hesaplanan günlük kalori hedefin</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#085041' }}>{calcKcal(form)} kcal</div>
          <div style={{ fontSize: 11, color: '#0F6E56', marginTop: 2 }}>500 kcal açık · ~0.5 kg/hafta kayıp</div>
        </div>
        <button onClick={doSetup} style={{ ...S.btnP, marginTop: 8 }}>Başla 🚀</button>
      </div>
    </div>
  );

  const todayFoods     = st.foodLog[todayStr()] || [];
  const todayExercises = (st.exerciseLog || {})[todayStr()] || [];
  const todayKcal      = todayFoods.reduce((s, f) => s + f.kcal, 0);
  const todayBurned    = todayExercises.reduce((s, e) => s + e.burned, 0);
  const netKcal        = todayKcal - todayBurned;
  const kcalRem        = st.kcalGoal - netKcal;
  const days           = Math.max(0, Math.ceil((new Date(st.targetDate) - new Date()) / 86400000));
  const totalLose      = st.startWeight - st.targetWeight;
  const lost           = st.startWeight - st.currentWeight;
  const pct            = totalLose > 0 ? Math.min(100, Math.max(0, lost / totalLose * 100)) : 0;
  const bmi            = st.currentWeight / ((st.height / 100) ** 2);
  const bmiCat         = bmi < 18.5 ? 'Zayıf' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Fazla kilolu' : 'Obez';
  const age            = st.age || 30;
  const bmr            = st.gender === 'kadin' ? 10 * st.currentWeight + 6.25 * st.height - 5 * age - 161 : 10 * st.currentWeight + 6.25 * st.height - 5 * age + 5;
  const tdee           = Math.round(bmr * 1.375);
  const mi             = (new Date().getDay() + new Date().getDate()) % MOTIVATIONS.length;
  const hr             = new Date().getHours();
  const greet          = hr < 12 ? 'Günaydın' : hr < 18 ? 'İyi günler' : 'İyi akşamlar';
  const sortedLogs     = [...st.weightLog].sort((a, b) => a.date.localeCompare(b.date));

  const ChartSVG = () => {
    if (sortedLogs.length < 2) return <div style={{ textAlign: 'center', padding: '32px 0', color: '#666', fontSize: 13 }}>En az 2 gün kilo gir, grafik oluşsun 📈</div>;
    const W = 340, H = 160, PX = 28, PY = 14, iW = W - PX * 2, iH = H - PY * 2;
    const weights = sortedLogs.map(l => l.weight);
    const minW = Math.min(...weights, st.targetWeight) - 0.5;
    const maxW = Math.max(...weights) + 0.5;
    const xS = i => PX + (i / (sortedLogs.length - 1)) * iW;
    const yS = w => PY + iH - ((w - minW) / (maxW - minW)) * iH;
    const pts = sortedLogs.map((l, i) => [xS(i), yS(l.weight)]);
    const pathD = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
    const fillD = `M${xS(0).toFixed(1)},${(PY+iH).toFixed(1)} ` + pts.map(p => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + ` L${xS(sortedLogs.length-1).toFixed(1)},${(PY+iH).toFixed(1)} Z`;
    const ty = yS(st.targetWeight);
    return (
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, overflow: 'visible' }}>
          <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1D9E75" stopOpacity="0.2"/><stop offset="100%" stopColor="#1D9E75" stopOpacity="0"/></linearGradient></defs>
          {[minW, (minW+maxW)/2, maxW].map(v => { const y = yS(v); return <g key={v}><line x1={PX} y1={y} x2={W-PX} y2={y} stroke="#eee" strokeWidth="0.5" strokeDasharray="3,3"/><text x={PX-4} y={y+4} textAnchor="end" fontSize="9" fill="#999">{v.toFixed(0)}</text></g>; })}
          <line x1={PX} y1={ty} x2={W-PX} y2={ty} stroke="#9FE1CB" strokeWidth="1.5" strokeDasharray="5,4"/>
          <text x={W-PX+3} y={ty+4} fontSize="9" fill="#1D9E75">Hedef</text>
          <path d={fillD} fill="url(#g1)"/>
          <path d={pathD} fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          {pts.map((p, i) => {
            const l = sortedLogs[i];
            const lbl = new Date(l.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
            return <circle key={i} cx={p[0]} cy={p[1]} r="4.5" fill="#1D9E75" stroke="white" strokeWidth="2" style={{ cursor: 'pointer' }}
              onMouseEnter={() => setTooltip({ visible: true, text: `${lbl}: ${l.weight} kg`, x: p[0]/W*100, y: p[1] })}
              onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
              onTouchStart={() => setTooltip({ visible: true, text: `${lbl}: ${l.weight} kg`, x: p[0]/W*100, y: p[1] })}
              onTouchEnd={() => setTimeout(() => setTooltip(t => ({ ...t, visible: false })), 1500)} />;
          })}
        </svg>
        {tooltip.visible && <div style={{ position: 'absolute', top: tooltip.y-32, left: `calc(${tooltip.x}% - 60px)`, background: '#0F6E56', color: 'white', borderRadius: 8, padding: '4px 10px', fontSize: 12, pointerEvents: 'none', whiteSpace: 'nowrap' }}>{tooltip.text}</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#bbb', marginTop: 4 }}>
          <span>{new Date(sortedLogs[0].date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
          <span>{new Date(sortedLogs[sortedLogs.length-1].date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
        </div>
      </div>
    );
  };

  return (
    <div style={S.page}>
      <Head><title>FitTrack 💪</title><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/><meta name="theme-color" content="#1D9E75"/></Head>
      <div style={S.app}>

        {/* ── HOME ── */}
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
          <div style={S.card}><ChartSVG /></div>

          <div style={S.secTitle}>İlerleme</div>
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555', marginBottom: 6 }}><span>{st.startWeight} kg (başlangıç)</span><span>{st.targetWeight} kg (hedef)</span></div>
            <div style={S.progWrap}><div style={{ ...S.progBar, width: pct + '%' }} /></div>
            <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{lost > 0 ? `${lost.toFixed(1)} kg verildi 🎉` : 'Henüz kilo kaydı yok'}</div>
          </div>

          <div style={S.statGrid}>
            <div style={S.statCard}>
              <div style={S.statLbl}>Net kalori</div>
              <div style={S.statVal}>{netKcal} <span style={{ fontSize: 12 }}>kcal</span></div>
              <div style={S.progWrap}><div style={{ ...S.progBar, width: Math.min(100, netKcal / st.kcalGoal * 100) + '%', background: 'linear-gradient(90deg,#EF9F27,#FAC775)' }} /></div>
              <div style={{ fontSize: 12, color: kcalRem >= 0 ? '#1D9E75' : '#D85A30', marginTop: 4 }}>{kcalRem >= 0 ? `${kcalRem} kcal kaldı` : `${Math.abs(kcalRem)} kcal fazla!`}</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statLbl}>Bugün yakılan</div>
              <div style={S.statVal}>{todayBurned} <span style={{ fontSize: 12 }}>kcal</span></div>
              <div style={{ fontSize: 12, color: '#1D9E75', marginTop: 4 }}>{todayExercises.length > 0 ? `${todayExercises.length} egzersiz` : 'Egzersiz yok'}</div>
            </div>
          </div>

          <div style={S.motivCard}><div style={{ fontSize: 14, lineHeight: 1.6, fontStyle: 'italic', color: '#412402' }}>"{MOTIVATIONS[mi]}"</div><div style={{ fontSize: 12, color: '#633806', marginTop: 8 }}>— Günlük motivasyon</div></div>

          <div style={S.card}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 10 }}>Bugünün kilosunu gir</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" value={dailyW} placeholder="kg" step="0.1" onChange={e => setDailyW(e.target.value)} style={{ ...S.inp, flex: 1 }} />
              <button onClick={logWeight} style={{ ...S.btnP, width: 'auto', padding: '10px 18px' }}>Kaydet</button>
            </div>
          </div>
        </div>}

        {/* ── KALORI & SPOR ── */}
        {tab === 'food' && <div style={S.screen}>
          <div style={S.secTitle}>Bugünkü kalori</div>
          <div style={{ ...S.card, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px 14px' }}>
            <svg width="130" height="130" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r="54" fill="none" stroke="#f0f0f0" strokeWidth="13"/>
              <circle cx="65" cy="65" r="54" fill="none" stroke={netKcal > st.kcalGoal ? '#D85A30' : '#1D9E75'} strokeWidth="13"
                strokeDasharray="339" strokeDashoffset={339 - (339 * Math.min(1, netKcal / st.kcalGoal))}
                strokeLinecap="round" transform="rotate(-90 65 65)"/>
              <text x="65" y="58" textAnchor="middle" fontSize="20" fontWeight="600" fill="#222">{netKcal}</text>
              <text x="65" y="75" textAnchor="middle" fontSize="11" fill="#555">net kcal</text>
            </svg>
            <div style={{ fontSize: 13, color: '#555', marginTop: 8 }}>Hedef: {st.kcalGoal} kcal</div>
            <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 16, fontWeight: 600 }}>{todayKcal}</div><div style={{ fontSize: 11, color: '#555' }}>yenilen</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 16, fontWeight: 600, color: '#1D9E75' }}>-{todayBurned}</div><div style={{ fontSize: 11, color: '#555' }}>yakılan</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 16, fontWeight: 600 }}>{Math.max(0, kcalRem)}</div><div style={{ fontSize: 11, color: '#555' }}>kalan</div></div>
            </div>
          </div>

          <div style={S.secTitle}>Egzersiz ekle 🏃</div>
          <div style={S.card}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <select value={exForm.type} onChange={e => setExForm(f => ({ ...f, type: e.target.value }))} style={{ ...S.inp, flex: 1 }}>
                {EXERCISES.map(ex => <option key={ex.id} value={ex.id}>{ex.label}</option>)}
              </select>
              <input type="number" value={exForm.duration} placeholder="dk" onChange={e => setExForm(f => ({ ...f, duration: e.target.value }))} style={{ ...S.inp, width: 70 }} />
            </div>
            <button onClick={addExercise} style={S.btnP}>Egzersiz ekle 🔥</button>
            {todayExercises.length > 0 && <div style={{ marginTop: 12 }}>
              {todayExercises.map((ex, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < todayExercises.length - 1 ? '0.5px solid #f0f0f0' : 'none' }}>
                  <div><div style={{ fontSize: 14 }}>{ex.type}</div><div style={{ fontSize: 11, color: '#555' }}>{ex.duration} dakika</div></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: '#1D9E75', fontWeight: 500 }}>-{ex.burned} kcal</span>
                    <span onClick={() => removeExercise(i)} style={{ cursor: 'pointer', color: '#999', fontSize: 18 }}>×</span>
                  </div>
                </div>
              ))}
              <div style={{ paddingTop: 8, borderTop: '0.5px solid #f0f0f0', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#555' }}>Toplam yakılan</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1D9E75' }}>{todayBurned} kcal</span>
              </div>
            </div>}
          </div>

          <div style={S.secTitle}>Yemek ekle 🍽️</div>
          <div style={S.card}>
            <div style={{ marginBottom: 10 }}><input type="text" value={foodInput} placeholder="örn. 2 yumurta, 1 dilim ekmek, ayran" onChange={e => setFoodInput(e.target.value)} style={S.inp} /></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={analyzeFood} disabled={aiLoad} style={{ ...S.btnP, flex: 1, width: 'auto', opacity: aiLoad ? 0.7 : 1 }}>{aiLoad ? 'Hesaplanıyor...' : 'AI ile hesapla ✨'}</button>
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
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < todayFoods.length - 1 ? '0.5px solid #f0f0f0' : 'none' }}>
                <div><div style={{ fontSize: 14 }}>{f.name}</div><div style={{ fontSize: 11, color: '#555' }}>{f.detail}</div></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: '#1D9E75', fontWeight: 500 }}>{f.kcal} kcal</span>
                  <span onClick={() => removeFood(i)} style={{ cursor: 'pointer', color: '#999', fontSize: 18 }}>×</span>
                </div>
              </div>
            ))}
            <div style={{ paddingTop: 10, borderTop: '0.5px solid #f0f0f0', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#555' }}>Toplam</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#1D9E75' }}>{todayKcal} kcal</span>
            </div>
          </div>}
        </div>}

        {/* ── İLERLEME ── */}
        {tab === 'progress' && <div style={S.screen}>
          <div style={S.secTitle}>Kilo geçmişi</div>
          <div style={S.card}>
            {[...st.weightLog].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20).map((l, i, arr) => {
              const mn = Math.min(...arr.map(x => x.weight)), mx = Math.max(...arr.map(x => x.weight)), rng = mx - mn || 1;
              const p = ((l.weight - mn) / rng * 65 + 20).toFixed(0);
              const lbl = new Date(l.date).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' });
              return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < arr.length - 1 ? '0.5px solid #f0f0f0' : 'none' }}>
                <div style={{ fontSize: 12, color: '#555', width: 90, flexShrink: 0 }}>{lbl}</div>
                <div style={{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}><div style={{ width: p + '%', height: '100%', background: '#1D9E75', borderRadius: 4 }} /></div>
                <div style={{ fontSize: 13, fontWeight: 500, width: 50, textAlign: 'right' }}>{l.weight} kg</div>
              </div>;
            })}
            {st.weightLog.length === 0 && <div style={{ color: '#999', textAlign: 'center', padding: 16, fontSize: 13 }}>Henüz kayıt yok</div>}
          </div>

          <div style={S.secTitle}>Fotoğraf galerisi 📸</div>
          <div style={S.card}>
            <label style={{ ...S.btnP, display: 'block', textAlign: 'center', cursor: 'pointer', marginBottom: 8 }}>
              📷 Fotoğraf ekle
              <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
            </label>
            <div style={{ fontSize: 12, color: '#555', textAlign: 'center', marginBottom: 12 }}>
              Her fotoğrafa tarih otomatik eklenir · Telefonu değiştirsen bile kalır ✓
            </div>
            {photos.length === 0 && <div style={{ color: '#999', textAlign: 'center', padding: 16, fontSize: 13 }}>Henüz fotoğraf yok</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {photos.map(ph => (
                <div key={ph.id} style={{ position: 'relative' }}>
                  <img src={ph.src} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: 12 }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.65))', borderRadius: '0 0 12px 12px', padding: '20px 8px 8px', color: 'white', fontSize: 11 }}>{ph.label}</div>
                  <div onClick={() => removePhoto(ph.id)} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14 }}>×</div>
                </div>
              ))}
            </div>
          </div>
        </div>}

        {/* ── AYARLAR ── */}
        {tab === 'settings' && <SettingsTab st={st} tdee={tdee} bmi={bmi} onSave={saveSettings}
          onReset={() => { if (confirm('Tüm veriler silinecek?')) { localStorage.removeItem('fittrack_v4'); window.location.reload(); } }} />}

        {/* ── TAB BAR ── */}
        <div style={S.tabBar}>
          {[['home', '🏠', 'Ana Sayfa'], ['food', '🏃', 'Kalori & Spor'], ['progress', '📊', 'İlerleme'], ['settings', '⚙️', 'Ayarlar']].map(([id, icon, lbl]) => (
            <button key={id} onClick={() => setTab(id)} style={{ ...S.tabBtn, color: tab === id ? '#1D9E75' : '#555' }}>
              <span style={{ fontSize: 20 }}>{icon}</span><span style={{ fontSize: 10 }}>{lbl}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ st, tdee, bmi, onSave, onReset }) {
  const calcKcalSt = (sf) => {
    const w = parseFloat(st.currentWeight)||94, h = parseFloat(sf.height)||st.height, a = parseInt(sf.age)||30;
    const bmr = sf.gender === 'kadin' ? 10*w + 6.25*h - 5*a - 161 : 10*w + 6.25*h - 5*a + 5;
    const factor = ACTIVITY_LEVELS.find(x => x.id === sf.activity)?.factor || 1.375;
    return Math.round(bmr * factor - 500);
  };
  const [sf, setSf] = useState({ name: st.name, height: st.height, target: st.targetWeight, date: st.targetDate, kcal: st.kcalGoal, age: st.age || 30, gender: st.gender || 'erkek', activity: st.activity || 'hafif' });
  return (
    <div style={S.screen}>
      <div style={S.secTitle}>Profil & Ayarlar</div>
      <div style={S.card}>
        {[['Adın', 'name', 'text'], ['Boy (cm)', 'height', 'number'], ['Yaş', 'age', 'number'], ['Hedef kilo (kg)', 'target', 'number'], ['Hedef tarih', 'date', 'date']].map(([lbl, k, type]) => (
          <div key={k} style={{ marginBottom: 12 }}>
            <label style={S.lbl}>{lbl}</label>
            <input type={type} value={sf[k]} onChange={e => setSf(p => ({ ...p, [k]: e.target.value }))} style={S.inp} />
          </div>
        ))}
        <div style={{ marginBottom: 12 }}>
          <label style={S.lbl}>Cinsiyet</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {[['erkek', '👨 Erkek'], ['kadin', '👩 Kadın']].map(([val, lbl]) => (
              <button key={val} onClick={() => setSf(p => ({ ...p, gender: val }))}
                style={{ flex: 1, padding: 10, borderRadius: 10, border: `2px solid ${sf.gender === val ? '#1D9E75' : '#ddd'}`, background: sf.gender === val ? '#E1F5EE' : '#fafafa', color: sf.gender === val ? '#085041' : '#444', fontWeight: sf.gender === val ? 600 : 400, cursor: 'pointer', fontSize: 14 }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={S.lbl}>Aktivite seviyesi</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ACTIVITY_LEVELS.map(al => (
              <button key={al.id} onClick={() => setSf(p => ({ ...p, activity: al.id }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `2px solid ${sf.activity === al.id ? '#1D9E75' : '#ddd'}`, background: sf.activity === al.id ? '#E1F5EE' : '#fafafa', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: sf.activity === al.id ? 600 : 400, color: sf.activity === al.id ? '#085041' : '#222' }}>{al.label}</div>
                  <div style={{ fontSize: 12, color: sf.activity === al.id ? '#0F6E56' : '#666', marginTop: 2 }}>{al.sub}</div>
                </div>
                {sf.activity === al.id && <span style={{ color: '#1D9E75', fontSize: 18 }}>✓</span>}
              </button>
            ))}
          </div>
        </div>
        <div style={{ background: '#E1F5EE', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#0F6E56', marginBottom: 2 }}>Hesaplanan günlük kalori hedefin</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#085041' }}>{calcKcalSt(sf)} kcal</div>
          <div style={{ fontSize: 11, color: '#0F6E56', marginTop: 2 }}>500 kcal açık · ~0.5 kg/hafta kayıp</div>
        </div>
        <button onClick={() => onSave({ ...sf, kcal: calcKcalSt(sf) })} style={S.btnP}>Kaydet</button>
      </div>
      <div style={S.card}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 10 }}>Hesaplanan değerler</div>
        <div style={{ fontSize: 13, color: '#555', lineHeight: 2 }}>
          BMI: {bmi.toFixed(1)}<br />
          Günlük yakım (TDEE): ~{tdee} kcal<br />
          Kalori açığın: ~{tdee - st.kcalGoal} kcal/gün<br />
          Teorik haftalık kayıp: ~{((tdee - st.kcalGoal) * 7 / 7700).toFixed(2)} kg/hafta
        </div>
      </div>
      <button onClick={onReset} style={{ ...S.btnS, marginBottom: 20 }}>Sıfırla / Yeniden başla</button>
    </div>
  );
}

const S = {
  page:     { minHeight: '100vh', background: '#f0f2f0' },
  app:      { maxWidth: 390, margin: '0 auto', paddingBottom: 80 },
  screen:   { padding: '0 16px' },
  hero:     { background: 'linear-gradient(135deg,#1D9E75,#0F6E56)', borderRadius: 20, padding: 20, margin: '14px 0 16px', color: 'white' },
  countBox: { marginTop: 14, background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  bmiPill:  { display: 'inline-block', background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 12px', fontSize: 12, marginTop: 10 },
  secTitle: { fontSize: 12, fontWeight: 500, color: '#555', margin: '18px 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  card:     { background: 'white', border: '1px solid #d0d0d0', borderRadius: 16, padding: 16, marginBottom: 12 },
  statGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 },
  statCard: { background: 'white', border: '1px solid #d0d0d0', borderRadius: 14, padding: 14 },
  statLbl:  { fontSize: 12, color: '#555', marginBottom: 4 },
  statVal:  { fontSize: 22, fontWeight: 600 },
  progWrap: { background: '#d8d8d8', borderRadius: 8, height: 8, overflow: 'hidden', margin: '6px 0 2px' },
  progBar:  { height: '100%', borderRadius: 8, background: 'linear-gradient(90deg,#1D9E75,#9FE1CB)', transition: 'width 0.4s' },
  motivCard:{ background: 'linear-gradient(135deg,#FAC775,#EF9F27)', borderRadius: 16, padding: 16, marginBottom: 12 },
  tabBar:   { display: 'flex', background: 'white', borderTop: '1px solid #ccc', position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 390, zIndex: 100 },
  tabBtn:   { flex: 1, padding: '10px 4px 8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 },
  inp:      { width: '100%', border: '1px solid #bbb', borderRadius: 10, padding: '10px 12px', fontSize: 15, background: '#fafafa', fontFamily: 'inherit', outline: 'none' },
  lbl:      { display: 'block', fontSize: 13, color: '#444', marginBottom: 5 },
  btnP:     { width: '100%', padding: 13, background: '#1D9E75', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnS:     { width: '100%', padding: 11, background: 'transparent', color: '#1D9E75', border: '1px solid #1D9E75', borderRadius: 12, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
};
