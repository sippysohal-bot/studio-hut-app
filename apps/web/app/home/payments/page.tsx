'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface PaymentRequest {
  id: string;
  utr_number: string;
  status: string;
  created_at: string;
  links: {
    title: string;
    price: number;
  };
}

export default function PaymentsPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ ਨਵਾਂ code:
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key-for-build';

const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
  const fetchPaymentRequests = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // ਆਪਣੇ ਬਣਾਏ ਹੋਏ ਲਿੰਕਾਂ ਦੀਆਂ ਆਈਆਂ ਪੇਮੈਂਟ ਰਿਕੁਐਸਟਾਂ ਫੈਚ ਕਰਨਾ
    const { data, error } = await supabase
      .from('payment_requests')
      .select(`
        id,
        utr_number,
        status,
        created_at,
        links!inner (
          title,
          price,
          user_id
        )
      `)
      .eq('links.user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequests(data as unknown as PaymentRequest[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPaymentRequests();
  }, []);

  // ਪੇਮੈਂਟ Approve / Reject ਕਰਨ ਦਾ ਫੰਕਸ਼ਨ
  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('payment_requests')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert(`Payment ${newStatus} successfully!`);
      fetchPaymentRequests(); // Refresh table
    }
  };

  if (loading) return <div style={{ padding: '30px', textAlign: 'center' }}>Loading payment requests...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
      <h2>💳 Payment Approvals</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}> Verify UTR from your GPay/Paytm app and approve access.</p>

      {requests.length === 0 ? (
        <div style={{ padding: '30px', background: '#f9f9f9', borderRadius: '8px', textAlign: 'center' }}>
          No pending payment requests yet.
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '12px' }}>Album Title</th>
              <th style={{ padding: '12px' }}>Amount</th>
              <th style={{ padding: '12px' }}>UTR Number</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{req.links?.title}</td>
                <td style={{ padding: '12px', color: '#0070f3', fontWeight: 'bold' }}>₹{req.links?.price}</td>
                <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '15px' }}>{req.utr_number}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: req.status === 'approved' ? '#dcfce7' : req.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                    color: req.status === 'approved' ? '#166534' : req.status === 'rejected' ? '#991b1b' : '#92400e'
                  }}>
                    {req.status.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  {req.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'approved')}
                        style={{ padding: '6px 12px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'rejected')}
                        style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span style={{ color: '#888', fontSize: '13px' }}>Completed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}