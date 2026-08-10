'use client';

interface UpiQrCodeProps {
  upiId: string;
  name: string;
  amount: number;
}

export function UpiQrCode({ upiId, name, amount }: UpiQrCodeProps) {
  // UPI Deep Link Format
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
  
  // Free QR Code API
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUrl)}`;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 my-4 text-center">
      <p className="text-sm font-semibold text-gray-700 mb-2">
        Scan & Pay ₹{amount} with any UPI App
      </p>
      
      <div className="bg-white p-2 rounded-lg border border-gray-200">
        <img 
          src={qrImageUrl} 
          alt="UPI Payment QR Code" 
          className="w-48 h-48 object-contain"
        />
      </div>

      <div className="mt-3 flex gap-2">
        <a 
          href={upiUrl}
          className="inline-flex items-center gap-1 text-xs font-medium bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800 transition"
        >
          📱 Open PhonePe / GPay / Paytm
        </a>
      </div>
      
      <p className="text-[11px] text-gray-400 mt-2">
        UPI ID: <span className="font-mono text-gray-600">{upiId}</span>
      </p>
    </div>
  );
}