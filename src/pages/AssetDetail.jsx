import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  AlertTriangle, Wrench, CheckCircle2, Calendar, MapPin, Tag, ShieldCheck, LogIn
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

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

const TYPE_LABELS = {
  ordinaria: 'Manutenzione ordinaria',
  straordinaria: 'Manutenzione straordinaria',
  guasto: 'Guasto segnalato',
  controllo: 'Controllo / verifica',
};

export default function AssetDetail() {
  const { code } = useParams();
  const { session } = useAuth();
  const [asset, setAsset] = useState(null);
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => { load(); }, [code, session]);

  async function load() {
    setLoading(true);
    setError(null);

    const { data: assetData, error: assetError } = await supabase
      .from('assets_overview')
      .select('*')
      .eq('qr_code', code)
      .maybeSingle();

    if (assetError) { setError(assetError.message); setLoading(false); return; }
    if (!assetData) { setError('Nessun bene trovato per questo codice QR.'); setLoading(false); return; }
    setAsset(assetData);

    if (session) {
      const { data: logData } = await supabase
        .from('asset_maintenance_log')
        .select('*')
        .eq('asset_id', assetData.id)
        .order('date', { ascending: false });
      setLog(logData || []);
    }
    setLoading(false);
  }

  async function submitEntry({ type, description, performed_by }) {
    const { error: insertError } = await supabase.from('asset_maintenance_log').insert({
      asset_id: asset.id, type, description, performed_by,
    });
    if (insertError) { alert('Errore: ' + insertError.message); return; }

    // Se l'utente è autenticato, aggiorna anche stato/date dell'asset
    if (session) {
      const updates = {};
      if (type === 'guasto') updates.status = 'guasto';
      if (['ordinaria', 'straordinaria', 'controllo'].includes(type)) {
        updates.last_maintenance_date = new Date().toISOString().slice(0, 10);
        if (asset.status === 'guasto' || asset.status === 'in_manutenzione') updates.status = 'operativo';
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from('assets').update(updates).eq('id', asset.id);
      }
    }

    setShowReport(false);
    if (!session) setConfirmation('Segnalazione inviata. Lo staff è stato avvisato, grazie!');
    load();
  }

  if (loading) return <CenteredMessage text="Caricamento scheda bene..." />;
  if (error) return <CenteredMessage text={error} isError />;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-400 uppercase tracking-wide">{asset.property_name}</p>
            <h1 className="text-xl font-semibold text-bordeaux">{asset.name}</h1>
          </div>
          {session ? (
            <Link to="/attrezzature" className="text-sm text-stone-400 hover:text-stone-600">
              Registro &rarr;
            </Link>
          ) : (
            <Link to="/login" className="flex items-center gap-1 text-sm text-stone-400 hover:text-stone-600">
              <LogIn size={14} /> Staff
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {confirmation && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3">
            {confirmation}
          </div>
        )}

        {/* Stato e azioni rapide */}
        <div className="bg-white rounded-lg border border-stone-200 p-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-stone-400 mb-1">Stato attuale</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${STATUS_STYLES[asset.status]}`}>
              {STATUS_LABELS[asset.status]}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowReport('guasto')}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              <AlertTriangle size={16} /> Segnala guasto
            </button>
            {session && (
              <button
                onClick={() => setShowReport('ordinaria')}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-white bg-bordeaux hover:bg-bordeaux-dark"
              >
                <Wrench size={16} /> Registra intervento
              </button>
            )}
          </div>
        </div>

        {/* Dati identificativi */}
        <div className="bg-white rounded-lg border border-stone-200 p-5">
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Dati identificativi</h2>
          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <Info icon={Tag} label="Categoria" value={asset.category_name} />
            <Info icon={MapPin} label="Ubicazione" value={asset.location} />
            {session && (
              <>
                <Info icon={ShieldCheck} label="Marca / Modello" value={[asset.brand, asset.model].filter(Boolean).join(' ')} />
                <Info icon={Tag} label="Matricola" value={asset.serial_number} />
                <Info icon={Calendar} label="Prossima manutenzione" value={asset.next_maintenance_date} />
              </>
            )}
            <Info icon={Tag} label="Codice QR" value={asset.qr_code} mono />
          </dl>
        </div>

        {/* Storico interventi - solo staff */}
        {session && (
          <div className="bg-white rounded-lg border border-stone-200 p-5">
            <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Storico interventi</h2>
            {log.length === 0 ? (
              <p className="text-sm text-stone-400">Nessun intervento registrato.</p>
            ) : (
              <ul className="space-y-3">
                {log.map(entry => (
                  <li key={entry.id} className="flex gap-3 text-sm">
                    <div className="mt-0.5">
                      {entry.type === 'guasto'
                        ? <AlertTriangle size={16} className="text-red-500" />
                        : <CheckCircle2 size={16} className="text-gold" />}
                    </div>
                    <div>
                      <p className="font-medium text-stone-700">
                        {TYPE_LABELS[entry.type]} &middot; {entry.date}
                      </p>
                      <p className="text-stone-500">{entry.description}</p>
                      {entry.performed_by && (
                        <p className="text-xs text-stone-400 mt-0.5">A cura di: {entry.performed_by}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>

      {showReport && (
        <ReportModal
          defaultType={showReport === 'guasto' ? 'guasto' : 'ordinaria'}
          allowAllTypes={!!session}
          onClose={() => setShowReport(false)}
          onSubmit={submitEntry}
        />
      )}
    </div>
  );
}

function Info({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="mt-0.5 text-stone-400" />
      <div>
        <p className="text-xs text-stone-400">{label}</p>
        <p className={`text-stone-700 ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
      </div>
    </div>
  );
}

function ReportModal({ defaultType, allowAllTypes, onClose, onSubmit }) {
  const [type, setType] = useState(defaultType);
  const [description, setDescription] = useState('');
  const [performedBy, setPerformedBy] = useState('');

  function submit(e) {
    e.preventDefault();
    onSubmit({ type, description, performed_by: performedBy });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-stone-200">
          <h2 className="text-lg font-semibold text-bordeaux">
            {defaultType === 'guasto' ? 'Segnala un guasto' : 'Registra un intervento'}
          </h2>
        </div>
        <form onSubmit={submit} className="px-6 py-4 space-y-4">
          {allowAllTypes && (
            <label className="block">
              <span className="block text-xs font-medium text-stone-500 mb-1">Tipo</span>
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-stone-300 text-sm">
                <option value="guasto">Guasto</option>
                <option value="ordinaria">Manutenzione ordinaria</option>
                <option value="straordinaria">Manutenzione straordinaria</option>
                <option value="controllo">Controllo / verifica</option>
              </select>
            </label>
          )}
          <label className="block">
            <span className="block text-xs font-medium text-stone-500 mb-1">Descrizione *</span>
            <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="Descrivi il problema o l'intervento effettuato..."
              className="w-full px-3 py-2 rounded-md border border-stone-300 text-sm" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-stone-500 mb-1">Segnalato/eseguito da</span>
            <input value={performedBy} onChange={e => setPerformedBy(e.target.value)}
              placeholder="Nome (opzionale)"
              className="w-full px-3 py-2 rounded-md border border-stone-300 text-sm" />
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-stone-300 text-sm font-medium text-stone-600">
              Annulla
            </button>
            <button type="submit" className="px-4 py-2 rounded-md text-sm font-medium text-white bg-bordeaux hover:bg-bordeaux-dark">
              Invia
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CenteredMessage({ text, isError }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-6 text-center">
      <p className={`text-sm ${isError ? 'text-red-600' : 'text-stone-500'}`}>{text}</p>
    </div>
  );
}
