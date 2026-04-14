import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Shield, Smartphone, Mail, Key, Lock } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface MFALoginProps {
  memberId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function MFALogin({ memberId, onSuccess, onCancel }: MFALoginProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const [verificationMethod, setVerificationMethod] = useState<'authenticator' | 'email' | 'backup'>('authenticator');
  const { toast } = useToast();

  const handleVerify = async () => {
    if (!verificationCode.trim()) return;

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', `/api/members/${memberId}/mfa/verify`, {
        token: verificationCode,
        method: verificationMethod,
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Verification Successful',
          description: 'You have been logged in successfully',
        });
        onSuccess();
      } else {
        if (result.lockedUntil) {
          setLockedUntil(new Date(result.lockedUntil));
          toast({
            title: 'Account Locked',
            description: 'Too many failed attempts. Please try again later.',
            variant: 'destructive',
          });
        } else {
          setRemainingAttempts(result.remainingAttempts || null);
          setFailedAttempts(prev => prev + 1);
          toast({
            title: 'Verification Failed',
            description: `Invalid code. ${result.remainingAttempts ? `${result.remainingAttempts} attempts remaining.` : ''}`,
            variant: 'destructive',
          });
        }
        setVerificationCode('');
      }
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.message || 'Failed to verify code',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmailCode = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', `/api/members/${memberId}/mfa/send-email`, {
        purpose: 'login',
      });

      if (response.ok) {
        setVerificationMethod('email');
        toast({
          title: 'Email Sent',
          description: 'Verification code sent to your email',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Email Failed',
        description: error.message || 'Failed to send email',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isLocked = lockedUntil && lockedUntil > new Date();

  return (
    <div className="max-w-md mx-auto p-6">
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="text-center">
          <Shield className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <CardTitle className="text-white">Multi-Factor Authentication</CardTitle>
          <CardDescription className="text-gray-400">
            Enter your verification code to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLocked ? (
            <Alert className="bg-red-900/20 border-red-600">
              <Lock className="w-4 h-4" />
              <AlertDescription className="text-red-200">
                Account temporarily locked due to too many failed attempts. 
                Please try again at {lockedUntil.toLocaleTimeString()}.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="verification-code" className="text-gray-300">
                  Verification Code
                </Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder={verificationMethod === 'backup' ? 'XXXX-XXXX' : '000000'}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white mt-2"
                  maxLength={verificationMethod === 'backup' ? 9 : 6}
                  disabled={isLoading}
                />
                {remainingAttempts !== null && (
                  <p className="text-sm text-yellow-400 mt-1">
                    {remainingAttempts} attempts remaining
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setVerificationMethod('authenticator')}
                  variant={verificationMethod === 'authenticator' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                >
                  <Smartphone className="w-4 h-4 mr-1" />
                  App
                </Button>
                <Button
                  onClick={sendEmailCode}
                  variant={verificationMethod === 'email' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  disabled={isLoading}
                >
                  <Mail className="w-4 h-4 mr-1" />
                  Email
                </Button>
              </div>

              <Button
                onClick={() => setVerificationMethod('backup')}
                variant="ghost"
                size="sm"
                className="w-full text-gray-400"
              >
                <Key className="w-4 h-4 mr-2" />
                Use backup code instead
              </Button>

              <div className="flex gap-2">
                <Button onClick={handleVerify} disabled={!verificationCode || isLoading} className="flex-1">
                  {isLoading ? 'Verifying...' : 'Verify'}
                </Button>
                <Button onClick={onCancel} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>

              {verificationMethod === 'authenticator' && (
                <p className="text-sm text-gray-400 text-center">
                  Open your authenticator app and enter the 6-digit code
                </p>
              )}

              {verificationMethod === 'backup' && (
                <Alert className="bg-amber-900/20 border-amber-600">
                  <AlertDescription className="text-amber-200">
                    Backup codes can only be used once. Make sure to generate new ones after using them.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}