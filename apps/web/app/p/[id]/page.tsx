'use client';

import { Suspense, useEffect, useState } from 'react';
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

function UnlockContent() {
  const params = useParams();
  const id = params?.id as string;

  const [linkData, setLinkData] = useState<LockLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'pending' | 'approved'>('idle');
  const [utr, setUtr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [supabase] = useState(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key-for-build';
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  });

  useEffect(() => {
    if (!id) return;

    async function fetchLink() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('links')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching link:', error);
        } else if (data) {
          setLinkData(data as LockLink);
        }
      } catch (err) {
        console.error('Fetch link error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLink();
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading details...</p>
      </div>
    );
  }

  if (!linkData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">Link not found or invalid.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-2 text-2xl font-bold">{linkData.title}</h1>
      <p className="mb-4 text-gray-600">By {linkData.studio_name}</p>

      {linkData.watermark_url && (
        <div className="mb-6 overflow-hidden rounded-lg border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={linkData.watermark_url}
            alt="Preview"
            className="w-full object-cover"
          />
        </div>
      )}

      <div className="mb-6 rounded-lg bg-gray-50 p-4 border">
        <p className="text-lg font-semibold text-gray-800">
          Price: ₹{linkData.price}
        </p>
      </div>

      {linkData.upi_id && (
        <div className="mb-6 flex flex-col items-center justify-center rounded-lg border p-4 bg-white">
          <p className="mb-2 font-medium">Scan QR to Pay:</p>
          <UpiQrCode upiId={linkData.upi_id} amount={linkData.price} />
        </div>
      )}

      {status === 'approved' ? (
        <div className="rounded-lg bg-green-50 p-4 border border-green-200">
          <p className="mb-2 font-bold text-green-800">Payment Approved!</p>
          <a
            href={linkData.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
          >
            Download Album / File
          </a>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitting(true);
            // UTR submit logic goes here
            setStatus('pending');
            setSubmitting(false);
          }}
          className="space-y-4 rounded-lg border p-4"
        >
          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              Enter Payment UTR / Transaction ID:
            </span>
            <input
              type="text"
              required
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none"
              placeholder="e.g. 123456789012"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit UTR for Verification'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function PublicUnlockPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-gray-500">Loading...</div>}>
      <UnlockContent />
    </Suspense>
  );
}