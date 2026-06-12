import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Printer } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout';

const BASE_URL = import.meta.env.VITE_APP_BASE_URL || window.location.origin;

export default function QRLabelSheet() {
  const [params] = useSearchParams();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = (params.get('ids') || '').split(',').filter(Boolean);
    if (ids.length === 0) { setLoading(false); return; }
    supabase
      .from('assets_overview')
      .select('id, name, qr_code, property_name, category_name, location')
      .in('id', ids)
      .then(({ data }) => {
        setAssets(data || []);
        setLoading(false);
      });
  }, [params]);

  return (
    <Layout>
      {/* Barra azioni - non stampata */}
      <div className="print:hidden border-b border-stone-200 bg-white px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to="/attrezzature" className="text-stone-400 hover:text-stone-600">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-semibold text-bordeaux">
            Etichette QR &middot; {assets.length} beni
          </h1>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-bordeaux hover:bg-bordeaux-dark"
        >
          <Printer size={16} /> Stampa
        </button>
      </div>

      <p className="print:hidden px-6 py-3 text-sm text-stone-500 max-w-2xl">
        Fogli adesivi: 3 colonne &times; righe automatiche. Per etichette pre-tagliate
        (es. formato A4 65mm&times;38mm), adatta i valori di <code>grid-template-columns</code>
        e <code>padding</code> nel CSS qui sotto in base al modello in uso.
      </p>

      {loading ? (
        <p className="px-6 text-sm text-stone-500">Caricamento etichette...</p>
      ) : (
        <div className="label-grid p-6">
          {assets.map(a => (
            <div key={a.id} className="label-card">
              <QRCodeSVG value={`${BASE_URL}/asset/${a.qr_code}`} size={88} level="M" />
              <div className="label-text">
                <p className="label-name">{a.name}</p>
                <p className="label-meta">{a.property_name}</p>
                {a.location && <p className="label-meta">{a.location}</p>}
                <p className="label-code">{a.qr_code}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .label-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8mm;
        }
        .label-card {
          border: 1px dashed #d6d3d1;
          border-radius: 6px;
          padding: 6mm;
          display: flex;
          align-items: center;
          gap: 4mm;
          break-inside: avoid;
        }
        .label-text { min-width: 0; }
        .label-name {
          font-size: 11px;
          font-weight: 600;
          color: #5B2B47;
          line-height: 1.2;
          word-break: break-word;
        }
        .label-meta {
          font-size: 9px;
          color: #78716c;
          line-height: 1.3;
        }
        .label-code {
          font-size: 9px;
          font-family: monospace;
          color: #a8a29e;
          margin-top: 2px;
        }
        @media print {
          .label-card { border: 1px solid #e7e5e4; }
          @page { margin: 10mm; }
        }
      `}</style>
    </Layout>
  );
}
