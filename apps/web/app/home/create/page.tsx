'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function CreateLinkPage() {
  const [title, setTitle] = useState('');
  const [studioName, setStudioName] = useState('');
  const [price, setPrice] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState(''); // ਕਵਰ ਫੋਟੋ (Direct Image)
  const [albumUrl, setAlbumUrl] = useState(''); // Google Drive ਐਲਬਮ ਲਿੰਕ
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('Please log in first');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('links').insert([
      {
        user_id: user.id,
        title,
        studio_name: studioName,
        price: parseFloat(price),
        watermark_url: previewImageUrl, // Preview image for watermark
        file_url: albumUrl, // Full Google Drive Album Link
        upi_id: upiId,
      },
    ]);

    if (error) {
      alert('Error creating link: ' + error.message);
    } else {
      alert('Album Link Created Successfully!');
      router.push('/home');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '520px', margin: '40px auto', padding: '25px', border: '1px solid #ccc', borderRadius: '10px', backgroundColor: '#fff' }}>
      <h2>Create Album Paywall Link</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Studio Name</label>
          <input
            type="text"
            value={studioName}
            onChange={(e) => setStudioName(e.target.value)}
            placeholder="e.g. SOHAL STUDIO PHARWAHI"
            required
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '5px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Album Title / Event</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Pre-Wedding HD Album (100 Photos)"
            required
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '5px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Price (₹)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 500"
            required
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '5px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>UPI ID (for payments)</label>
          <input
            type="text"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="e.g. 9988672153@paytm"
            required
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '5px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Cover / Sample Photo URL (For Watermark Preview)</label>
          <input
            type="url"
            value={previewImageUrl}
            onChange={(e) => setPreviewImageUrl(e.target.value)}
            placeholder="https://... (Direct image link / Unsplash / ImgBB)"
            required
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '5px', border: '1px solid #ccc' }}
          />
          <small style={{ color: '#666' }}>ਇੱਥੇ ਐਲਬਮ ਦੀ 1 ਕਵਰ ਫੋਟੋ ਦਾ ਡਾਇਰੈਕਟ ਇਮੇਜ ਲਿੰਕ ਪਾਓ ਜੋ ਵਾਟਰਮਾਰਕ ਨਾਲ ਦਿਖੇਗੀ।</small>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Full Album Link (Google Drive / Mega / Zip)</label>
          <input
            type="url"
            value={albumUrl}
            onChange={(e) => setAlbumUrl(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/..."
            required
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '5px', border: '1px solid #ccc' }}
          />
          <small style={{ color: '#666' }}>ਇਹ ਲਿੰਕ ਪੇਮੈਂਟ ਹੋਣ ਤੋਂ ਬਾਅਦ ਹੀ ਅਨਲੌਕ (Unlock) ਹੋਵੇਗਾ।</small>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px',
            backgroundColor: '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          {loading ? 'Creating Album Link...' : 'Create Album Link'}
        </button>
      </form>
    </div>
  );
}