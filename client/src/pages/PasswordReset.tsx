import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Shield, Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

interface ResetStep {
  step: 'email' | 'mfa' | 'newPassword' | 'success';
  memberId?: number;
  requiresMFA?: boolean;
}

export default function PasswordReset() {
  const [currentStep, setCurrentStep] = useState<ResetStep>({ step: 'email' });
  const [email, setEmail] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenId, setTokenId] = useState('');
  const [token, setToken] = useState('');
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Check for reset token in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlTokenId = urlParams.get('tokenId');
    const urlToken = urlParams.get('token');
    
    if (urlTokenId && urlToken) {
      setTokenId(urlTokenId);
      setToken(urlToken);
      setCurrentStep({ step: 'newPassword' });
    }
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/members/password-reset/initiate', {
        email
      });

      const result = await response.json();

      if (result.success) {
        if (result.requiresMFA) {
          setCurrentStep({ 
            step: 'mfa', 
            memberId: result.memberId, 
            requiresMFA: true 
          });
          toast({
            title: 'MFA Required',
            description: 'Please verify your identity with MFA to proceed with password reset.',
          });
        } else {
          toast({
            title: 'Reset Email Sent',
            description: result.message,
          });
          setCurrentStep({ step: 'success' });
        }
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to initiate password reset',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStep.memberId) return;

    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/members/password-reset/verify-mfa', {
        memberId: currentStep.memberId,
        token: mfaCode,
        method: 'totp'
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'MFA Verified',
          description: result.message,
        });
        setCurrentStep({ step: 'success' });
      } else {
        toast({
          title: 'MFA Verification Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'MFA verification failed',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setMfaCode('');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (!validatePasswordStrength(newPassword)) {
      toast({
        title: 'Weak Password',
        description: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/members/password-reset/complete', {
        tokenId,
        token,
        newPassword
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Password Reset Successful',
          description: result.message,
        });
        setCurrentStep({ step: 'success' });
        setTimeout(() => navigate('/member-login'), 3000);
      } else {
        toast({
          title: 'Password Reset Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validatePasswordStrength = (password: string): boolean => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  };

  const renderEmailStep = () => (
    <Card className="w-full max-w-md bg-gray-900 border-gray-700">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <div>
          <CardTitle className="text-white text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription className="text-gray-400 mt-2">
            Enter your email address to receive reset instructions
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm font-medium block mb-2">
              Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              required
              disabled={isLoading}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" 
            disabled={isLoading || !email}
          >
            {isLoading ? 'Sending...' : 'Send Reset Instructions'}
          </Button>
          
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/member-login')}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Back to Login
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const renderMFAStep = () => (
    <Card className="w-full max-w-md bg-gray-900 border-gray-700">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <div>
          <CardTitle className="text-white text-2xl font-bold">MFA Verification</CardTitle>
          <CardDescription className="text-gray-400 mt-2">
            Enter your MFA code to verify your identity
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleMFASubmit} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm font-medium block mb-2">
              MFA Code
            </label>
            <Input
              type="text"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              placeholder="000000"
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 text-center text-lg tracking-widest"
              maxLength={6}
              required
              disabled={isLoading}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700" 
            disabled={isLoading || mfaCode.length !== 6}
          >
            {isLoading ? 'Verifying...' : 'Verify MFA'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderPasswordStep = () => (
    <Card className="w-full max-w-md bg-gray-900 border-gray-700">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <div>
          <CardTitle className="text-white text-2xl font-bold">New Password</CardTitle>
          <CardDescription className="text-gray-400 mt-2">
            Create a strong, secure password
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm font-medium block mb-2">
              New Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 pr-12"
                required
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <label className="text-gray-300 text-sm font-medium block mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 pr-12"
                required
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="text-xs text-gray-400 space-y-1">
            <p>Password requirements:</p>
            <ul className="list-disc list-inside space-y-1">
              <li className={newPassword.length >= 8 ? 'text-green-400' : 'text-gray-400'}>At least 8 characters</li>
              <li className={/[A-Z]/.test(newPassword) ? 'text-green-400' : 'text-gray-400'}>One uppercase letter</li>
              <li className={/[a-z]/.test(newPassword) ? 'text-green-400' : 'text-gray-400'}>One lowercase letter</li>
              <li className={/\d/.test(newPassword) ? 'text-green-400' : 'text-gray-400'}>One number</li>
              <li className={/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'text-green-400' : 'text-gray-400'}>One special character</li>
            </ul>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700" 
            disabled={isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderSuccessStep = () => (
    <Card className="w-full max-w-md bg-gray-900 border-gray-700">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <div>
          <CardTitle className="text-white text-2xl font-bold">Password Reset Complete</CardTitle>
          <CardDescription className="text-gray-400 mt-2">
            Your password has been successfully reset
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <Alert className="bg-green-900/20 border-green-600">
          <CheckCircle className="w-4 h-4" />
          <AlertDescription className="text-green-200">
            Check your email for confirmation and login with your new password.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={() => navigate('/member-login')}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        >
          Continue to Login
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {currentStep.step === 'email' && renderEmailStep()}
      {currentStep.step === 'mfa' && renderMFAStep()}
      {currentStep.step === 'newPassword' && renderPasswordStep()}
      {currentStep.step === 'success' && renderSuccessStep()}
    </div>
  );
}