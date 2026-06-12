import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Search, Tag, Wind, Zap, Droplet, Flame, ShieldAlert,
  ArrowUpDown, Utensils, Waves, BatteryCharging, Wrench, X, QrCode
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout';

const ICONS = {
  wind: Wind, zap: Zap, droplet: Droplet, flame: Flame,
  'shield-alert': ShieldAlert, 'arrow-up-down': ArrowUpDown,
  utensils: Utensils, waves: Waves, 'battery-charging': BatteryCharging,
  wrench: Wrench,
};

const STATUS_LABELS = {
  operativo: 'Operativo',
  guasto: 'Guasto',
  in_manutenzione: 'In manutenzione',
  dismesso: 'Dismesso',
};

const STATUS_STYLES = {
  operativo: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  guasto: 'bg-red-50 text-red-700 border-red-200',
  in_manutenzione: 'bg-amber-50 text-amber-700 border-amber-200',
  dismesso: 'bg-gray-100 text-gray-500 border-gray-200',
};

const EMPTY_ASSET = {
  property_id: '', category_id: '', name: '', brand: '', model: '',
  serial_number: '', location: '', installation_date: '', warranty_expiry: '',
  status: 'operativo', next_maintenance_date: '', notes: '',
};

export default function AssetRegistry() {
  const [assets, setAssets] = useState([]);
  const [properties, setProperties] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterProperty, setFilterProperty] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  const [selected, setSelected] = useState(new Set());
  const [editing, setEditing] = useState(null); // null | 'new' | asset object

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    setError(null);
    const [a, p, c] = await Promise.all([
      supabase.from('assets_overview').select('*').order('property_name').order('name'),
      supabase.from('properties').select('id, name, code').order('name'),
      supabase.from('asset_categories').select('id, name, icon').order('sort_order'),
    ]);
    if (a.error) setError(a.error.message);
    setAssets(a.data || []);
    setProperties(p.data || []);
    setCategories(c.data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    return assets.filter(a => {
      if (filterProperty !== 'all' && a.property_name !== filterProperty) return false;
      if (filterCategory !== 'all' && a.category_name !== filterCategory) return false;
      if (filterStatus !== 'all' && a.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${a.name} ${a.brand ?? ''} ${a.model ?? ''} ${a.serial_number ?? ''} ${a.location ?? ''} ${a.qr_code}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [assets, filterProperty, filterCategory, filterStatus, search]);

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(a => a.id)));
  }

  async function saveAsset(form) {
    const payload = { ...form };
    if (payload.id) {
      const { error: saveError } = await supabase.from('assets').update(payload).eq('id', payload.id);
      if (saveError) { alert('Errore salvataggio: ' + saveError.message); return; }
    } else {
      const { error: saveError } = await supabase.from('assets').insert(payload);
      if (saveError) { alert('Errore salvataggio: ' + saveError.message); return; }
    }
    setEditing(null);
    loadAll();
  }

  async function deleteAsset(id) {
    if (!confirm('Eliminare definitivamente questo bene dal registro?')) return;
    const { error: deleteError } = await supabase.from('assets').delete().eq('id', id);
    if (deleteError) { alert('Errore: ' + deleteError.message); return; }
    loadAll();
  }

  return (
    <Layout>
      <div className="border-b border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-stone-800">Attrezzature tecniche</h1>
            <p className="text-sm text-stone-500 mt-1">
              {assets.length} beni registrati su {properties.length} strutture
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selected.size > 0 && (
              <Link
                to={`/etichette?ids=${[...selected].join(',')}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-100"
              >
                <QrCode size={16} /> Etichette ({selected.size})
              </Link>
            )}
            <button
              onClick={() => setEditing('new')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-bordeaux hover:bg-bordeaux-dark"
            >
              <Plus size={16} /> Nuovo bene
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca per nome, marca, modello, matricola, ubicazione o codice QR..."
            className="w-full pl-9 pr-3 py-2 rounded-md border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
        <select value={filterProperty} onChange={e => setFilterProperty(e.target.value)}
          className="px-3 py-2 rounded-md border border-stone-300 text-sm bg-white">
          <option value="all">Tutte le strutture</option>
          {properties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2 rounded-md border border-stone-300 text-sm bg-white">
          <option value="all">Tutte le categorie</option>
          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-md border border-stone-300 text-sm bg-white">
          <option value="all">Tutti gli stati</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="max-w-6xl mx-auto px-6 pb-12">
        {loading ? (
          <p className="text-stone-500 text-sm py-8 text-center">Caricamento registro...</p>
        ) : error ? (
          <p className="text-red-600 text-sm py-8 text-center">Errore: {error}</p>
        ) : filtered.length === 0 ? (
          <p className="text-stone-500 text-sm py-8 text-center">
            Nessun bene trovato. Aggiungine uno con &quot;Nuovo bene&quot;.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-100 text-left text-stone-500 text-xs uppercase tracking-wide">
                  <th className="px-3 py-3 w-8">
                    <input type="checkbox"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll} />
                  </th>
                  <th className="px-3 py-3">Bene</th>
                  <th className="px-3 py-3">Struttura</th>
                  <th className="px-3 py-3">Categoria</th>
                  <th className="px-3 py-3">Ubicazione</th>
                  <th className="px-3 py-3">Stato</th>
                  <th className="px-3 py-3">Prossima manutenzione</th>
                  <th className="px-3 py-3">QR</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => {
                  const Icon = ICONS[a.category_icon] || Wrench;
                  return (
                    <tr key={a.id} className="border-t border-stone-100 hover:bg-stone-50">
                      <td className="px-3 py-3">
                        <input type="checkbox" checked={selected.has(a.id)}
                          onChange={() => toggleSelect(a.id)} />
                      </td>
                      <td className="px-3 py-3">
                        <button onClick={() => setEditing(a)} className="text-left">
                          <div className="font-medium text-stone-800">{a.name}</div>
                          <div className="text-xs text-stone-400">
                            {[a.brand, a.model].filter(Boolean).join(' · ') || '—'}
                          </div>
                        </button>
                      </td>
                      <td className="px-3 py-3 text-stone-600">{a.property_name}</td>
                      <td className="px-3 py-3 text-stone-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Icon size={14} className="text-gold" />
                          {a.category_name || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-stone-600">{a.location || '—'}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[a.status]}`}>
                          {STATUS_LABELS[a.status]}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-stone-600">
                        {a.next_maintenance_date || '—'}
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1 text-xs font-mono text-stone-400">
                          <Tag size={12} /> {a.qr_code}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button onClick={() => deleteAsset(a.id)} className="text-stone-400 hover:text-red-500">
                          <X size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <AssetFormModal
          asset={editing === 'new' ? EMPTY_ASSET : editing}
          properties={properties}
          categories={categories}
          onClose={() => setEditing(null)}
          onSave={saveAsset}
        />
      )}
    </Layout>
  );
}

