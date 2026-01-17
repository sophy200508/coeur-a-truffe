import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'cohab_state_v1';
// state = { favorites:{[id]:true}, sessions:[{id,ts,ruleId,category,level,durationMin,incidents,calmMin,compliance(0..100),notes,rating}], reminder?:{plan} }

export async function getState() {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : { favorites:{}, sessions:[] };
}
async function saveState(st){ await AsyncStorage.setItem(KEY, JSON.stringify(st)); }

export async function toggleFavorite(id){
  const st = await getState();
  st.favorites[id] = !st.favorites[id];
  await saveState(st);
  return st.favorites;
}

export async function addSession(payload){
  const st = await getState();
  const item = { id: genId(), ts: Date.now(), ...payload };
  st.sessions.unshift(item);
  await saveState(st);
}

export async function removeSession(id){
  const st = await getState();
  st.sessions = st.sessions.filter(s => s.id !== id);
  await saveState(st);
}

export async function stats7d(){
  const st = await getState();
  const since = Date.now() - 7*86400000;
  const last = (st.sessions||[]).filter(s => s.ts >= since);
  const minutes7 = last.reduce((a,b)=>a+(b.durationMin||0),0);
  const calmMin7 = last.reduce((a,b)=>a+(b.calmMin||0),0);
  const incidents7 = last.reduce((a,b)=>a+(b.incidents||0),0);
  const avgCompliance = last.length ? Math.round(last.reduce((a,b)=>a+(Number(b.compliance)||0),0)/last.length) : 0;
  return {
    count7: last.length,
    minutes7,
    calmMin7,
    incidents7,
    compliance7: avgCompliance,
  };
}

// rappel plan
export async function saveReminder(reminder){
  const st = await getState();
  st.reminder = reminder; // {plan}
  await saveState(st);
  return reminder;
}

export function series14d(sessions, mode='incidents'){
  // buckets 14 jours glissants
  const start = new Date(); start.setHours(0,0,0,0);
  start.setDate(start.getDate() - 13);
  const buckets = [];
  for (let i=0;i<14;i++){
    const d = new Date(start); d.setDate(start.getDate()+i);
    buckets.push({
      key: new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString(),
      dateLabel: `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`,
      incidents:0, calmMin:0, minutes:0, complianceSum:0, count:0
    });
  }
  (sessions||[]).forEach(s => {
    const d = new Date(s.ts);
    const k = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString();
    const b = buckets.find(x => x.key === k);
    if (!b) return;
    b.incidents += (Number(s.incidents)||0);
    b.calmMin  += (Number(s.calmMin)||0);
    b.minutes  += (Number(s.durationMin)||0);
    b.complianceSum += (Number(s.compliance)||0);
    b.count += 1;
  });
  const series = buckets.map(b => {
    const compliance = b.count ? Math.round(b.complianceSum / b.count) : 0;
    const value =
      mode === 'incidents' ? b.incidents :
      mode === 'calm'      ? b.calmMin  :
      mode === 'minutes'   ? b.minutes  : compliance; // 'compliance'
    return { dateLabel:b.dateLabel, value, detail:{ key:b.key, dateLabel:b.dateLabel, incidents:b.incidents, calmMin:b.calmMin, minutes:b.minutes, compliance } };
  });
  const max = mode === 'compliance' ? 100 : niceCeil(Math.max(1, ...series.map(s=>s.value)));
  return { series, max };
}

function niceCeil(n){
  if (n<=10) return 10;
  if (n<=20) return 20;
  if (n<=30) return 30;
  if (n<=50) return 50;
  const p = Math.pow(10, Math.floor(Math.log10(n)));
  return Math.ceil(n/p)*p;
}

const genId = () => String(Math.random()).slice(2) + String(Date.now());
