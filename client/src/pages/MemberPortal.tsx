import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  GraduationCap, 
  Ticket, 
  CreditCard, 
  LogOut, 
  Settings,
  User,
  Bell,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import MFASetup from '@/components/MFASetup';
import MFALogin from '@/components/MFALogin';

interface Member {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  membershipTier: string;
  membershipStatus: string;
  hasTrainingAccess: boolean;
  hasTicketingAccess: boolean;
  hasBillingAccess: boolean;
  mfaEnabled: boolean;
}

interface DashboardData {
  member: {
    firstName: string;
    lastName: string;
    membershipTier: string;
    membershipStatus: string;
  };
  stats: {
    ticketCount: number;
    courseCount: number;
  };
  recentInvoices: any[];
  accessPermissions: {
    training: boolean;
    ticketing: boolean;
    billing: boolean;
  };
}

export default function MemberPortal() {
  const [member, setMember] = useState<Member | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [requiresMFA, setRequiresMFA] = useState(false);
  const [showMFALogin, setShowMFALogin] = useState(false);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await apiRequest('GET', '/api/members/me');
      if (response.ok) {
        const memberData = await response.json();
        setMember(memberData);
        setIsAuthenticated(true);
        
        if (memberData.mfaEnabled) {
          // Check if MFA is verified in session
          try {
            const dashboardResponse = await apiRequest('GET', '/api/members/dashboard');
            if (dashboardResponse.ok) {
              const dashboard = await dashboardResponse.json();
              setDashboardData(dashboard);
            } else if (dashboardResponse.status === 403) {
              setShowMFALogin(true);
            }
          } catch (error) {
            setShowMFALogin(true);
          }
        } else {
          loadDashboard();
        }
      }
    } catch (error) {
      // Not authenticated
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboard = async () => {
    try {
      const response = await apiRequest('GET', '/api/members/dashboard');
      if (response.ok) {
        const dashboard = await response.json();
        setDashboardData(dashboard);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await apiRequest('POST', '/api/members/login', {
        email,
        password,
      });

      const result = await response.json();

      if (result.success) {
        setMember(result.member);
        setIsAuthenticated(true);
        
        if (result.requiresMFA) {
          setRequiresMFA(true);
          setShowMFALogin(true);
        } else {
          loadDashboard();
        }

        toast({
          title: 'Login Successful',
          description: 'Welcome to your member portal',
        });
      } else {
        toast({
          title: 'Login Failed',
          description: result.error || 'Invalid credentials',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.message || 'Login failed',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/members/logout');
      setMember(null);
      setIsAuthenticated(false);
      setDashboardData(null);
      setShowMFALogin(false);
      setShowMFASetup(false);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out',
      });
    } catch (error) {
      toast({
        title: 'Logout Failed',
        description: 'Failed to logout properly',
        variant: 'destructive',
      });
    }
  };

  const handleMFASuccess = () => {
    setShowMFALogin(false);
    loadDashboard();
  };

  const handleMFASetupComplete = () => {
    setShowMFASetup(false);
    checkAuthStatus();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  if (showMFALogin && member) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <MFALogin
          memberId={member.id}
          onSuccess={handleMFASuccess}
          onCancel={() => setShowMFALogin(false)}
        />
      </div>
    );
  }

  if (showMFASetup && member) {
    return (
      <div className="min-h-screen bg-black">
        <MFASetup
          memberId={member.id}
          onComplete={handleMFASetupComplete}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Shield className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-xl font-bold">Member Portal</h1>
                <p className="text-gray-400 text-sm">
                  {member?.firstName} {member?.lastName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge 
                variant={member?.membershipStatus === 'active' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {member?.membershipTier} Member
              </Badge>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 bg-gray-800 mb-8">
            <TabsTrigger value="dashboard" className="text-gray-300">
              <User className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="training" 
              className="text-gray-300"
              disabled={!member?.hasTrainingAccess}
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Training
            </TabsTrigger>
            <TabsTrigger 
              value="tickets" 
              className="text-gray-300"
              disabled={!member?.hasTicketingAccess}
            >
              <Ticket className="w-4 h-4 mr-2" />
              Support
            </TabsTrigger>
            <TabsTrigger 
              value="billing" 
              className="text-gray-300"
              disabled={!member?.hasBillingAccess}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="security" className="text-gray-300">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab dashboardData={dashboardData} member={member} />
          </TabsContent>

          <TabsContent value="training">
            <TrainingTab />
          </TabsContent>

          <TabsContent value="tickets">
            <TicketsTab />
          </TabsContent>

          <TabsContent value="billing">
            <BillingTab />
          </TabsContent>

          <TabsContent value="security">
            <SecurityTab 
              member={member} 
              onSetupMFA={() => setShowMFASetup(true)} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Login Form Component
function LoginForm({ onLogin }: { onLogin: (email: string, password: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await onLogin(email, password);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Card className="w-full max-w-md bg-gray-900 border-gray-700">
        <CardHeader className="text-center">
          <Shield className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <CardTitle className="text-white text-2xl">Member Portal</CardTitle>
          <CardDescription className="text-gray-400">
            Sign in to access your member dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-gray-300 text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white mt-1"
                required
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white mt-1"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Dashboard Tab Component
function DashboardTab({ dashboardData, member }: { dashboardData: DashboardData | null; member: Member | null }) {
  if (!dashboardData) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Ticket className="w-5 h-5 mr-2 text-green-400" />
                Support Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {dashboardData.stats.ticketCount}
              </div>
              <p className="text-sm text-gray-400">Total tickets submitted</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <GraduationCap className="w-5 h-5 mr-2 text-blue-400" />
                Courses Enrolled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {dashboardData.stats.courseCount}
              </div>
              <p className="text-sm text-gray-400">Active course enrollments</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.recentInvoices.length > 0 ? (
              <div className="space-y-2">
                {dashboardData.recentInvoices.map((invoice: any) => (
                  <div key={invoice.id} className="flex justify-between items-center p-2 bg-gray-800 rounded">
                    <div>
                      <p className="text-white font-medium">{invoice.invoiceNumber}</p>
                      <p className="text-gray-400 text-sm">{invoice.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white">${invoice.totalAmount}</p>
                      <Badge 
                        variant={invoice.status === 'paid' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No recent invoices</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Access Permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Training Portal</span>
              {dashboardData.accessPermissions.training ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Support Tickets</span>
              {dashboardData.accessPermissions.ticketing ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Billing Access</span>
              {dashboardData.accessPermissions.billing ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Account Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Status:</span>
                <Badge variant="default" className="capitalize">
                  {dashboardData.member.membershipStatus}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Plan:</span>
                <span className="text-white capitalize">
                  {dashboardData.member.membershipTier}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Training Tab Component
function TrainingTab() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Training Portal</h2>
      <Alert className="bg-blue-900/20 border-blue-600">
        <GraduationCap className="w-4 h-4" />
        <AlertDescription className="text-blue-200">
          Training content will be available here. Course management and progress tracking coming soon.
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Tickets Tab Component
function TicketsTab() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Support Tickets</h2>
      <Alert className="bg-green-900/20 border-green-600">
        <Ticket className="w-4 h-4" />
        <AlertDescription className="text-green-200">
          Support ticketing system will be available here. Create and manage support requests.
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Billing Tab Component
function BillingTab() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Billing & Invoices</h2>
      <Alert className="bg-purple-900/20 border-purple-600">
        <CreditCard className="w-4 h-4" />
        <AlertDescription className="text-purple-200">
          Billing and invoice management will be available here. View invoices, payment history, and subscription details.
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Security Tab Component
function SecurityTab({ member, onSetupMFA }: { member: Member | null; onSetupMFA: () => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Security Settings</h2>
      
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Multi-Factor Authentication</CardTitle>
          <CardDescription className="text-gray-400">
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {member?.mfaEnabled ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                <span className="text-white">MFA is enabled</span>
              </div>
              <Button variant="outline" size="sm">
                Manage MFA
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />
                <span className="text-white">MFA is not enabled</span>
              </div>
              <Button onClick={onSetupMFA} size="sm">
                Setup MFA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}