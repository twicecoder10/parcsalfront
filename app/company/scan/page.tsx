'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { companyApi, Booking } from '@/lib/company-api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScanLine, X, CheckCircle2, AlertCircle, Loader2, Camera, Keyboard } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ScanPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBooking, setScannedBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);
  const router = useRouter();

  const scanElementId = 'qr-reader';

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current = null;
          })
          .catch(() => {
            scannerRef.current = null;
          });
      }
    };
  }, []);

  const handleScan = async (barcode: string) => {
    // Prevent multiple simultaneous scans
    if (loading || isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    setLoading(true);
    setError(null);
    setScannedBooking(null);

    try {
      const booking = await companyApi.scanBarcode(barcode);
      setScannedBooking(booking);
      
      // Stop scanner after successful scan (200 response) - use exact same logic as stopCameraScan button
      await stopCameraScan();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to scan barcode');
      // If scan failed, scanner continues running so user can try again
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  };

  const startCameraScan = async () => {
    try {
      setError(null);
      setScannedBooking(null);
      
      const html5QrCode = new Html5Qrcode(scanElementId);
      scannerRef.current = html5QrCode;
      const qrBoxSize = typeof window !== 'undefined'
        ? Math.min(300, Math.max(200, window.innerWidth - 120))
        : 300;

      await html5QrCode.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: qrBoxSize, height: qrBoxSize },
        },
        async (decodedText) => {
          // Only process if not already processing
          if (!isProcessingRef.current) {
            await handleScan(decodedText);
          }
        },
        (errorMessage) => {
          // Ignore scan errors (they're frequent during scanning)
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      setError('Failed to start camera. Please check permissions or try manual entry.');
      console.error('Camera error:', err);
    }
  };

  const stopCameraScan = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleManualScan = async () => {
    if (!manualBarcode.trim()) {
      setError('Please enter a barcode');
      return;
    }
    await handleScan(manualBarcode.trim());
  };

  const handleViewBooking = () => {
    if (scannedBooking) {
      router.push(`/company/bookings/${scannedBooking.id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Scan Barcode</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Scan shipping label barcodes to quickly retrieve booking information
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Section */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <ScanLine className="h-5 w-5 text-orange-600" />
              <h2 className="text-xl font-semibold">Barcode Scanner</h2>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={scanMode === 'camera' ? 'default' : 'outline'}
                onClick={() => {
                  if (isScanning) stopCameraScan();
                  setScanMode('camera');
                  setError(null);
                }}
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                Camera
              </Button>
              <Button
                variant={scanMode === 'manual' ? 'default' : 'outline'}
                onClick={() => {
                  if (isScanning) stopCameraScan();
                  setScanMode('manual');
                  setError(null);
                }}
                className="flex-1"
              >
                <Keyboard className="h-4 w-4 mr-2" />
                Manual Entry
              </Button>
            </div>

            {scanMode === 'camera' ? (
              <div className="space-y-4">
                <div
                  id={scanElementId}
                  className="w-full rounded-lg overflow-hidden bg-gray-100 min-h-[240px] sm:min-h-[300px]"
                />

                {!isScanning ? (
                  <Button onClick={startCameraScan} className="w-full" disabled={loading}>
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera Scanner
                  </Button>
                ) : (
                  <Button onClick={stopCameraScan} variant="destructive" className="w-full" disabled={loading}>
                    <X className="h-4 w-4 mr-2" />
                    Stop Scanner
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="manual-barcode">Enter Booking ID / Barcode</Label>
                  <Input
                    id="manual-barcode"
                    type="text"
                    placeholder="BKG-2025-0000007"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleManualScan();
                      }
                    }}
                    disabled={loading}
                    className="mt-2"
                  />
                </div>
                <Button onClick={handleManualScan} className="w-full" disabled={loading || !manualBarcode.trim()}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <ScanLine className="h-4 w-4 mr-2" />
                      Scan Barcode
                    </>
                  )}
                </Button>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                <span className="ml-2 text-sm text-gray-600">Processing barcode...</span>
              </div>
            )}
          </div>
        </Card>

        {/* Results Section */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-semibold">Scan Results</h2>
            </div>

            {scannedBooking ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">Booking Found!</span>
                  </div>
                  <p className="text-sm text-green-600">Barcode scanned successfully</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-500">Booking ID</Label>
                    <p className="font-mono text-sm font-semibold">{scannedBooking.id}</p>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">Status</Label>
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          scannedBooking.status === 'ACCEPTED'
                            ? 'bg-green-100 text-green-800'
                            : scannedBooking.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : scannedBooking.status === 'IN_TRANSIT'
                            ? 'bg-blue-100 text-blue-800'
                            : scannedBooking.status === 'DELIVERED'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {scannedBooking.status}
                      </span>
                    </div>
                  </div>

                  {scannedBooking.customer && (
                    <div>
                      <Label className="text-xs text-gray-500">Customer</Label>
                      <p className="text-sm">{scannedBooking.customer.fullName}</p>
                      <p className="text-xs text-gray-500">{scannedBooking.customer.email}</p>
                    </div>
                  )}

                  {scannedBooking.shipmentSlot && (
                    <div>
                      <Label className="text-xs text-gray-500">Route</Label>
                      <p className="text-sm">
                        {scannedBooking.shipmentSlot.originCity} → {scannedBooking.shipmentSlot.destinationCity}
                      </p>
                    </div>
                  )}

                  {scannedBooking.calculatedPrice && (
                    <div>
                      <Label className="text-xs text-gray-500">Price</Label>
                      <p className="text-sm font-semibold">£{Number(scannedBooking.calculatedPrice).toFixed(2)}</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <Button onClick={handleViewBooking} className="w-full">
                    View Full Booking Details
                  </Button>
                  <Button
                    onClick={() => {
                      setScannedBooking(null);
                      setError(null);
                      setManualBarcode('');
                    }}
                    variant="outline"
                    className="w-full mt-2"
                  >
                    Scan Another
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <ScanLine className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No booking scanned yet</p>
                <p className="text-xs mt-1">Scan a barcode to see booking details here</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">How to Use</h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Use the camera scanner to scan barcodes from shipping labels</li>
          <li>• Or manually enter the booking ID (e.g., BKG-2025-0000007)</li>
        </ul>
      </Card>
    </div>
  );
}