function AssetFormModal({ asset, properties, categories, onClose, onSave }) {
  const [form, setForm] = useState(asset);

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function submit(e) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-bordeaux">
            {asset.id ? 'Modifica bene' : 'Nuovo bene'}
          </h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-4 grid grid-cols-2 gap-4">
          <Field label="Nome / descrizione *" className="col-span-2">
            <input required value={form.name || ''} onChange={e => set('name', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Struttura *">
            <select required value={form.property_id || ''} onChange={e => set('property_id', e.target.value)} className={inputCls}>
              <option value="">Seleziona...</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Categoria">
            <select value={form.category_id || ''} onChange={e => set('category_id', e.target.value)} className={inputCls}>
              <option value="">Seleziona...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Marca">
            <input value={form.brand || ''} onChange={e => set('brand', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Modello">
            <input value={form.model || ''} onChange={e => set('model', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Matricola / S/N">
            <input value={form.serial_number || ''} onChange={e => set('serial_number', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Ubicazione">
            <input value={form.location || ''} onChange={e => set('location', e.target.value)} placeholder="es. Centrale termica, Piano 2..." className={inputCls} />
          </Field>
          <Field label="Data installazione">
            <input type="date" value={form.installation_date || ''} onChange={e => set('installation_date', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Scadenza garanzia">
            <input type="date" value={form.warranty_expiry || ''} onChange={e => set('warranty_expiry', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Stato">
            <select value={form.status || 'operativo'} onChange={e => set('status', e.target.value)} className={inputCls}>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Prossima manutenzione">
            <input type="date" value={form.next_maintenance_date || ''} onChange={e => set('next_maintenance_date', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Note" className="col-span-2">
            <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={3} className={inputCls} />
          </Field>

          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-stone-300 text-sm font-medium text-stone-600">
              Annulla
            </button>
            <button type="submit" className="px-4 py-2 rounded-md text-sm font-medium text-white bg-bordeaux hover:bg-bordeaux-dark">
              Salva
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-md border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold";

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-medium text-stone-500 mb-1">{label}</span>
      {children}
    </label>
  );
}
