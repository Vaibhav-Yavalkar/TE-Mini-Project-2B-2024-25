import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Upload, Download } from 'lucide-react';

interface QRCodeData {
  id: string;
  name: string;
  url: string;
  scans_count: number;
  created_at: string;
  business_logo?: string;
  background_color?: string;
}

export default function QRCodeGenerator() {
  const [qrName, setQrName] = useState('');
  const [businessLogo, setBusinessLogo] = useState<string>('');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [generatedQRs, setGeneratedQRs] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedQR, setSelectedQR] = useState<QRCodeData | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Base URL for customer review form
  const reviewBaseUrl = `${window.location.origin}/review`;

  useEffect(() => {
    loadExistingQRCodes();
  }, []);

  useEffect(() => {
    // Update preview URL whenever QR name changes
    if (qrName.trim()) {
      setPreviewUrl(`${reviewBaseUrl}?qr=${encodeURIComponent(qrName.trim())}`);
    }
  }, [qrName, reviewBaseUrl]);

  const loadExistingQRCodes = () => {
    const storedQRs = JSON.parse(localStorage.getItem('qr_codes') || '[]');
    setGeneratedQRs(storedQRs);
    if (storedQRs.length > 0) {
      setSelectedQR(storedQRs[0]);
      setPreviewUrl(storedQRs[0].url);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBusinessLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateQR = async () => {
    if (!qrName.trim()) {
      setError('Please enter a QR code name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const qrUrl = `${reviewBaseUrl}?qr=${encodeURIComponent(qrName)}`;

      const newQRCode: QRCodeData = {
        id: Math.random().toString(36).substr(2, 9),
        name: qrName.trim(),
        url: qrUrl,
        scans_count: 0,
        created_at: new Date().toISOString(),
        business_logo: businessLogo,
        background_color: backgroundColor
      };

      const updatedQRs = [newQRCode, ...generatedQRs];
      localStorage.setItem('qr_codes', JSON.stringify(updatedQRs));
      
      setGeneratedQRs(updatedQRs);
      setSelectedQR(newQRCode);
      setPreviewUrl(qrUrl);
      setError(null);
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError('Failed to generate QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    try {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) throw new Error('QR code canvas not found');

      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${qrName || 'qr-code'}.png`;
      link.href = url;
      link.click();
    } catch (err) {
      console.error('Error downloading QR code:', err);
      setError('Failed to download QR code');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">QR Code Management</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column - Settings */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">QR Code Settings</h2>
            
            {/* QR Name Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                QR Code Name
              </label>
              <input
                type="text"
                value={qrName}
                onChange={(e) => setQrName(e.target.value)}
                placeholder="Enter QR code name"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Business Logo */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Logo
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                          <span>Upload a file</span>
                          <input
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleLogoUpload}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
                    </div>
                  </div>
                </div>
                {businessLogo && (
                  <img src={businessLogo} alt="Logo preview" className="h-20 w-20 object-contain" />
                )}
              </div>
            </div>

            {/* Background Color */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background Color
              </label>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="h-10 w-full rounded-md border-gray-300"
              />
            </div>

            {/* Save Settings Button */}
            <button
              onClick={generateQR}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Generate QR Code
            </button>
          </div>

          {/* Google Business Integration */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Google Business Integration</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value="ChIJc-c8_Kq_5zsRyGqIuKb201A"
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-md bg-gray-50"
                />
                <button className="px-4 py-2 text-blue-600 hover:text-blue-800">
                  Save
                </button>
              </div>
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm text-blue-800">
                  About Google Place ID Integration
                </p>
                <ul className="mt-2 text-sm text-blue-600 list-disc list-inside">
                  <li>Direct submission of 4-5 star reviews to Google</li>
                  <li>Automatic review sync with Google My Business</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Preview & Download */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Preview & Download</h2>
            <button
              onClick={downloadQR}
              className="p-2 text-gray-600 hover:text-gray-800"
              disabled={!previewUrl}
            >
              <Download className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col items-center">
            {previewUrl && (
              <div className="bg-white p-8 rounded-lg shadow-sm">
                <QRCodeCanvas
                  value={previewUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                  imageSettings={businessLogo ? {
                    src: businessLogo,
                    height: 40,
                    width: 40,
                    excavate: true,
                  } : undefined}
                  bgColor={backgroundColor}
                />
              </div>
            )}
            {previewUrl && (
              <p className="mt-4 text-sm text-gray-500 text-center">
                Scan to view the review collection page
                <br />
                <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                  {previewUrl}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 