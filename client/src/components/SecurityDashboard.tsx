import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Eye, Activity, Ban, CheckCircle } from 'lucide-react';

interface SecurityEvent {
  id: number;
  timestamp: string;
  ip: string;
  userAgent: string;
  eventType: string;
  details: string;
  severity: string;
  blocked: boolean;
}

interface SecurityStats {
  totalEvents: number;
  blockedAttacks: number;
  suspiciousIPs: number;
  honeypotTriggers: number;
  rateLimitHits: number;
}

export function SecurityDashboard() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<SecurityStats>({
    totalEvents: 0,
    blockedAttacks: 0,
    suspiciousIPs: 0,
    honeypotTriggers: 0,
    rateLimitHits: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchSecurityData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSecurityData = async () => {
    try {
      const [eventsRes, statsRes] = await Promise.all([
        fetch('/api/security/events'),
        fetch('/api/security/stats')
      ]);

      if (eventsRes.ok && statsRes.ok) {
        const eventsData = await eventsRes.json();
        const statsData = await statsRes.json();
        setEvents(eventsData);
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to fetch security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-900 text-red-200';
      case 'high': return 'bg-red-800 text-red-100';
      case 'medium': return 'bg-yellow-800 text-yellow-100';
      case 'low': return 'bg-blue-800 text-blue-100';
      default: return 'bg-gray-800 text-gray-100';
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'ATTACK_ATTEMPT': return <Shield className="w-4 h-4" />;
      case 'SUSPICIOUS_ACTIVITY': return <AlertTriangle className="w-4 h-4" />;
      case 'HONEYPOT_TRIGGER': return <Eye className="w-4 h-4" />;
      case 'RATE_LIMIT_HIT': return <Activity className="w-4 h-4" />;
      case 'MALICIOUS_PAYLOAD': return <Ban className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-24 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Security Dashboard</h2>
          <p className="text-gray-400">Real-time security monitoring and threat detection</p>
        </div>
        <Button onClick={fetchSecurityData} variant="outline" className="bg-gray-800 border-gray-700 text-gray-200">
          Refresh
        </Button>
      </div>

      {/* Security Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalEvents}</div>
            <p className="text-xs text-gray-500">Security events logged</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Blocked Attacks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{stats.blockedAttacks}</div>
            <p className="text-xs text-gray-500">Threats neutralized</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Suspicious IPs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{stats.suspiciousIPs}</div>
            <p className="text-xs text-gray-500">IPs under monitoring</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Honeypot Triggers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{stats.honeypotTriggers}</div>
            <p className="text-xs text-gray-500">Trap endpoints accessed</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Events */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="recent" className="data-[state=active]:bg-gray-700">Recent Events</TabsTrigger>
          <TabsTrigger value="attacks" className="data-[state=active]:bg-gray-700">Attack Attempts</TabsTrigger>
          <TabsTrigger value="honeypot" className="data-[state=active]:bg-gray-700">Honeypot</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Security Events</CardTitle>
              <CardDescription className="text-gray-400">
                Latest security events and threat detections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {events.slice(0, 20).map((event) => (
                  <div key={event.id} className="flex items-start space-x-3 p-3 bg-gray-900 rounded-lg">
                    <div className="flex-shrink-0">
                      {getEventTypeIcon(event.eventType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                        <Badge variant="outline" className="border-gray-600 text-gray-300">
                          {event.eventType}
                        </Badge>
                        {event.blocked && (
                          <Badge className="bg-red-900 text-red-200">BLOCKED</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-300 mb-1">{event.details}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>IP: {event.ip}</span>
                        <span>Time: {new Date(event.timestamp).toLocaleString()}</span>
                      </div>
                      {event.userAgent && (
                        <p className="text-xs text-gray-600 mt-1 truncate">
                          UA: {event.userAgent}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {events.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No security events recorded yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attacks" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Attack Attempts</CardTitle>
              <CardDescription className="text-gray-400">
                Malicious requests blocked by security systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {events.filter(e => e.eventType === 'ATTACK_ATTEMPT' || e.eventType === 'MALICIOUS_PAYLOAD').map((event) => (
                  <Alert key={event.id} className="bg-red-900/20 border-red-800">
                    <Ban className="h-4 w-4" />
                    <AlertDescription className="text-red-200">
                      <div className="font-semibold">{event.eventType} from {event.ip}</div>
                      <div className="text-sm mt-1">{event.details}</div>
                      <div className="text-xs mt-1 text-red-300">
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
                {events.filter(e => e.eventType === 'ATTACK_ATTEMPT' || e.eventType === 'MALICIOUS_PAYLOAD').length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No attack attempts detected
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="honeypot" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Honeypot Activity</CardTitle>
              <CardDescription className="text-gray-400">
                Attempts to access trap endpoints designed to catch attackers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {events.filter(e => e.eventType === 'HONEYPOT_TRIGGER').map((event) => (
                  <Alert key={event.id} className="bg-purple-900/20 border-purple-800">
                    <Eye className="h-4 w-4" />
                    <AlertDescription className="text-purple-200">
                      <div className="font-semibold">Honeypot triggered by {event.ip}</div>
                      <div className="text-sm mt-1">{event.details}</div>
                      <div className="text-xs mt-1 text-purple-300">
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
                {events.filter(e => e.eventType === 'HONEYPOT_TRIGGER').length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No honeypot triggers detected
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}