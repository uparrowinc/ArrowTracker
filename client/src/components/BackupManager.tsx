import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  Download, 
  Trash2, 
  RefreshCw, 
  Calendar,
  HardDrive,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface BackupStatus {
  enabled: boolean;
  lastBackups: {
    daily?: string;
    weekly?: string;
    monthly?: string;
  };
  totalBackups: number;
  totalSize: number;
  totalSizeFormatted: string;
  retention: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export function BackupManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  // Fetch backup status
  const { data: status, isLoading } = useQuery<BackupStatus>({
    queryKey: ['/api/backup/status'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: async (type: 'daily' | 'weekly' | 'monthly') => {
      setIsCreating(true);
      const response = await fetch('/api/backup/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });
      
      if (!response.ok) {
        throw new Error('Backup creation failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Backup Created',
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/backup/status'] });
      setIsCreating(false);
    },
    onError: (error) => {
      toast({
        title: 'Backup Failed',
        description: error.message,
        variant: 'destructive',
      });
      setIsCreating(false);
    },
  });

  // Cleanup backups mutation
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/backup/cleanup', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Cleanup failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Cleanup Complete',
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/backup/status'] });
    },
    onError: (error) => {
      toast({
        title: 'Cleanup Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDownloadBackup = (type: string, filename: string) => {
    const url = `/api/backup/download/${type}/${filename}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBackupAge = (backupName: string): string => {
    try {
      const match = backupName.match(/backup-\w+-(.+)\.zip$/);
      if (match) {
        const timestamp = match[1].replace(/-/g, ':').replace('T', ' ');
        const date = new Date(timestamp);
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        
        if (diffHours < 24) {
          return `${diffHours}h ago`;
        } else {
          const diffDays = Math.floor(diffHours / 24);
          return `${diffDays}d ago`;
        }
      }
    } catch (error) {
      return 'Unknown';
    }
    return 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-300">Loading backup status...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Backup System Status */}
      <Card className="bg-gray-900 border-gray-800 shadow-2xl">
        <CardHeader className="border-b border-gray-800 pb-4">
          <CardTitle className="text-xl text-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            Backup System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {status?.enabled ? (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-500" />
                )}
              </div>
              <p className="text-sm text-gray-400">System Status</p>
              <p className="font-semibold text-gray-100">
                {status?.enabled ? 'Active' : 'Disabled'}
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <HardDrive className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-sm text-gray-400">Total Backups</p>
              <p className="font-semibold text-gray-100">{status?.totalBackups || 0}</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Database className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-sm text-gray-400">Total Size</p>
              <p className="font-semibold text-gray-100">{status?.totalSizeFormatted || '0 Bytes'}</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
              <p className="text-sm text-gray-400">Auto Backup</p>
              <p className="font-semibold text-gray-100">2:00 AM Daily</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Backups */}
      <Card className="bg-gray-900 border-gray-800 shadow-2xl">
        <CardHeader className="border-b border-gray-800 pb-4">
          <CardTitle className="text-xl text-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            Recent Backups
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {['daily', 'weekly', 'monthly'].map((type) => {
              const backupName = status?.lastBackups?.[type as keyof typeof status.lastBackups];
              const hasBackup = backupName && backupName !== 'None';
              
              return (
                <div key={type} className="flex items-center justify-between p-4 bg-gray-800 border border-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="secondary" 
                      className={`${
                        type === 'daily' ? 'bg-green-600 text-white' :
                        type === 'weekly' ? 'bg-blue-600 text-white' :
                        'bg-purple-600 text-white'
                      } border-0`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Badge>
                    <div>
                      <p className="font-medium text-gray-100">
                        {hasBackup ? backupName : 'No backup available'}
                      </p>
                      {hasBackup && (
                        <p className="text-xs text-gray-400">
                          Created {getBackupAge(backupName)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {hasBackup && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadBackup(type, backupName)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Backup Controls */}
      <Card className="bg-gray-900 border-gray-800 shadow-2xl">
        <CardHeader className="border-b border-gray-800 pb-4">
          <CardTitle className="text-xl text-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-white" />
            </div>
            Backup Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-200">Create Manual Backup</h4>
              <div className="flex flex-wrap gap-2">
                {['daily', 'weekly', 'monthly'].map((type) => (
                  <Button
                    key={type}
                    onClick={() => createBackupMutation.mutate(type as any)}
                    disabled={isCreating || createBackupMutation.isPending}
                    className={`${
                      type === 'daily' ? 'bg-green-600 hover:bg-green-700' :
                      type === 'weekly' ? 'bg-blue-600 hover:bg-blue-700' :
                      'bg-purple-600 hover:bg-purple-700'
                    } border-0`}
                  >
                    {isCreating ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Database className="w-4 h-4 mr-2" />
                    )}
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-200">Maintenance</h4>
              <Button
                onClick={() => cleanupMutation.mutate()}
                disabled={cleanupMutation.isPending}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                {cleanupMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Cleanup Old Backups
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Retention Policy */}
      <Card className="bg-gray-900 border-gray-800 shadow-2xl">
        <CardHeader className="border-b border-gray-800 pb-4">
          <CardTitle className="text-xl text-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            Retention Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-800 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400 mb-1">Daily Backups</p>
              <p className="text-2xl font-bold text-green-500">{status?.retention?.daily || 7}</p>
              <p className="text-xs text-gray-500">days retained</p>
            </div>
            <div className="text-center p-4 bg-gray-800 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400 mb-1">Weekly Backups</p>
              <p className="text-2xl font-bold text-blue-500">{status?.retention?.weekly || 4}</p>
              <p className="text-xs text-gray-500">weeks retained</p>
            </div>
            <div className="text-center p-4 bg-gray-800 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400 mb-1">Monthly Backups</p>
              <p className="text-2xl font-bold text-purple-500">{status?.retention?.monthly || 12}</p>
              <p className="text-xs text-gray-500">months retained</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup Progress */}
      {isCreating && (
        <Card className="bg-gray-900 border-gray-800 shadow-2xl">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-gray-200 font-medium">Creating backup...</span>
              </div>
              <Progress value={undefined} className="w-full" />
              <p className="text-sm text-gray-400">
                This may take a few minutes depending on the size of your data.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}