import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Shield, Activity, Clock } from 'lucide-react';

interface AdminSession {
  id: string;
  username: string;
  loginTime: string;
  lastActivity: string;
  ipAddress: string;
  timeActive: number;
}

interface SessionData {
  activeSessions: number;
  sessions: AdminSession[];
  databaseSessions: number;
}

export function AdminSessionMonitor() {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: sessionData, isLoading, refetch } = useQuery<SessionData>({
    queryKey: ['/api/admin/sessions', refreshKey],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-400">Loading session data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-500" />
          Admin Session Monitor
        </h2>
        <Button 
          onClick={handleRefresh}
          variant="outline"
          className="border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          <Activity className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Sessions</p>
                <p className="text-2xl font-bold text-blue-400">
                  {sessionData?.activeSessions || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Database Sessions</p>
                <p className="text-2xl font-bold text-green-400">
                  {sessionData?.databaseSessions || 0}
                </p>
              </div>
              <Shield className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Session Status</p>
                <p className="text-2xl font-bold text-purple-400">
                  {sessionData?.activeSessions ? 'ACTIVE' : 'INACTIVE'}
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Sessions List */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-100 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Active Admin Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!sessionData?.sessions || sessionData.sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No active admin sessions detected</p>
              <p className="text-sm">Sessions will appear here when admins are logged in</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessionData.sessions.map((session, index) => (
                <div 
                  key={session.id || index}
                  className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-100">{session.username}</p>
                      <p className="text-sm text-gray-400">
                        {session.ipAddress} • Session: {session.id}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge 
                      variant="default" 
                      className="bg-green-600 text-white mb-2"
                    >
                      ACTIVE
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="w-4 h-4" />
                      {session.timeActive} min active
                    </div>
                    <p className="text-xs text-gray-500">
                      Last: {new Date(session.lastActivity).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="bg-yellow-900/20 border-yellow-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-400 mb-1">Security Notice</h4>
              <p className="text-sm text-yellow-300">
                Admin sessions are automatically tracked and monitored. Sessions expire after 7 days of inactivity.
                All admin actions are logged for security audit purposes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}