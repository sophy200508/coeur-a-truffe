import React, { useEffect, useMemo, useState } from 'react';
import ScreenBackground from '../../components/ScreenBackground';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView,
  Modal, Linking, Share, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import ScreenContainer from '../../components/ScreenContainer';
import RemindersPlanModal from '../../components/RemindersPlanModal';
import { schedulePlan, clearReminder } from './utils/more-notifications';

const STORAGE_KEY = 'more_v1';

const COLORS = {
  primary: '#7d4ac5',
  secondary: '#a077e6',
  ink: '#4a235a',
  sub: '#6b3fa3',
  chip: '#F1E8FF',
  card: '#fff',
};

// Catalogue d’exemple
const RESOURCES = [
  { id:'a1', title:'Lire le langage canin — signaux d’apaisement', type:'Article', minutes:8,  source:'Turid Rugaas (intro)', url:'https://example.org/langage-canin', tags:['Comportement','Communication'], desc:'Reconnaître les signaux d’apaisement.' },
  { id:'v1', title:'Jeux calmes à la maison',                      type:'Vidéo',   minutes:10, source:'Bien-être Canin',     url:'https://example.org/jeux-calmes',    tags:['Jeux','Bien-être'],                desc:'3 idées d’activités calmes.' },
  { id:'p1', title:'Podcast — éviter la surcharge sensorielle',     type:'Podcast', minutes:22, source:'Paws & Brains',      url:'https://example.org/podcast-surcharge', tags:['Sensoriel','Bien-être'],       desc:'Doser la nouveauté et lire les signaux.' },
  { id:'l1', title:'“On Talking Terms With Dogs”',                  type:'Livre',   minutes:180,source:'Turid Rugaas',       url:'https://example.org/livre-turid',   tags:['Communication','Référence'],       desc:'Référence sur les signaux canins.' },
  { id:'f1', title:'Mini-formation : renforcement positif',         type:'Formation',minutes:60, source:'EduCan+',           url:'https://example.org/formation-rp',  tags:['Apprentissage','Education'],       desc:'Bases du R+ et erreurs à éviter.' },
];
const TYPES = ['Tous','Article','Vidéo','Podcast','Livre','Formation'];
const TAGS  = ['Tous','Comportement','Communication','Jeux','Bien-être','Sensoriel','Apprentissage','Education','Référence'];

const rid = () =>
  (typeof crypto!=='undefined' && crypto.getRandomValues
    ? Array.from(crypto.getRandomValues(new Uint32Array(3))).map(n=>n.toString(16)).join('')
    : `${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`);

