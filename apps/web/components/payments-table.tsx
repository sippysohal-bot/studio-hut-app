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

export function PaymentsTable() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchPaymentRequests = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

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

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('payment_requests')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert(`Payment ${newStatus} successfully!`);
      fetchPaymentRequests();
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading payment requests...</div>;

  return (
    <div style={{ marginTop: '20px', padding: '20px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold' }}>💳 Recent Payment Requests</h3>
      <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px 0' }}>Verify UTR numbers from your UPI app and approve client album downloads.</p>

      {requests.length === 0 ? (
        <div style={{ padding: '25px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
          No pending payment requests yet.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '10px 12px' }}>Album Title</th>
                <th style={{ padding: '10px 12px' }}>Amount</th>
                <th style={{ padding: '10px 12px' }}>UTR Number</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: '600' }}>{req.links?.title}</td>
                  <td style={{ padding: '12px', color: '#0070f3', fontWeight: 'bold' }}>₹{req.links?.price}</td>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '14px', letterSpacing: '0.5px' }}>{req.utr_number}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      backgroundColor: req.status === 'approved' ? '#dcfce7' : req.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                      color: req.status === 'approved' ? '#166534' : req.status === 'rejected' ? '#991b1b' : '#92400e'
                    }}>
                      {req.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {req.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'approved')}
                          style={{ padding: '5px 10px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'rejected')}
                          style={{ padding: '5px 10px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '12px' }}>Done</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}