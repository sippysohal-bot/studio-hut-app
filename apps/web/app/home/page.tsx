'use client';
import AdSense from './_components/AdSense';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';


interface PaymentRequest {
  id: string;
  link_id: string;
  utr_number: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  client_name?: string;
  client_phone?: string;
  links?: {
    title: string;
    studio_name: string;
    price: number;
  };
}

export default function StudioDashboardPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRightAd, setShowRightAd] = useState(true);

  // --- Form States ---
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [upiId, setUpiId] = useState('');
  const [unlockUrl, setUnlockUrl] = useState('');
  const [studioName, setStudioName] = useState('');
  const [createdLinkUrl, setCreatedLinkUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Track name & phone inputs inside dashboard table
  const [nameInputs, setNameInputs] = useState<Record<string, string>>({});
  const [phoneInputs, setPhoneInputs] = useState<Record<string, string>>({});

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key-for-build';

const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);;

  // Auto-load saved Studio Name from LocalStorage
  useEffect(() => {
    const savedStudio = localStorage.getItem('saved_studio_name');
    if (savedStudio) {
      setStudioName(savedStudio);
    }
  }, []);

  // 1. Fetch Requests & Links
  const fetchRequests = async () => {
    setLoading(true);

    const { data: payments, error: payError } = await supabase
      .from('payment_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (payError || !payments) {
      console.error('Error fetching payments:', payError);
      setRequests([]);
      setLoading(false);
      return;
    }

    const linkIds = [...new Set(payments.map((p) => p.link_id))].filter(Boolean);
    let linksMap: Record<string, any> = {};

    if (linkIds.length > 0) {
      const { data: linksData } = await supabase
        .from('links')
        .select('id, title, studio_name, price')
        .in('id', linkIds);

      if (linksData) {
        linksMap = linksData.reduce((acc, item) => {
          acc[item.id] = item;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    const combinedData = payments.map((p) => ({
      ...p,
      links: linksMap[p.link_id] || {
        title: 'Standard Link',
        studio_name: studioName || 'Studio',
        price: 0,
      },
    }));

    // Initialize name & phone input states
    const initialNames: Record<string, string> = {};
    const initialPhones: Record<string, string> = {};
    combinedData.forEach((item) => {
      if (item.client_name) initialNames[item.id] = item.client_name;
      if (item.client_phone) initialPhones[item.id] = item.client_phone;
    });
    setNameInputs(initialNames);
    setPhoneInputs(initialPhones);

    setRequests(combinedData as PaymentRequest[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // 2. Create Link Action
  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !upiId || !unlockUrl || !studioName) {
      alert('ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਸਟੂਡੀਓ ਦੇ ਨਾਮ (Studio Name) ਸਮੇਤ ਸਾਰੀਆਂ ਡੀਟੇਲਾਂ ਭਰੋ!');
      return;
    }

    // Save Photographer's Studio Name locally for convenience
    localStorage.setItem('saved_studio_name', studioName);

    setIsCreating(true);

    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData?.user;

    const payload: Record<string, any> = {
      title,
      price: Number(price),
      upi_id: upiId,
      unlock_url: unlockUrl,
      file_url: unlockUrl,
      studio_name: studioName, // Customer will see this studio name
    };

    if (currentUser?.id) {
      payload.user_id = currentUser.id;
    }

    const { data, error } = await supabase
      .from('links')
      .insert([payload])
      .select()
      .single();

    setIsCreating(false);

    if (error) {
      console.error('Insert error details:', error);
      alert('Error: ' + error.message + (error.details ? ` (${error.details})` : ''));
    } else if (data) {
      const generatedUrl = `${window.location.origin}/p/${data.id}`;
      setCreatedLinkUrl(generatedUrl);
      setTitle('');
      setPrice('');
      setUnlockUrl('');
      alert('🎉 ਲਿੰਕ ਸਫਲਤਾਪੂਰਵਕ ਬਣ ਗਿਆ ਹੈ!');
    }
  };

  // 3. WhatsApp Notification Trigger
  const sendWhatsAppNotification = async (
    reqId: string,
    phone: string,
    name: string,
    linkId: string,
    sName: string,
    albumTitle: string
  ) => {
    if (!phone || phone.trim() === '') {
      alert('ਕਿਰਪਾ ਕਰਕੇ ਪਹਿਲਾਂ WhatsApp ਨੰਬਰ ਦਾਖਲ ਕਰੋ!');
      return;
    }

    await supabase
      .from('payment_requests')
      .update({
        client_name: name,
        client_phone: phone,
      })
      .eq('id', reqId);

    const greeting = name ? `ਹੈਲੋ ${name}!` : 'ਹੈਲੋ!';
    const finalUnlockUrl = `${window.location.origin}/p/${linkId}`;
    const message = `${greeting} 📸\n\nਤੁਹਾਡੀ ਪੇਮੈਂਟ **${sName}** ਵੱਲੋਂ ਵੈਰੀਫਾਈ ਹੋ ਗਈ ਹੈ (${albumTitle})।\n\nਆਪਣੀ ਫਾਈਲ/ਐਲਬਮ ਡਾਊਨਲੋਡ ਕਰਨ ਲਈ ਹੇਠਾਂ ਦਿੱਤੇ ਲਿੰਕ 'ਤੇ ਕਲਿੱਕ ਕਰੋ:\n👇\n${finalUnlockUrl}\n\nਧੰਨਵਾਦ!`;

    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const whatsappUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank');
  };

  // 4. Approve Action
  const handleApprove = async (req: PaymentRequest) => {
    const currentName = nameInputs[req.id] || req.client_name || '';
    const currentPhone = phoneInputs[req.id] || req.client_phone || '';

    const { error } = await supabase
      .from('payment_requests')
      .update({
        status: 'approved',
        client_name: currentName,
        client_phone: currentPhone,
      })
      .eq('id', req.id);

    if (error) {
      alert('Error approving payment: ' + error.message);
      return;
    }

    alert('Payment Approved Successfully!');
    fetchRequests();

    if (currentPhone) {
      sendWhatsAppNotification(
        req.id,
        currentPhone,
        currentName,
        req.link_id,
        req.links?.studio_name || studioName || 'Studio',
        req.links?.title || 'Album'
      );
    }
  };

  // 5. Reject Action
  const handleReject = async (requestId: string) => {
    const { error } = await supabase
      .from('payment_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) {
      alert('Error rejecting payment: ' + error.message);
    } else {
      fetchRequests();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between relative">
      {/* MAIN DASHBOARD CONTENT */}
      <main className="max-w-7xl w-full mx-auto p-6 space-y-8 flex-1">
        {/* Header */}
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Studio Hut Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              Create payment links & approve client payments
            </p>
          </div>
          <button
            onClick={fetchRequests}
            className="px-4 py-2 text-xs font-semibold bg-white border rounded-lg shadow-sm hover:bg-gray-50 transition"
          >
            🔄 Refresh Requests
          </button>
        </header>

        {/* SECTION 1: CREATE NEW LINK FORM */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">🔗 Create New Payment Link</h2>
          <form onSubmit={handleCreateLink} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Album / File Title
              </label>
              <input
                type="text"
                placeholder="e.g., Aman Wedding Album"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Price (₹)
              </label>
              <input
                type="number"
                placeholder="e.g., 500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Your UPI ID (PayTM / GPay / PhonePe)
              </label>
              <input
                type="text"
                placeholder="e.g., 9988672153@paytm"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Your Studio Name (Shown to Customer)
              </label>
              <input
                type="text"
                placeholder="e.g., Sohal Studio Barnala"
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-indigo-900 bg-indigo-50/30"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Download Link (Google Drive / Mega Link)
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/..."
                value={unlockUrl}
                onChange={(e) => setUnlockUrl(e.target.value)}
                className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isCreating}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm transition"
              >
                {isCreating ? 'Creating Link...' : 'Generate Payment Link 🚀'}
              </button>
            </div>
          </form>

          {/* SHOW CREATED LINK */}
          {createdLinkUrl && (
            <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-indigo-900">ਤੁਹਾਡਾ ਲਿੰਕ ਤਿਆਰ ਹੈ:</p>
                <p className="text-sm font-mono text-indigo-700 break-all">{createdLinkUrl}</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(createdLinkUrl);
                  alert('ਲਿੰਕ ਕਾਪੀ ਹੋ ਗਿਆ!');
                }}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 transition"
              >
                Copy Link
              </button>
            </div>
          )}
        </div>

        {/* SECTION 2: PAYMENT REQUESTS TABLE */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="text-lg font-bold text-gray-800">📥 Incoming Payment Requests</h2>
          </div>

          {loading ? (
            <p className="text-center text-gray-500 p-6">Loading requests...</p>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              ਕੋਈ ਪੇਮੈਂਟ ਰਿਕੁਐਸਟ ਨਹੀਂ ਮਿਲੀ।
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase">
                  <th className="p-4">Album / Studio</th>
                  <th className="p-4">Client Name</th>
                  <th className="p-4">WhatsApp No.</th>
                  <th className="p-4">UTR Number</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <p className="font-semibold text-gray-800">
                        {req.links?.title || 'Untitled Album'}
                      </p>
                      <p className="text-xs text-gray-400 font-medium">
                        {req.links?.studio_name || studioName || 'Studio'}
                      </p>
                    </td>

                    <td className="p-4">
                      <input
                        type="text"
                        placeholder="Client Name"
                        value={nameInputs[req.id] ?? req.client_name ?? ''}
                        onChange={(e) =>
                          setNameInputs({
                            ...nameInputs,
                            [req.id]: e.target.value,
                          })
                        }
                        className="w-32 border rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>

                    <td className="p-4">
                      <input
                        type="text"
                        placeholder="e.g. 9876543210"
                        value={phoneInputs[req.id] ?? req.client_phone ?? ''}
                        onChange={(e) =>
                          setPhoneInputs({
                            ...phoneInputs,
                            [req.id]: e.target.value,
                          })
                        }
                        className="w-32 border rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                      />
                    </td>

                    <td className="p-4 font-mono font-bold text-indigo-600">
                      {req.utr_number}
                    </td>

                    <td className="p-4 font-semibold text-gray-700">
                      ₹{req.links?.price ?? 0}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          req.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : req.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {req.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {req.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(req)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
                          >
                            Approve & Send WA
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {req.status === 'approved' && (
                        <button
                          onClick={() =>
                            sendWhatsAppNotification(
                              req.id,
                              phoneInputs[req.id] ?? req.client_phone ?? '',
                              nameInputs[req.id] ?? req.client_name ?? '',
                              req.link_id,
                              req.links?.studio_name || studioName || 'Studio',
                              req.links?.title || 'Album'
                            )
                          }
                          className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                        >
                          📲 Send WA
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* ----------------- 1. RIGHT SIDE FLOATING AD ----------------- */}
     {/* ----------------- 1. RIGHT SIDE FLOATING AD ----------------- */}
      {showRightAd && (
        <aside
          aria-label="Advertisement"
          className="fixed bottom-6 right-6 z-[9999] w-[300px] bg-white p-3 rounded-xl shadow-2xl border border-gray-300"
        >
          <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Sponsored
            </span>
            <button
              onClick={() => setShowRightAd(false)}
              className="text-gray-400 hover:text-red-500 font-bold text-xs px-1.5 py-0.5 rounded transition"
              title="Close Ad"
            >
              ✕
            </button>
          </div>

          <div className="min-h-[250px] flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
            <AdSense adSlot="YOUR_RIGHT_AD_SLOT_ID" adFormat="rectangle" />
          </div>
        </aside>
      )}
      {/* ----------------- 2. FOOTER & FOOTER AD ----------------- */}
      <footer className="w-full mt-12 border-t border-gray-200 bg-white py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          {/* Footer Banner Ad */}
          <div className="w-full max-w-4xl text-center mb-6">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-2">
              Advertisement
            </span>
            <div className="min-h-[90px] flex items-center justify-center bg-gray-50 rounded-lg p-2">
              <AdSense adSlot="YOUR_FOOTER_AD_SLOT_ID" adFormat="auto" fullWidthResponsive={true} />
            </div>
          </div>

          {/* Footer Copyright */}
          <div className="text-xs text-gray-500 text-center border-t border-gray-100 pt-4 w-full">
            © {new Date().getFullYear()} Studio Hut. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}