export default function AllerPlusLoinScreen() {
  const navigation = useNavigation();

  const [query, setQuery] = useState('');
  const [type, setType]   = useState('Tous');
  const [tag, setTag]     = useState('Tous');

  const [userData, setUserData] = useState({
    fav:{}, done:{}, notes:{}, custom:[], playlists:[], reminder:null
  });

  // ajout ressource
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle,setNewTitle] = useState('');
  const [newUrl,setNewUrl] = useState('');
  const [newType,setNewType] = useState('Article');
  const [newTags,setNewTags] = useState(['Apprentissage']);
  const [newMinutes,setNewMinutes] = useState('10');
  const [newDesc,setNewDesc] = useState('');
  const [newSource,setNewSource] = useState('Moi');

  // rappels
  const [planOpen, setPlanOpen] = useState(false);

  // collections
  const [plistOpen, setPlistOpen] = useState(false);
  const [plistName, setPlistName] = useState('');
  const [plistSel, setPlistSel]   = useState({}); // {id:true}

  useEffect(()=>{ (async()=>{
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) setUserData(JSON.parse(raw));
  })(); },[]);
  const saveUserData = async next => {
    setUserData(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const all = useMemo(()=>[...RESOURCES, ...userData.custom], [userData.custom]);

  const filtered = useMemo(()=>{
    const q = query.trim().toLowerCase();
    return all.filter(r=>{
      const okQ = !q || [r.title,r.source||'',r.desc||'',(r.tags||[]).join(' '),r.type].join(' ').toLowerCase().includes(q);
      const okT = type==='Tous' || r.type===type;
      const okG = tag==='Tous'  || (r.tags||[]).includes(tag);
      return okQ && okT && okG;
    });
  },[all,query,type,tag]);

  const stats = useMemo(()=>{
    const favCount  = Object.keys(userData.fav).length;
    const doneCount = Object.keys(userData.done).length;
    const minPlanned = filtered.reduce((a,r)=>a+(Number(r.minutes)||0),0);
    return {favCount,doneCount,minPlanned};
  },[userData,filtered]);

  // actions
  const toggleFav = async id=>{
    const next={...userData, fav:{...userData.fav}};
    next.fav[id]? delete next.fav[id] : next.fav[id]=true;
    await saveUserData(next);
  };
  const toggleDone = async id=>{
    const next={...userData, done:{...userData.done}};
    next.done[id]? delete next.done[id] : next.done[id]=Date.now();
    await saveUserData(next);
  };
  const updateNote = async (id,txt)=>{
    const next={...userData, notes:{...userData.notes,[id]:txt}};
    if(!txt) delete next.notes[id];
    await saveUserData(next);
  };

  const addCustom = async()=>{
    if(!newTitle || !newUrl){ Alert.alert('Champs requis','Titre et URL sont requis.'); return; }
    const item={ id:`c_${rid()}`, title:newTitle.trim(), type:newType, minutes:Number(newMinutes)||0,
      source:newSource.trim()||'Moi', url:newUrl.trim(), tags:newTags, desc:newDesc.trim() };
    await saveUserData({ ...userData, custom:[item,...userData.custom] });
    setAddOpen(false); setNewTitle(''); setNewUrl(''); setNewType('Article'); setNewTags(['Apprentissage']);
    setNewMinutes('10'); setNewDesc(''); setNewSource('Moi');
  };

  const exportMD = async ()=>{
    const now = new Date().toLocaleString();
    const lines = [
      `# Aller plus loin — Export (${now})`,
      ``,
      `Filtres: type=${type}, tag=${tag}, recherche="${query}"`,
      ``,
      ...filtered.map(r=>{
        const fav = userData.fav[r.id] ? '★' : '☆';
        const done = userData.done[r.id] ? `✅ ${new Date(userData.done[r.id]).toLocaleDateString()}` : '—';
        const note = (userData.notes[r.id]||'').replace(/\n/g,' ');
        return `- **${r.title}** (${r.type}, ${r.minutes} min) — ${r.source}\n  ${r.url}\n  Tags: ${(r.tags||[]).join(', ')} | Fav: ${fav} | Fait: ${done}\n  Note: ${note}`;
      })
    ].join('\n');
    try {
      const Print = require('expo-print');
      if (Print?.printAsync) {
        const html = `<html><body><pre style="font-family:system-ui;-webkit-font-smoothing:antialiased;white-space:pre-wrap">${escapeHtml(lines)}</pre></body></html>`;
        await Print.printAsync({ html });
        return;
      }
    } catch(_) {}
    await Share.share({ message: lines });
  };

  const openUrl = async url=>{
    if(!url) return;
    const ok = await Linking.canOpenURL(url);
    ok ? Linking.openURL(url) : Alert.alert('Lien invalide', url);
  };

  // collections
  const createPlaylist = async ()=>{
    const ids = Object.keys(plistSel).filter(k=>plistSel[k]);
    if(!plistName.trim() || ids.length===0){
      Alert.alert('Infos manquantes', 'Nom + au moins 1 ressource.');
      return;
    }
    const pl = { id:`pl_${rid()}`, name: plistName.trim(), ids, createdAt: Date.now() };
    await saveUserData({ ...userData, playlists:[pl, ...userData.playlists] });
    setPlistOpen(false); setPlistName(''); setPlistSel({});
  };
  const runPlaylist = (pl)=>{
    // on résout les ressources et on navigue
    const resources = pl.ids
      .map(id => all.find(r=>r.id===id))
      .filter(Boolean);
    if (resources.length === 0) { Alert.alert('Vide', 'Cette collection ne contient plus de ressources.'); return; }
    navigation.navigate('CollectionRun', { playlist: { id: pl.id, name: pl.name, resources } });
  };
  const removePlaylist = async (pid)=>{
    await saveUserData({ ...userData, playlists: userData.playlists.filter(p=>p.id!==pid) });
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.h1}>Aller plus loin</Text>

        {/* actions */}
        <View style={s.rowWrap}>
          <TouchableOpacity style={s.btn} onPress={()=>setAddOpen(true)}><Text style={s.btnTxt}>+ Ressource</Text></TouchableOpacity>
          <TouchableOpacity style={s.btnSecondary} onPress={exportMD}><Text style={s.btnTxt}>Exporter (MD/PDF)</Text></TouchableOpacity>
          <TouchableOpacity
            style={[s.btnSecondary, userData.reminder?.plan && {backgroundColor:'#2ecc71'}]}
            onPress={()=>setPlanOpen(true)}
          >
            <Text style={s.btnTxt}>⏰ Rappels</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btn} onPress={()=>setPlistOpen(true)}><Text style={s.btnTxt}>+ Collection</Text></TouchableOpacity>
        </View>

        {/* stats */}
        <View style={s.statsRow}>
          <Stat label="Favoris" value={String(stats.favCount)} />
          <Stat label="Terminées" value={String(stats.doneCount)} />
          <Stat label="Minutes (filtre)" value={String(stats.minPlanned)} />
        </View>

        {/* recherche + filtres */}
        <TextInput value={query} onChangeText={setQuery} placeholder="Rechercher (titre, tag, source…)" placeholderTextColor={COLORS.sub} style={s.input} />
        <View style={s.filtersCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:8}}>
            {TYPES.map(t => <Chip key={t} label={t} active={type===t} onPress={()=>setType(t)} />)}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {TAGS.map(t => <Chip key={t} label={t} active={tag===t} onPress={()=>setTag(t)} />)}
          </ScrollView>
        </View>

        {/* collections */}
        {userData.playlists.length>0 && (
          <View style={s.card}>
            <Text style={s.section}>Mes collections</Text>
            {userData.playlists.map(pl=>(
              <View key={pl.id} style={[s.rowBetween,{marginTop:6}]}>
                <Text style={s.meta}>{pl.name} • {pl.ids.length} items</Text>
                <View style={s.row}>
                  <TouchableOpacity style={s.btnGhost} onPress={()=>runPlaylist(pl)}><Text style={s.btnGhostTxt}>Ouvrir</Text></TouchableOpacity>
                  <TouchableOpacity style={[s.btnGhost,{marginLeft:6,borderColor:'#c0392b'}]} onPress={()=>removePlaylist(pl.id)}>
                    <Text style={[s.btnGhostTxt,{color:'#c0392b'}]}>Suppr.</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* liste (map simple) */}
        {filtered.length===0 ? (
          <Text style={s.empty}>Aucun résultat avec ces filtres.</Text>
        ):(
          filtered.map(r=>(
            <View key={r.id} style={s.card}>
              <View style={s.rowBetween}>
                <Text style={s.title}>{r.title}</Text>
                <View style={s.row}>
                  <TouchableOpacity onPress={()=>toggleFav(r.id)} style={[s.iconBtn, userData.fav[r.id] && {backgroundColor:'#f1d6ff'}]}>
                    <Text style={{fontSize:16}}>{userData.fav[r.id] ? '★' : '☆'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={()=>toggleDone(r.id)} style={[s.iconBtn, userData.done[r.id] && {backgroundColor:'#dff6e4'}]}>
                    <Text style={{fontSize:16}}>{userData.done[r.id] ? '✅' : '⬜️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={s.meta}>{r.type} • {r.minutes} min • {r.source}</Text>
              {!!r.tags?.length && (
                <View style={s.badges}>{r.tags.map((t,i)=><Text key={i} style={s.badge}>{t}</Text>)}</View>
              )}
              {!!r.desc && <Text style={s.body}>{r.desc}</Text>}

              <View style={s.rowBetween}>
                <TouchableOpacity style={s.btn} onPress={()=>openUrl(r.url)}><Text style={s.btnTxt}>Ouvrir</Text></TouchableOpacity>
                <Text style={s.meta}>{userData.done[r.id] ? `Fait le ${new Date(userData.done[r.id]).toLocaleDateString()}` : 'Pas encore fait'}</Text>
              </View>

              <TextInput
                value={userData.notes[r.id]||''}
                onChangeText={t=>updateNote(r.id,t)}
                placeholder="Note personnelle (optionnel)"
                placeholderTextColor={COLORS.sub}
                style={[s.input,{marginTop:10}]}
                multiline
              />
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal ajout ressource */}
      <Modal visible={addOpen} onRequestClose={()=>setAddOpen(false)} transparent animationType="slide">
        <View style={s.modalWrap}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Ajouter une ressource</Text>
            <Text style={s.label}>Titre</Text>
            <TextInput value={newTitle} onChangeText={setNewTitle} style={s.input} placeholder="Titre" placeholderTextColor={COLORS.sub}/>
            <Text style={s.label}>URL</Text>
            <TextInput value={newUrl} onChangeText={setNewUrl} style={s.input} placeholder="https://…" placeholderTextColor={COLORS.sub} autoCapitalize="none"/>

            <Text style={s.label}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:8}}>
              {TYPES.filter(t=>t!=='Tous').map(t => <Chip key={t} label={t} active={newType===t} onPress={()=>setNewType(t)} />)}
            </ScrollView>

            <Text style={s.label}>Tags</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:8}}>
              {TAGS.filter(t=>t!=='Tous').map(t=>{
                const on = newTags.includes(t);
                return (
                  <TouchableOpacity key={t} onPress={()=> setNewTags(on? newTags.filter(x=>x!==t) : [...newTags,t])} style={[s.chip, on && s.chipOn]}>
                    <Text style={[s.chipTxt, on && s.chipTxtOn]}>{t}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={s.row}>
              <View style={{flex:1, marginRight:8}}>
                <Text style={s.label}>Durée (min)</Text>
                <TextInput value={newMinutes} onChangeText={setNewMinutes} keyboardType="numeric" style={s.input} placeholder="10" placeholderTextColor={COLORS.sub}/>
              </View>
              <View style={{flex:1}}>
                <Text style={s.label}>Source / Auteur</Text>
                <TextInput value={newSource} onChangeText={setNewSource} style={s.input} placeholder="Auteur / site" placeholderTextColor={COLORS.sub}/>
              </View>
            </View>

            <Text style={s.label}>Description</Text>
            <TextInput value={newDesc} onChangeText={setNewDesc} style={[s.input,{minHeight:70}]} placeholder="Notes sur le contenu…" placeholderTextColor={COLORS.sub} multiline/>

            <View style={[s.rowBetween,{marginTop:12}]}>
              <TouchableOpacity style={s.btnGhost} onPress={()=>setAddOpen(false)}><Text style={s.btnGhostTxt}>Fermer</Text></TouchableOpacity>
              <TouchableOpacity style={s.btn} onPress={addCustom}><Text style={s.btnTxt}>Ajouter</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal rappels */}
      {planOpen && (
        <RemindersPlanModal
          initialPlan={userData.reminder?.plan}
          onClose={()=>setPlanOpen(false)}
          onSave={async(plan)=>{
            if(!plan){
              await clearReminder();
              await saveUserData({ ...userData, reminder:null });
            } else {
              await schedulePlan({ ...plan, title:'📚 Aller plus loin', body:'Prendre 10 min pour apprendre quelque chose 💜' });
              await saveUserData({ ...userData, reminder:{ plan } });
            }
            setPlanOpen(false);
            Alert.alert('OK','Rappels mis à jour ✅');
          }}
        />
      )}

      {/* Modal collection */}
      <Modal visible={plistOpen} onRequestClose={()=>setPlistOpen(false)} transparent animationType="slide">
        <View style={s.modalWrap}>
          <View style={[s.modal,{maxHeight:'90%'}]}>
            <Text style={s.modalTitle}>Nouvelle collection</Text>
            <TextInput value={plistName} onChangeText={setPlistName} placeholder="Nom de la collection" placeholderTextColor={COLORS.sub} style={s.input}/>
            <Text style={s.label}>Sélectionne des ressources ({filtered.length})</Text>
            <ScrollView style={{maxHeight:300}}>
              {filtered.map(r=>{
                const on = !!plistSel[r.id];
                return (
                  <TouchableOpacity key={r.id} onPress={()=>setPlistSel(p=>({...p,[r.id]:!on}))} style={[s.pickItem, on && {borderColor:COLORS.primary}]}>
                    <View style={{flex:1}}>
                      <Text style={s.title}>{r.title}</Text>
                      <Text style={s.meta}>{r.type} • {r.minutes} min • {r.source}</Text>
                    </View>
                    <Text style={{fontSize:18}}>{on ? '✔︎' : '+'}</Text>
                  </TouchableOpacity>
                );
              })}
              {filtered.length===0 && <Text style={s.empty}>Aucune ressource avec ces filtres.</Text>}
            </ScrollView>
            <View style={[s.rowBetween,{marginTop:10}]}>
              <TouchableOpacity style={s.btnGhost} onPress={()=>setPlistOpen(false)}><Text style={s.btnGhostTxt}>Fermer</Text></TouchableOpacity>
              <TouchableOpacity style={s.btn} onPress={createPlaylist}><Text style={s.btnTxt}>Enregistrer</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function Chip({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.chip, active && s.chipOn]}>
      <Text style={[s.chipTxt, active && s.chipTxtOn]}>{label}</Text>
    </TouchableOpacity>
  );
}
function Stat({ label, value }) {
  return (
    <View style={s.statBox}>
      <Text style={s.statVal}>{value}</Text>
      <Text style={s.statLbl}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container:{ padding:20, paddingTop:80, paddingBottom:100 },
  h1:{ fontSize:26, fontWeight:'900', color:COLORS.ink, backgroundColor:'#fff', paddingVertical:6, paddingHorizontal:12, borderRadius:10, alignSelf:'center', marginBottom:12 },

  row:{ flexDirection:'row', alignItems:'center', gap:10 },
  rowBetween:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  rowWrap:{ flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:12, justifyContent:'center' },

  btn:{ backgroundColor:COLORS.primary, paddingVertical:10, paddingHorizontal:12, borderRadius:12 },
  btnSecondary:{ backgroundColor:COLORS.secondary, paddingVertical:10, paddingHorizontal:12, borderRadius:12 },
  btnTxt:{ color:'#fff', fontWeight:'800' },
  btnGhost:{ borderWidth:1, borderColor:'#d8c8ff', paddingVertical:10, paddingHorizontal:12, borderRadius:12 },
  btnGhostTxt:{ color:COLORS.ink, fontWeight:'800' },

  input:{ backgroundColor:'#fff', borderRadius:14, paddingHorizontal:12, paddingVertical:10, color:COLORS.ink, marginBottom:10 },

  statsRow:{ flexDirection:'row', gap:10, marginBottom:10 },
  statBox:{ flex:1, backgroundColor:'#fff', borderRadius:16, paddingVertical:16, alignItems:'center', shadowColor:'#000', shadowOpacity:0.06, shadowRadius:6, elevation:2 },
  statVal:{ fontSize:18, fontWeight:'900', color:COLORS.ink },
  statLbl:{ color:COLORS.sub, fontSize:12, marginTop:4 },

  filtersCard:{ backgroundColor:'#fff', borderRadius:16, paddingVertical:10, paddingHorizontal:8, marginBottom:12, shadowColor:'#000', shadowOpacity:0.06, shadowRadius:6, elevation:2 },

  chip:{ backgroundColor:COLORS.chip, borderWidth:1, borderColor:'#d8c8ff', borderRadius:22, paddingVertical:8, paddingHorizontal:14, marginRight:8, marginBottom:6 },
  chipOn:{ backgroundColor:COLORS.primary, borderColor:COLORS.primary },
  chipTxt:{ color:COLORS.ink, fontWeight:'800' },
  chipTxtOn:{ color:'#fff' },

  card:{ backgroundColor:COLORS.card, borderRadius:14, padding:14, marginBottom:12 },
  section:{ color:COLORS.ink, fontWeight:'900', marginBottom:6 },
  title:{ color:COLORS.ink, fontWeight:'900', fontSize:16 },
  meta:{ color:COLORS.sub, marginTop:2 },
  body:{ color:COLORS.ink, marginTop:6 },
  badges:{ flexDirection:'row', flexWrap:'wrap', gap:8, marginVertical:8 },
  badge:{ backgroundColor:'#EFE6FB', color:COLORS.ink, borderRadius:12, paddingVertical:6, paddingHorizontal:10, marginRight:6 },
  iconBtn:{ backgroundColor:'#EFE6FB', paddingVertical:8, paddingHorizontal:10, borderRadius:10, marginLeft:6 },

  empty:{ color:COLORS.sub, textAlign:'center', marginTop:6 },

  modalWrap:{ flex:1, backgroundColor:'#0008', alignItems:'center', justifyContent:'center', padding:16 },
  modal:{ width:'100%', backgroundColor:'#fff', borderRadius:18, padding:16 },
  modalTitle:{ fontSize:18, fontWeight:'900', color:COLORS.ink, marginBottom:8 },

  label:{ color:COLORS.sub, fontWeight:'700', marginBottom:4 },

  pickItem:{ flexDirection:'row', alignItems:'center', gap:10, backgroundColor:'#fff', borderRadius:12, padding:12, marginBottom:8, borderWidth:1, borderColor:'#f0e8ff' },
});

function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }
