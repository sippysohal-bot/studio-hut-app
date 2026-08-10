'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { UpiQrCode } from '~/components/upi-qr-code';

interface LockLink {
  id: string;
  title: string;
  studio_name: string;
  price: number;
  watermark_url: string;
  file_url: string;
  upi_id: string;
}

export default function PublicUnlockPage() {
  const params = useParams();
  const id = params?.id as string;

  const [linkData, setLinkData] = useState<LockLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'pending' | 'approved'>('idle');
  const [utr, setUtr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key-for-build';

  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
  useEffect(() => {
    if (!id) return;

    async function fetchLink() {
      setLoading(true);
      
      // 1. Fetch Link Details
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching link:', error);
      } else if (data) {
        setLinkData(data);
      }

      // 2. Check if user already submitted UTR in this session
      const savedUtr = localStorage.getItem(`utr_${id}`);
      if (savedUtr) {
        const { data: reqData } = await supabase
          .from('payment_requests')
          .select('status')
          .eq('link_id', id)
          .eq('utr_number', savedUtr)
          .single();

        if (reqData) {
          setStatus(reqData.status as 'pending' | 'approved');
        }
      }

      setLoading(false);
    }

    fetchLink();
  }, [id]);

  // Handle UTR Submit
  const handleSubmitUTR = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!utr || utr.length < 10) {
      alert('ਕਿਰਪਾ ਕਰਕੇ ਸਹੀ 12-digit UTR/Ref ਨੰਬਰ ਭਰੋ।');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from('payment_requests').insert([
      {
        link_id: id,
        utr_number: utr,
        status: 'pending',
      },
    ]);

    if (error) {
      console.error('Error submitting UTR:', error);
      alert('UTR Submit ਕਰਨ ਵਿੱਚ Error ਆਇਆ: ' + error.message);
    } else {
      // Save UTR locally to maintain state on refresh
      localStorage.setItem(`utr_${id}`, utr);
      setStatus('pending');
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium">Loading details...</p>
      </div>
    );
  }

  if (!linkData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-red-500 font-semibold">Link not found or expired.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <h2 className="text-sm font-bold tracking-widest text-indigo-600 uppercase">
            {linkData.studio_name || 'Studio Hut'}
          </h2>
          <h1 className="text-2xl font-extrabold text-gray-900 mt-1">
            {linkData.title}
          </h1>
        </div>

        {/* STATUS 1: APPROVED - Unlock & Show File */}
        {status === 'approved' ? (
          <div className="text-center bg-green-50 p-6 rounded-xl border border-green-200">
            <span className="text-4xl">🎉</span>
            <h3 className="text-xl font-bold text-green-800 mt-2">
              Payment Verified!
            </h3>
            <p className="text-sm text-green-600 mt-1 mb-4">
              ਤੁਹਾਡੀ ਪੇਮੈਂਟ ਵੈਰੀਫਾਈ ਹੋ ਗਈ ਹੈ। ਆਪਣੀ ਫਾਈਲ ਡਾਊਨਲੋਡ ਕਰੋ।
            </p>
            <a
              href={linkData.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition shadow-md"
            >
              Download Original High-Res File
            </a>
          </div>
        ) : status === 'pending' ? (
          /* STATUS 2: PENDING - Payment Under Verification */
          <div className="text-center bg-amber-50 p-6 rounded-xl border border-amber-200">
            <div className="animate-spin text-3xl mb-2">⏳</div>
            <h3 className="text-lg font-bold text-amber-800">
              Payment Under Verification
            </h3>
            <p className="text-xs text-amber-700 mt-2 leading-relaxed">
              ਤੁਹਾਡਾ UTR ਸਬਮਿਟ ਹੋ ਗਿਆ ਹੈ। ਸਟੂਡੀਓ ਵੱਲੋਂ ਵੈਰੀਫਾਈ ਹੁੰਦੇ ਹੀ ਤੁਹਾਡੀ ਫਾਈਲ ਆਟੋ-ਅਨਲੌਕ ਹੋ ਜਾਵੇਗੀ।
            </p>
            <p className="text-[11px] text-amber-500 mt-3 font-mono">
              Status: PENDING
            </p>
          </div>
        ) : (
          /* STATUS 3: IDLE - Show QR Code & Submit Form */
          <div>
            {/* Dynamic QR Code */}
            <UpiQrCode
              upiId={linkData.upi_id || "narindersohal9988672153@okicici"}
              name={linkData.studio_name || "Studio Hut"}
              amount={linkData.price || 0}
            />

            {/* UTR Form */}
            <form onSubmit={handleSubmitUTR} className="mt-6 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  ENTER 12-DIGIT UPI UTR / TRANSACTION NO.
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 423456789012"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl text-sm transition shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit UTR for Verification'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}