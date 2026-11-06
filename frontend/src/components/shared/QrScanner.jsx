import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, KeyRound, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

export const QrScanner = ({ onVerify, isVerifying, verifyResult }) => {
  const [mode, setMode] = useState('camera'); // 'camera' | 'manual'
  const [manualToken, setManualToken] = useState('');
  const [scannerError, setScannerError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const html5QrCodeRef = useRef(null);

  const startScanner = async () => {
    try {
      setScannerError(null);
      const html5QrCode = new Html5Qrcode('qr-reader-container');
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          // Successfully scanned a QR
          html5QrCode.stop().then(() => {
            setIsScanning(false);
            if (onVerify) {
              onVerify(decodedText);
            }
          });
        },
        () => {
          // ignore scan frame errors
        }
      );

      setIsScanning(true);
    } catch (err) {
      setScannerError(
        err.message || 'Could not access device camera. Please check permissions or use manual entry.'
      );
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      } catch {
        // ignore
      } finally {
        setIsScanning(false);
      }
    }
  };

  useEffect(() => {
    if (mode === 'camera') {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [mode]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualToken.trim() && onVerify) {
      onVerify(manualToken.trim());
    }
  };

  return (
    <Card className="max-w-lg mx-auto overflow-hidden">
      {/* Mode Switcher */}
      <div className="flex border-b border-cream-200">
        <button
          type="button"
          onClick={() => setMode('camera')}
          className={`flex-1 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
            mode === 'camera'
              ? 'border-primary-600 text-primary-700 bg-primary-50/50'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Device Camera</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex-1 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
            mode === 'manual'
              ? 'border-primary-600 text-primary-700 bg-primary-50/50'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Manual Token Entry</span>
        </button>
      </div>

      <div className="p-5">
        {mode === 'camera' ? (
          <div>
            <div className="relative rounded-2xl overflow-hidden bg-neutral-900 min-h-[280px] flex items-center justify-center">
              <div id="qr-reader-container" className="w-full h-full" />

              {!isScanning && !scannerError && (
                <div className="text-center p-4">
                  <Camera className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                  <p className="text-sm text-neutral-300">Starting camera preview...</p>
                </div>
              )}

              {scannerError && (
                <div className="text-center p-6 bg-neutral-800 text-white rounded-2xl m-4">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-amber-300">{scannerError}</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Try switching to manual token entry tab above.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 text-white border-neutral-600 hover:bg-neutral-700"
                    onClick={startScanner}
                    icon={RefreshCw}
                  >
                    Retry Camera
                  </Button>
                </div>
              )}
            </div>

            <p className="text-xs text-center text-neutral-500 mt-3">
              Point the device camera at the customer's QR Pass screen. Hold steady.
            </p>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4 py-2">
            <div>
              <Input
                label="Signed Pickup Token"
                placeholder="e.g. CHF-1001-4412 or scan QR code"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                required
                helperText="Ask the customer to read or copy the token string from their QR pass."
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isVerifying}
              disabled={!manualToken.trim()}
            >
              Verify & Complete Pickup
            </Button>
          </form>
        )}

        {/* Verification Result Feedback */}
        {verifyResult && (
          <div className="mt-5 pt-4 border-t border-cream-200 animate-in fade-in duration-300">
            {verifyResult.success ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">Pickup Confirmed!</h4>
                  <p className="text-xs mt-0.5">{verifyResult.message}</p>
                  {verifyResult.reservation && (
                    <div className="mt-2 text-xs bg-white/80 p-2.5 rounded-lg border border-emerald-200">
                      <p><strong>Customer:</strong> {verifyResult.reservation.customer?.name || 'Customer'}</p>
                      <p><strong>Meal:</strong> {verifyResult.reservation.meal?.name || 'Meal'}</p>
                      <p><strong>Time:</strong> {new Date().toLocaleTimeString()}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-terracotta-50 border border-terracotta-200 text-terracotta-800 flex items-start gap-3">
                <XCircle className="w-6 h-6 text-terracotta-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">Verification Failed</h4>
                  <p className="text-xs mt-0.5 leading-relaxed">{verifyResult.message}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 text-xs bg-white text-terracotta-700 border-terracotta-300 hover:bg-terracotta-100"
                    onClick={() => {
                      if (mode === 'camera') startScanner();
                    }}
                  >
                    Scan Again
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

