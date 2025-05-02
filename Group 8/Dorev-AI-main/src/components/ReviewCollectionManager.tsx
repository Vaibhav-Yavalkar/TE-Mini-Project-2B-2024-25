import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Copy, 
  Download, 
  Link, 
  Settings, 
  CheckCircle, 
  AlertTriangle,
  Loader,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface QRCodeSettings {
  businessName: string;
  google_place_id: string;
  discountCode: string;
  discountAmount: string;
  discountType: 'percentage' | 'fixed';
  logoUrl?: string;
  primaryColor: string;
  redirectToGoogle: boolean;
  sendEmailCoupon: boolean;
}

export default function ReviewCollectionManager() {
  const [settings, setSettings] = useState<QRCodeSettings>({
    businessName: '',
    google_place_id: '',
    discountCode: '',
    discountAmount: '10',
    discountType: 'percentage',
    primaryColor: '#3b82f6',
    redirectToGoogle: true,
    sendEmailCoupon: true
  });
  
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [reviewUrl, setReviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'settings' | 'preview'>('settings');
  const [generatingQR, setGeneratingQR] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Get settings from Supabase
      const { data, error } = await supabase
        .from('review_collection_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setSettings(data);
        
        // If we have a Google Place ID, generate the QR code
        if (data.google_place_id) {
          generateQRCode(data);
        }
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setErrorMessage('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaveStatus('saving');
      
      // Save settings to Supabase
      const { error } = await supabase
        .from('review_collection_settings')
        .upsert({
          id: 1, // Use a fixed ID for the single settings record
          ...settings,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      setSaveStatus('success');
      
      // Generate QR code with new settings
      generateQRCode(settings);
      
      // Reset status after a delay
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setSaveStatus('error');
      setErrorMessage('Failed to save settings');
    }
  };

  const generateQRCode = async (settingsData: QRCodeSettings) => {
    if (!settingsData.google_place_id) {
      setErrorMessage('Google Place ID is required to generate a QR code');
      return;
    }
    
    try {
      setGeneratingQR(true);
      
      // Create a review collection URL
      // In a real app, this would be a unique URL for your review form
      const baseUrl = window.location.origin;
      const reviewCollectionUrl = `${baseUrl}/review?bid=${encodeURIComponent(settingsData.businessName)}&pid=${encodeURIComponent(settingsData.google_place_id)}`;
      
      setReviewUrl(reviewCollectionUrl);
      
      // Generate QR code using a free QR code API
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(reviewCollectionUrl)}&size=200x200&color=${encodeURIComponent(settingsData.primaryColor.substring(1))}&bgcolor=FFFFFF`;
      
      setQrCodeUrl(qrApiUrl);
    } catch (err) {
      console.error('Error generating QR code:', err);
      setErrorMessage('Failed to generate QR code');
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setSettings(prev => ({ ...prev, [name]: checked }));
    } else {
      setSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${settings.businessName.replace(/\s+/g, '-').toLowerCase()}-review-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyReviewUrl = () => {
    if (!reviewUrl) return;
    
    navigator.clipboard.writeText(reviewUrl)
      .then(() => {
        alert('Review URL copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy URL:', err);
      });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-4 px-6 font-medium text-sm border-b-2 ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Settings
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-4 px-6 font-medium text-sm border-b-2 ${
              activeTab === 'preview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <QrCode className="w-4 h-4 inline mr-2" />
            QR Code Preview
          </button>
        </nav>
      </div>

      <div className="p-6">
        {saveStatus === 'error' && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            <p className="ml-3 text-red-700">{errorMessage}</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Review Collection Settings</h2>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                  Business Name
                </label>
                <input
                  type="text"
                  id="businessName"
                  name="businessName"
                  value={settings.businessName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Your Business Name"
                />
              </div>

              <div>
                <label htmlFor="google_place_id" className="block text-sm font-medium text-gray-700">
                  Google Place ID
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    id="google_place_id"
                    name="google_place_id"
                    value={settings.google_place_id}
                    onChange={handleInputChange}
                    className="block w-full flex-1 rounded-none rounded-l-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
                  />
                  <a
                    href="https://developers.google.com/maps/documentation/places/web-service/place-id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500 hover:bg-gray-100"
                  >
                    Find ID
                  </a>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Find your Google Place ID using the Google Maps Platform tool
                </p>
              </div>

              <div>
                <label htmlFor="discountCode" className="block text-sm font-medium text-gray-700">
                  Discount Code
                </label>
                <input
                  type="text"
                  id="discountCode"
                  name="discountCode"
                  value={settings.discountCode}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="THANKYOU10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="discountAmount" className="block text-sm font-medium text-gray-700">
                    Discount Amount
                  </label>
                  <input
                    type="text"
                    id="discountAmount"
                    name="discountAmount"
                    value={settings.discountAmount}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="10"
                  />
                </div>

                <div>
                  <label htmlFor="discountType" className="block text-sm font-medium text-gray-700">
                    Discount Type
                  </label>
                  <select
                    id="discountType"
                    name="discountType"
                    value={settings.discountType}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700">
                  Primary Color
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="color"
                    id="primaryColor"
                    name="primaryColor"
                    value={settings.primaryColor}
                    onChange={handleInputChange}
                    className="h-10 w-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={handleInputChange}
                    name="primaryColor"
                    className="ml-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <input
                      id="redirectToGoogle"
                      name="redirectToGoogle"
                      type="checkbox"
                      checked={settings.redirectToGoogle}
                      onChange={(e) => handleInputChange({
                        ...e,
                        target: {
                          ...e.target,
                          name: 'redirectToGoogle',
                          value: e.target.checked ? 'true' : 'false'
                        }
                      })}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="redirectToGoogle" className="ml-2 block text-sm text-gray-700">
                      Redirect to Google Review after form submission
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="sendEmailCoupon"
                      name="sendEmailCoupon"
                      type="checkbox"
                      checked={settings.sendEmailCoupon}
                      onChange={(e) => handleInputChange({
                        ...e,
                        target: {
                          ...e.target,
                          name: 'sendEmailCoupon',
                          value: e.target.checked ? 'true' : 'false'
                        }
                      })}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="sendEmailCoupon" className="ml-2 block text-sm text-gray-700">
                      Send discount coupon via email
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={saveSettings}
                disabled={saveStatus === 'saving'}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
              >
                {saveStatus === 'saving' ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Saving...
                  </>
                ) : saveStatus === 'success' ? (
                  <>
                    <CheckCircle className="-ml-1 mr-2 h-4 w-4" />
                    Saved!
                  </>
                ) : (
                  'Save Settings'
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">QR Code Preview</h2>
            
            {!settings.google_place_id ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm font-medium">Google Place ID Required</p>
                    <p className="mt-1 text-sm">Please add your Google Place ID in the settings tab to generate a QR code.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                  {generatingQR ? (
                    <div className="flex flex-col items-center justify-center h-48 w-48">
                      <Loader className="w-8 h-8 animate-spin text-blue-600" />
                      <p className="mt-4 text-sm text-gray-500">Generating QR Code...</p>
                    </div>
                  ) : qrCodeUrl ? (
                    <div className="flex flex-col items-center">
                      <img 
                        src={qrCodeUrl} 
                        alt="Review QR Code" 
                        className="h-48 w-48 object-contain"
                      />
                      <p className="mt-4 text-sm text-gray-500">Scan to leave a review</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 w-48 border-2 border-dashed border-gray-300 rounded-lg">
                      <QrCode className="h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">No QR code generated</p>
                    </div>
                  )}
                  
                  <div className="mt-6 flex space-x-3">
                    <button
                      onClick={() => generateQRCode(settings)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <RefreshCw className="-ml-0.5 mr-2 h-4 w-4" />
                      Regenerate
                    </button>
                    
                    <button
                      onClick={downloadQRCode}
                      disabled={!qrCodeUrl}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                    >
                      <Download className="-ml-0.5 mr-2 h-4 w-4" />
                      Download
                    </button>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Review Collection URL</h3>
                    <div className="mt-2 flex rounded-md shadow-sm">
                      <input
                        type="text"
                        readOnly
                        value={reviewUrl}
                        className="block w-full flex-1 rounded-none rounded-l-md border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={copyReviewUrl}
                        className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Share this URL directly or use the QR code to collect reviews
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">How It Works</h3>
                    <div className="mt-2 space-y-4">
                      <div className="flex">
                        <div className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          1
                        </div>
                        <p className="ml-3 text-sm text-gray-500">
                          Customer scans the QR code or visits the review URL
                        </p>
                      </div>
                      <div className="flex">
                        <div className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          2
                        </div>
                        <p className="ml-3 text-sm text-gray-500">
                          They fill out the review form with rating and feedback
                        </p>
                      </div>
                      <div className="flex">
                        <div className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          3
                        </div>
                        <p className="ml-3 text-sm text-gray-500">
                          After submission, they're redirected to Google with pre-filled review
                        </p>
                      </div>
                      <div className="flex">
                        <div className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          4
                        </div>
                        <p className="ml-3 text-sm text-gray-500">
                          They receive a discount coupon via email as a thank you
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <CheckCircle className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Pro Tip</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>
                            Print your QR code and place it on receipts, at checkout, or on tables to encourage customers to leave reviews.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}