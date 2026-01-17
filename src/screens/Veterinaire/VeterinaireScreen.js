// src/screens/Veterinaire/VeterinaireScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, TextInput, FlatList,
  Modal, Alert, Vibration, Linking, ScrollView,
} from 'react-native';

import {
  getState, addEntry, removeEntry, stats7d,
  saveReminder, saveVetContact, nextDue,
} from './store-vet';

import RemindersPlanModal from '../../components/RemindersPlanModal';
import { schedulePlan, clearReminder } from '../ActivitesSensorielles/utils/acts-notifications';
import { exportVetCSV } from './utils/vet-exports';

const COLORS = {
  primary: '#7d4ac5',
  secondary: '#a077e6',
  danger: '#c0392b',
  ink: '#4a235a',
  sub: '#6b3fa3',
  chip: '#F1E8FF',
  card: '#fff',
};

const TYPES = [
  { id: 'visit',   label: 'Visite véto' },
  { id: 'vaccine', label: 'Vaccin' },
  { id: 'flea',    label: 'Antiparasitaire' },
  { id: 'deworm',  label: 'Vermifuge' },
  { id: 'weight',  label: 'Poids' },
  { id: 'note',    label: 'Note' },
];

export default function VeterinaireScreen() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [stats, setStats] = useState({ visits7: 0, meds7: 0, avgWeight7: 0 });
  const [reminder, setReminderState] = useState(null);
  const [vetContact, setVetContact] = useState(null);
  const [dueSoon, setDueSoon] = useState([]);

  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState('visit');
  const [prefill, setPrefill] = useState(null);

  const [planOpen, setPlanOpen] = useState(false);
  const [editContactOpen, setEditContactOpen] = useState(false);
  const [quickFor, setQuickFor] = useState(null); // {type, product}

  useEffect(() => { load(); }, []);
  const load = async () => {
    const s = await getState();
    setItems(s.items || []);
    setReminderState(s.reminder || null);
    setVetContact(s.vetContact || null);
    setStats(await stats7d());
    setDueSoon(await nextDue());
  };

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;
    return items.filter(it =>
      [
        it.type,
        it.title || '',
        it.note || '',
        it.vet || '',
        it.product || '',
        String(it.weight || ''),
      ].join(' ').toLowerCase().includes(qq)
    );
  }, [items, q]);

  const onDelete = async (id) => { await removeEntry(id); await load(); };
  const isOverdue = (ts) => ts && ts < new Date().setHours(0,0,0,0);

  const openTel  = (num) => Linking.openURL(`tel:${num}`);
  const openSMS  = (num) => Linking.openURL(`sms:${num}`);
  const openMail = (m)   => Linking.openURL(`mailto:${m}`);
  const openMaps = (a)   => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}`);

  const Header = (
    <View style={s.header}>
      <Text style={s.h1}>Vétérinaire & Prévention</Text>

      {/* Contact véto */}
      <View style={s.card}>
        <View style={s.rowBetween}>
          <Text style={s.title}>Vétérinaire</Text>
          <TouchableOpacity style={s.btnGhost} onPress={() => setEditContactOpen(true)}>
            <Text style={s.btnGhostTxt}>{vetContact ? 'Modifier' : 'Ajouter'}</Text>
          </TouchableOpacity>
        </View>

        {vetContact ? (
          <>
            {vetContact.name ? <Text style={s.body}><Text style={s.bold}>Nom : </Text>{vetContact.name}</Text> : null}
            {vetContact.phone ? (
              <View style={[s.row, { marginTop: 6 }]}>
                <TouchableOpacity style={s.smallBtn} onPress={() => openTel(vetContact.phone)}><Text style={s.smallBtnTxt}>Appeler</Text></TouchableOpacity>
                <TouchableOpacity style={s.smallBtn} onPress={() => openSMS(vetContact.phone)}><Text style={s.smallBtnTxt}>SMS</Text></TouchableOpacity>
              </View>
            ) : null}
            <View style={[s.row, { marginTop: 6 }]}>
              {vetContact.email ? (
                <TouchableOpacity style={s.smallBtn} onPress={() => openMail(vetContact.email)}><Text style={s.smallBtnTxt}>E-mail</Text></TouchableOpacity>
              ) : null}
              {vetContact.address ? (
                <TouchableOpacity style={s.smallBtn} onPress={() => openMaps(vetContact.address)}><Text style={s.smallBtnTxt}>Ouvrir Maps</Text></TouchableOpacity>
              ) : null}
            </View>
          </>
        ) : (
          <Text style={s.meta}>Aucun contact enregistré.</Text>
        )}
      </View>

      {/* Prochains soins */}
      <View style={s.card}>
        <Text style={s.title}>Prochains soins</Text>

        {dueSoon.length === 0 ? (
          <Text style={s.meta}>Aucun soin planifié.</Text>
        ) : (
          dueSoon.map((d) => {
            const overdue = isOverdue(d.nextDate);
            return (
              <View key={d.id} style={[s.rowBetween, { marginTop: 10 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.body}>{iconFor(d.type)} {labelFor(d.type)} • {d.product || '—'}</Text>
                  <View style={s.row}>
                    <Text style={[s.meta, overdue && { color: COLORS.danger, fontWeight: '900' }]}>
                      {new Date(d.nextDate).toLocaleDateString()}
                    </Text>
                    {overdue && <Text style={s.overdueBadge}>en retard</Text>}
                  </View>
                </View>

                <View style={s.row}>
                  <TouchableOpacity style={s.btnMini} onPress={() => setQuickFor({ type: d.type, product: d.product || '' })}>
                    <Text style={s.btnMiniTxt}>Fait</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.btnMini, { backgroundColor: COLORS.secondary }]}
                    onPress={() => {
                      setKind(d.type);
                      setPrefill({
                        product: d.product || '',
                        nextDate: d.nextDate ? new Date(d.nextDate).toISOString().slice(0,10) : '',
                        note: '',
                      });
                      setOpen(true);
                    }}
                  >
                    <Text style={s.btnMiniTxt}>Détails…</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* actions */}
      <View style={s.topRow}>
        {TYPES.map(t => (
          <TouchableOpacity
            key={t.id}
            style={s.btnSecondary}
            onPress={() => { setKind(t.id); setPrefill(null); setOpen(true); }}
          >
            <Text style={s.btnTxt}>+ {t.label}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={s.btnSecondary} onPress={() => exportVetCSV(items)}>
          <Text style={s.btnTxt}>Exporter CSV</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.btnSecondary, reminder?.plan && { backgroundColor: '#2ecc71' }]}
          onPress={() => setPlanOpen(true)}
        >
          <Text style={s.btnTxt}>⏰ Rappels</Text>
        </TouchableOpacity>
      </View>

      {/* stats */}
      <View style={s.statsRow}>
        <Box label="Visites (7j)" value={String(stats.visits7)} />
        <Box label="Soins (7j)" value={String(stats.meds7)} />
        <Box label="Poids moy. (7j)" value={stats.avgWeight7 ? `${stats.avgWeight7.toFixed(1)} kg` : '—'} />
      </View>

      {/* recherche */}
      <TextInput
        style={s.input}
        placeholder="Rechercher (vaccin, produit, note, poids…)"
        placeholderTextColor="#6b3fa3"
        value={q}
        onChangeText={setQ}
      />
    </View>
  );

  return (
    <View style={s.screen}>
      <FlatList
        data={filtered}
        keyExtractor={(it) => it.id}
        ListHeaderComponent={Header}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={<Text style={s.empty}>Aucune entrée pour l’instant.</Text>}
        renderItem={({ item }) => <ItemCard item={item} onDelete={() => onDelete(item.id)} />}
      />

      {/* Ajout */}
      {open && (
        <EditModal
          type={kind}
          prefill={prefill}
          onClose={() => setOpen(false)}
          onSaved={async (payload) => {
            await addEntry(payload);
            Vibration.vibrate(120);
            setOpen(false);
            await load();
          }}
        />
      )}

      {/* Rappels */}
      {planOpen && (
        <RemindersPlanModal
          initialPlan={reminder?.plan}
          onClose={() => setPlanOpen(false)}
          onSave={async (plan) => {
            if (!plan) {
              await clearReminder();
              await saveReminder(null);
              setReminderState(null);
            } else {
              await schedulePlan({ ...plan, title: '🐾 Prévention', body: 'Pense au vaccin / pipette / vermifuge 💜' });
              await saveReminder({ plan });
              setReminderState({ plan });
            }
            setPlanOpen(false);
            Alert.alert('OK', 'Rappels mis à jour ✅');
          }}
        />
      )}

      {/* Contact véto */}
      {editContactOpen && (
        <VetContactModal
          initial={vetContact}
          onClose={() => setEditContactOpen(false)}
          onSave={async (contact) => {
            await saveVetContact(contact);
            setEditContactOpen(false);
            await load();
          }}
        />
      )}

      {/* Fait + prochaine date */}
      {quickFor && (
        <QuickDoneModal
          type={quickFor.type}
          productDefault={quickFor.product}
          onClose={() => setQuickFor(null)}
          onSave={async ({ product, nextDate }) => {
            await addEntry({
              id: genId(),
              ts: Date.now(),
              type: quickFor.type,
              product: product?.trim() || undefined,
              nextDate: nextDate ? nextDate.getTime() : undefined,
              note: 'Fait (validation rapide)',
            });
            Vibration.vibrate(120);
            setQuickFor(null);
            await load();
            Alert.alert('Enregistré', 'Soin enregistré + prochaine date ✅');
          }}
        />
      )}
    </View>
  );
}

/* helpers */
const iconFor = (t) => (t === 'vaccine' ? '💉' : t === 'flea' ? '🪳' : t === 'deworm' ? '🪱' : '•');
const labelFor = (t) => (t === 'vaccine' ? 'Vaccin' : t === 'flea' ? 'Antiparasitaire' : t === 'deworm' ? 'Vermifuge' : t);

function ItemCard({ item, onDelete }) {
  const tag =
    item.type === 'visit' ? '🏥 Visite' :
    item.type === 'vaccine' ? '💉 Vaccin' :
    item.type === 'flea' ? '🪳 Antiparasitaire' :
    item.type === 'deworm' ? '🪱 Vermifuge' :
    item.type === 'weight' ? '⚖️ Poids' : '📝 Note';

  return (
    <View style={s.card}>
      <View style={s.rowBetween}>
        <Text style={s.title}>{tag}</Text>
        <TouchableOpacity onPress={onDelete}><Text>🗑</Text></TouchableOpacity>
      </View>

      <Text style={s.meta}>{new Date(item.ts).toLocaleString()}</Text>

      {item.type === 'visit' && (
        <>
          {item.vet ? <Text style={s.body}><Text style={s.bold}>Véto : </Text>{item.vet}</Text> : null}
          {item.reason ? <Text style={s.body}><Text style={s.bold}>Motif : </Text>{item.reason}</Text> : null}
          {item.cost ? <Text style={s.meta}>Coût : {item.cost} €</Text> : null}
        </>
      )}

      {['vaccine','flea','deworm'].includes(item.type) && (
        <>
          <Text style={s.body}><Text style={s.bold}>Produit : </Text>{item.product || '—'}</Text>
          {item.nextDate ? <Text style={s.meta}>Prochain : {new Date(item.nextDate).toLocaleDateString()}</Text> : null}
        </>
      )}

      {item.type === 'weight' && (
        <Text style={s.body}><Text style={s.bold}>Poids : </Text>{item.weight} kg</Text>
      )}

      {item.note ? <Text style={[s.body, { marginTop: 6 }]}>{item.note}</Text> : null}
    </View>
  );
}

/* Modale Fait + prochaine date */
function QuickDoneModal({ type, productDefault, onClose, onSave }) {
  const [product, setProduct] = useState(productDefault || '');
  const [unit, setUnit] = useState('months');
  const [qty, setQty] = useState(defaultQty(type));
  const [customOpen, setCustomOpen] = useState(false);

  const presets = presetsFor(type);

  const computeNext = () => {
    const now = new Date();
    if (unit === 'days') return new Date(now.getFullYear(), now.getMonth(), now.getDate() + qty);
    if (unit === 'weeks') return new Date(now.getFullYear(), now.getMonth(), now.getDate() + qty * 7);
    const d = new Date(now.getTime());
    d.setMonth(d.getMonth() + qty);
    return d;
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} transparent>
      <View style={s.modalWrap}>
        <View style={s.modal}>
          <Text style={s.modalTitle}>Marquer “Fait” + prochaine date</Text>
          <Text style={s.meta}>{labelFor(type)}</Text>

          <TextInput
            style={s.input}
            placeholder="Produit (optionnel)"
            placeholderTextColor="#6b3fa3"
            value={product}
            onChangeText={setProduct}
          />

          <Text style={[s.title, { marginTop: 8, marginBottom: 6 }]}>Raccourcis</Text>
          <View style={[s.row, { flexWrap:'wrap', gap: 8 }]}>
            {presets.map((p, i) => (
              <TouchableOpacity
                key={i}
                style={s.chip}
                onPress={() => onSave({ product, nextDate: computeDateFromPreset(p) })}
              >
                <Text style={s.chipTxt}>{p.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[s.chip, { backgroundColor: COLORS.primary }]} onPress={() => setCustomOpen(v => !v)}>
              <Text style={[s.chipTxt, { color:'#fff' }]}>{customOpen ? 'Fermer perso' : 'Personnalisé'}</Text>
            </TouchableOpacity>
          </View>

          {customOpen && (
            <View style={[s.rowBetween, { marginTop: 10 }]}>
              <View style={s.row}>
                {['days','weeks','months'].map(u => (
                  <TouchableOpacity
                    key={u}
                    style={[s.btnGhost, { marginRight: 6 }, unit===u && { borderColor: COLORS.primary }]}
                    onPress={() => setUnit(u)}
                  >
                    <Text style={s.btnGhostTxt}>{u === 'days' ? 'Jours' : u === 'weeks' ? 'Semaines' : 'Mois'}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={s.row}>
                <TouchableOpacity style={s.btnGhost} onPress={() => setQty(Math.max(1, qty-1))}><Text style={s.btnGhostTxt}>−</Text></TouchableOpacity>
                <Text style={[s.title, { marginHorizontal: 8 }]}>{qty}</Text>
                <TouchableOpacity style={s.btnGhost} onPress={() => setQty(qty+1)}><Text style={s.btnGhostTxt}>＋</Text></TouchableOpacity>
              </View>
            </View>
          )}

          <View style={[s.rowBetween, { marginTop: 14 }]}>
            <TouchableOpacity style={s.btnGhost} onPress={onClose}><Text style={s.btnGhostTxt}>Annuler</Text></TouchableOpacity>
            <TouchableOpacity style={s.btn} onPress={() => onSave({ product, nextDate: computeNext() })}>
              <Text style={s.btnTxt}>Valider</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function defaultQty(type) {
  if (type === 'flea') return 1;
  if (type === 'deworm') return 3;
  if (type === 'vaccine') return 12;
  return 1;
}
function presetsFor(type) {
  if (type === 'flea') return [{ label:'Dans 1 mois', unit:'months', qty:1 }];
  if (type === 'deworm') return [{ label:'Dans 3 mois', unit:'months', qty:3 }];
  if (type === 'vaccine') return [{ label:'Dans 12 mois', unit:'months', qty:12 }];
  return [{ label:'Dans 2 semaines', unit:'weeks', qty:2 }, { label:'Dans 1 mois', unit:'months', qty:1 }];
}
function computeDateFromPreset(p) {
  const now = new Date();
  if (p.unit === 'weeks') return new Date(now.getFullYear(), now.getMonth(), now.getDate() + p.qty * 7);
  if (p.unit === 'days') return new Date(now.getFullYear(), now.getMonth(), now.getDate() + p.qty);
  const d = new Date(now.getTime()); d.setMonth(d.getMonth() + p.qty); return d;
}

/* Modale ajout */
function EditModal({ type, prefill, onClose, onSaved }) {
  const [vet, setVet] = useState('');
  const [reason, setReason] = useState('');
  const [cost, setCost] = useState('');
  const [product, setProduct] = useState(prefill?.product || '');
  const [nextDate, setNextDate] = useState(prefill?.nextDate || '');
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState(prefill?.note || '');

  const save = () => {
    const base = { id: genId(), ts: Date.now(), type, note: note?.trim() || undefined };
    let payload = base;

    if (type === 'visit') {
      payload = { ...base, vet: vet.trim() || undefined, reason: reason.trim() || undefined, cost: Number(cost) || undefined };
    } else if (['vaccine','flea','deworm'].includes(type)) {
      payload = { ...base, product: product.trim() || undefined, nextDate: nextDate ? new Date(nextDate).getTime() : undefined };
    } else if (type === 'weight') {
      if (!weight) return Alert.alert('Champ requis', 'Indique le poids (kg).');
      payload = { ...base, weight: Number(weight) };
    }
    onSaved(payload);
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} transparent>
      <View style={s.modalWrap}>
        <View style={s.modal}>
          <Text style={s.modalTitle}>Ajouter • {labelFor(type)}</Text>

          {type === 'visit' && (
            <>
              <TextInput style={s.input} placeholder="Nom du vétérinaire" value={vet} onChangeText={setVet} placeholderTextColor="#6b3fa3" />
              <TextInput style={s.input} placeholder="Motif / Diagnostic" value={reason} onChangeText={setReason} placeholderTextColor="#6b3fa3" />
              <TextInput style={s.input} placeholder="Coût (€)" keyboardType="numeric" value={cost} onChangeText={setCost} placeholderTextColor="#6b3fa3" />
            </>
          )}

          {['vaccine','flea','deworm'].includes(type) && (
            <>
              <TextInput style={s.input} placeholder="Produit / Vaccin" value={product} onChangeText={setProduct} placeholderTextColor="#6b3fa3" />
              <TextInput style={s.input} placeholder="Prochaine date (YYYY-MM-DD)" value={nextDate} onChangeText={setNextDate} placeholderTextColor="#6b3fa3" />
            </>
          )}

          {type === 'weight' && (
            <TextInput style={s.input} placeholder="Poids (kg)" keyboardType="numeric" value={weight} onChangeText={setWeight} placeholderTextColor="#6b3fa3" />
          )}

          <TextInput
            style={[s.input, { minHeight: 70 }]}
            placeholder="Note (optionnel)"
            value={note}
            onChangeText={setNote}
            multiline
            placeholderTextColor="#6b3fa3"
          />

          <View style={s.rowBetween}>
            <TouchableOpacity style={s.btnGhost} onPress={onClose}><Text style={s.btnGhostTxt}>Fermer</Text></TouchableOpacity>
            <TouchableOpacity style={s.btn} onPress={save}><Text style={s.btnTxt}>Enregistrer</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* Modale contact véto */
function VetContactModal({ initial, onClose, onSave }) {
  const [name, setName] = useState(initial?.name || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [address, setAddress] = useState(initial?.address || '');

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} transparent>
      <View style={s.modalWrap}>
        <View style={s.modal}>
          <Text style={s.modalTitle}>Fiche vétérinaire</Text>
          <TextInput style={s.input} placeholder="Nom" value={name} onChangeText={setName} placeholderTextColor="#6b3fa3" />
          <TextInput style={s.input} placeholder="Téléphone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} placeholderTextColor="#6b3fa3" />
          <TextInput style={s.input} placeholder="E-mail" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} placeholderTextColor="#6b3fa3" />
          <TextInput style={[s.input, { minHeight: 70 }]} placeholder="Adresse" value={address} onChangeText={setAddress} multiline placeholderTextColor="#6b3fa3" />
          <View style={s.rowBetween}>
            <TouchableOpacity style={s.btnGhost} onPress={onClose}><Text style={s.btnGhostTxt}>Fermer</Text></TouchableOpacity>
            <TouchableOpacity
              style={s.btn}
              onPress={() => onSave({
                name: name.trim() || undefined,
                phone: phone.trim() || undefined,
                email: email.trim() || undefined,
                address: address.trim() || undefined,
              })}
            >
              <Text style={s.btnTxt}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Box({ label, value }) {
  return (
    <View style={s.statBox}>
      <Text style={s.statVal}>{value}</Text>
      <Text style={s.statLbl}>{label}</Text>
    </View>
  );
}

const genId = () => String(Math.random()).slice(2) + String(Date.now());

/* styles */
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' }, // ✅ laisse voir le fond global (App.js)

  header: { padding: 20, paddingTop: 80 },

  h1: {
    fontSize: 26, fontWeight: '900', color: COLORS.ink,
    backgroundColor: '#fff', paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 10, alignSelf: 'center', marginBottom: 14,
  },

  topRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },

  btn: { backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  btnSecondary: { backgroundColor: COLORS.secondary, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  btnTxt: { color: '#fff', fontWeight: '800' },

  smallBtn: { backgroundColor: COLORS.secondary, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, marginRight: 8 },
  smallBtnTxt: { color: '#fff', fontWeight: '800' },

  btnMini: { backgroundColor: COLORS.primary, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, marginLeft: 8 },
  btnMiniTxt: { color: '#fff', fontWeight: '800' },

  overdueBadge: {
    marginLeft: 8, backgroundColor: COLORS.danger, color: '#fff',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, fontSize: 12, overflow: 'hidden'
  },

  statsRow: { flexDirection: 'row', gap: 10, marginVertical: 14 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor:'#000', shadowOpacity:0.06, shadowRadius:6, elevation:2 },
  statVal: { fontSize: 20, fontWeight: '900', color: COLORS.ink },
  statLbl: { color: COLORS.sub, marginTop: 4 },

  input: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, color: COLORS.ink, marginBottom: 10 },

  card: { backgroundColor: COLORS.card, borderRadius: 14, padding: 14, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  title: { color: COLORS.ink, fontWeight: '900', fontSize: 16 },
  meta: { color: COLORS.sub, marginTop: 2 },
  body: { color: COLORS.ink, marginTop: 6 },
  bold: { fontWeight: '900', color: COLORS.ink },

  empty: { color: COLORS.sub, textAlign: 'center', marginTop: 12 },

  modalWrap: { flex: 1, backgroundColor: '#0008', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 16, maxHeight: '94%' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: COLORS.ink, marginBottom: 8 },

  btnGhost: { borderWidth: 1, borderColor: '#d8c8ff', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  btnGhostTxt: { color: COLORS.ink, fontWeight: '800' },

  chip: { backgroundColor: COLORS.chip, borderWidth: 1, borderColor: '#d8c8ff', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 22 },
  chipTxt: { color: COLORS.ink, fontWeight: '800' },
});
