import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Shield, Smartphone, Mail, Key, Copy, Download } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface MFASetupProps {
  memberId: number;
  onComplete: () => void;
}

export default function MFASetup({ memberId, onComplete }: MFASetupProps) {
  const [activeTab, setActiveTab] = useState('authenticator');
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const { toast } = useToast();

  const handleAuthenticatorSetup = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', `/api/members/${memberId}/mfa/setup-authenticator`);
      const data = await response.json();
      setSetupData(data);
    } catch (error: any) {
      toast({
        title: 'Setup Failed',
        description: error.message || 'Failed to setup authenticator',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAuthenticator = async () => {
    if (!setupData || !verificationCode) return;

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', `/api/members/${memberId}/mfa/verify-authenticator`, {
        token: verificationCode,
        backupCodes: setupData.backupCodes,
      });

      if (response.ok) {
        setShowBackupCodes(true);
        toast({
          title: 'MFA Enabled',
          description: 'Multi-factor authentication has been successfully enabled',
        });
      } else {
        toast({
          title: 'Verification Failed',
          description: 'Invalid verification code',
          variant: 'destructive',
        });
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

  const handleSMSSetup = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', `/api/members/${memberId}/mfa/send-sms`, {
        purpose: 'setup',
      });

      if (response.ok) {
        toast({
          title: 'SMS Sent',
          description: 'Verification code sent to your phone',
        });
      }
    } catch (error: any) {
      toast({
        title: 'SMS Failed',
        description: error.message || 'Failed to send SMS',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSetup = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', `/api/members/${memberId}/mfa/send-email`, {
        purpose: 'setup',
      });

      if (response.ok) {
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

  const copyBackupCodes = () => {
    if (setupData) {
      navigator.clipboard.writeText(setupData.backupCodes.join('\n'));
      toast({
        title: 'Copied',
        description: 'Backup codes copied to clipboard',
      });
    }
  };

  const downloadBackupCodes = () => {
    if (setupData) {
      const blob = new Blob([setupData.backupCodes.join('\n')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mfa-backup-codes.txt';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const completeSetup = () => {
    onComplete();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Setup Multi-Factor Authentication</h2>
        <p className="text-gray-400">
          Secure your account with an additional layer of protection
        </p>
      </div>

      {showBackupCodes ? (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Key className="w-5 h-5" />
              Backup Codes
            </CardTitle>
            <CardDescription className="text-gray-400">
              Save these backup codes in a secure location. You can use them to access your account if you lose access to your authenticator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 mb-4 font-mono text-sm">
              {setupData?.backupCodes.map((code, index) => (
                <div key={index} className="bg-gray-800 p-2 rounded text-center text-gray-300">
                  {code}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mb-4">
              <Button onClick={copyBackupCodes} variant="outline" size="sm">
                <Copy className="w-4 h-4 mr-2" />
                Copy Codes
              </Button>
              <Button onClick={downloadBackupCodes} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
            <Alert className="bg-amber-900/20 border-amber-600">
              <AlertDescription className="text-amber-200">
                <strong>Important:</strong> Store these codes safely. Each code can only be used once.
              </AlertDescription>
            </Alert>
            <Button onClick={completeSetup} className="w-full mt-4">
              Complete Setup
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="authenticator" className="text-gray-300">
              <Smartphone className="w-4 h-4 mr-2" />
              Authenticator
            </TabsTrigger>
            <TabsTrigger value="sms" className="text-gray-300">
              <Smartphone className="w-4 h-4 mr-2" />
              SMS
            </TabsTrigger>
            <TabsTrigger value="email" className="text-gray-300">
              <Mail className="w-4 h-4 mr-2" />
              Email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="authenticator">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Google Authenticator</CardTitle>
                <CardDescription className="text-gray-400">
                  Use an authenticator app like Google Authenticator or Authy
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!setupData ? (
                  <Button onClick={handleAuthenticatorSetup} disabled={isLoading}>
                    {isLoading ? 'Setting up...' : 'Start Authenticator Setup'}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-gray-300 mb-4">Scan this QR code with your authenticator app:</p>
                      <div className="bg-white p-4 rounded-lg inline-block">
                        <img src={setupData.qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="verification-code" className="text-gray-300">
                        Enter verification code from your app:
                      </Label>
                      <Input
                        id="verification-code"
                        type="text"
                        placeholder="000000"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white mt-2"
                        maxLength={6}
                      />
                    </div>
                    
                    <Button 
                      onClick={handleVerifyAuthenticator}
                      disabled={!verificationCode || verificationCode.length !== 6 || isLoading}
                      className="w-full"
                    >
                      {isLoading ? 'Verifying...' : 'Verify and Enable'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sms">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">SMS Verification</CardTitle>
                <CardDescription className="text-gray-400">
                  Receive verification codes via text message
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="bg-blue-900/20 border-blue-600 mb-4">
                  <AlertDescription className="text-blue-200">
                    SMS verification requires a verified phone number on your account.
                  </AlertDescription>
                </Alert>
                <Button onClick={handleSMSSetup} disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send SMS Code'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Email Verification</CardTitle>
                <CardDescription className="text-gray-400">
                  Receive verification codes via email
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="bg-blue-900/20 border-blue-600 mb-4">
                  <AlertDescription className="text-blue-200">
                    Email verification will send codes to your registered email address.
                  </AlertDescription>
                </Alert>
                <Button onClick={handleEmailSetup} disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Email Code'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}