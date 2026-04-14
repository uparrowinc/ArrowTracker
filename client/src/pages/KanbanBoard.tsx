import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Clock, User, Calendar, BarChart3, Settings, Timer, Play, Pause, Square } from 'lucide-react';

interface Ticket {
  id: number;
  key: string;
  title: string;
  description?: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'testing' | 'done' | 'blocked' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  type: 'bug' | 'feature' | 'improvement' | 'task' | 'epic' | 'story' | 'spike';
  assignee?: { id: number; name: string; avatar?: string };
  estimatedHours?: number;
  actualHours?: number;
  storyPoints?: number;
  labels?: string[];
  dueDate?: string;
  createdAt: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  status: string;
  wipLimit?: number;
  tickets: Ticket[];
}

interface TimeEntry {
  id: number;
  description: string;
  hoursLogged: number;
  workDate: string;
  isRunning?: boolean;
  startTime?: string;
}

export default function KanbanBoard() {
  const [columns, setColumns] = useState<KanbanColumn[]>([
    { id: 'backlog', title: 'Backlog', status: 'backlog', tickets: [] },
    { id: 'todo', title: 'To Do', status: 'todo', wipLimit: 5, tickets: [] },
    { id: 'in_progress', title: 'In Progress', status: 'in_progress', wipLimit: 3, tickets: [] },
    { id: 'review', title: 'Review', status: 'review', wipLimit: 2, tickets: [] },
    { id: 'testing', title: 'Testing', status: 'testing', wipLimit: 2, tickets: [] },
    { id: 'done', title: 'Done', status: 'done', tickets: [] }
  ]);
  
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [activeTimer, setActiveTimer] = useState<{ ticketId: number; startTime: Date } | null>(null);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Sample data - replace with API calls
  useEffect(() => {
    loadKanbanData();
  }, []);

  const loadKanbanData = async () => {
    setIsLoading(true);
    try {
      // For now, use sample data
      const sampleTickets: Ticket[] = [
        {
          id: 1,
          key: 'UAI-001',
          title: 'Implement user authentication',
          description: 'Add secure login functionality with MFA support',
          status: 'in_progress',
          priority: 'high',
          type: 'feature',
          assignee: { id: 1, name: 'John Doe' },
          estimatedHours: 8,
          actualHours: 4.5,
          storyPoints: 5,
          labels: ['security', 'frontend'],
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          key: 'UAI-002',
          title: 'Fix database connection timeout',
          description: 'Resolve intermittent database connection issues',
          status: 'todo',
          priority: 'urgent',
          type: 'bug',
          assignee: { id: 2, name: 'Jane Smith' },
          estimatedHours: 4,
          actualHours: 0,
          storyPoints: 3,
          labels: ['backend', 'database'],
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          key: 'UAI-003',
          title: 'Design new dashboard layout',
          description: 'Create modern, responsive dashboard design',
          status: 'review',
          priority: 'medium',
          type: 'improvement',
          assignee: { id: 3, name: 'Mike Johnson' },
          estimatedHours: 12,
          actualHours: 10,
          storyPoints: 8,
          labels: ['design', 'ui/ux'],
          createdAt: new Date().toISOString()
        }
      ];

      // Distribute tickets to columns
      const updatedColumns = columns.map(column => ({
        ...column,
        tickets: sampleTickets.filter(ticket => ticket.status === column.status)
      }));

      setColumns(updatedColumns);
    } catch (error) {
      console.error('Failed to load kanban data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load kanban board data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, ticket: Ticket) => {
    e.dataTransfer.setData('application/json', JSON.stringify(ticket));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    
    try {
      const ticketData = JSON.parse(e.dataTransfer.getData('application/json'));
      const targetColumn = columns.find(col => col.id === targetColumnId);
      
      if (!targetColumn) return;

      // Check WIP limit
      if (targetColumn.wipLimit && targetColumn.tickets.length >= targetColumn.wipLimit) {
        toast({
          title: 'WIP Limit Exceeded',
          description: `Column "${targetColumn.title}" has reached its WIP limit of ${targetColumn.wipLimit}`,
          variant: 'destructive',
        });
        return;
      }

      // Update ticket status
      const updatedColumns = columns.map(column => ({
        ...column,
        tickets: column.tickets.filter(t => t.id !== ticketData.id)
      }));

      const targetCol = updatedColumns.find(col => col.id === targetColumnId);
      if (targetCol) {
        targetCol.tickets.push({
          ...ticketData,
          status: targetCol.status as any
        });
      }

      setColumns(updatedColumns);

      toast({
        title: 'Ticket Moved',
        description: `${ticketData.key} moved to ${targetColumn.title}`,
      });

    } catch (error) {
      console.error('Drop error:', error);
    }
  };

  const startTimer = (ticketId: number) => {
    setActiveTimer({ ticketId, startTime: new Date() });
    toast({
      title: 'Timer Started',
      description: 'Time tracking started for this ticket',
    });
  };

  const stopTimer = () => {
    if (!activeTimer) return;

    const endTime = new Date();
    const hoursLogged = (endTime.getTime() - activeTimer.startTime.getTime()) / (1000 * 60 * 60);

    const newTimeEntry: TimeEntry = {
      id: Date.now(),
      description: 'Work session',
      hoursLogged: Math.round(hoursLogged * 100) / 100,
      workDate: new Date().toISOString(),
      isRunning: false
    };

    setTimeEntries([...timeEntries, newTimeEntry]);
    setActiveTimer(null);

    toast({
      title: 'Time Logged',
      description: `Logged ${newTimeEntry.hoursLogged} hours`,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600 hover:bg-red-700';
      case 'urgent': return 'bg-red-500 hover:bg-red-600';
      case 'high': return 'bg-orange-500 hover:bg-orange-600';
      case 'medium': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'low': return 'bg-green-500 hover:bg-green-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug': return 'bg-red-100 text-red-800 border-red-200';
      case 'feature': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'improvement': return 'bg-green-100 text-green-800 border-green-200';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Kanban Board
            </h1>
            <p className="text-gray-400 mt-2">Manage your work in progress with visual task tracking</p>
          </div>
          
          <div className="flex items-center gap-4">
            {activeTimer && (
              <div className="flex items-center gap-2 bg-green-900/20 border border-green-600 rounded-lg px-4 py-2">
                <Timer className="w-4 h-4 text-green-400 animate-pulse" />
                <span className="text-green-400">Timer Running</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={stopTimer}
                  className="border-green-600 text-green-400 hover:bg-green-900/40"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </Button>
              </div>
            )}
            
            <Dialog open={showCreateTicket} onOpenChange={setShowCreateTicket}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Create New Ticket</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Add a new ticket to the kanban board
                  </DialogDescription>
                </DialogHeader>
                {/* Create ticket form would go here */}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 overflow-x-auto">
          {columns.map((column) => (
            <div
              key={column.id}
              className="bg-gray-900 rounded-lg border border-gray-700 p-4 min-h-[500px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">{column.title}</h3>
                  <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                    {column.tickets.length}
                  </span>
                </div>
                
                {column.wipLimit && (
                  <div className={`text-xs px-2 py-1 rounded ${
                    column.tickets.length >= column.wipLimit
                      ? 'bg-red-900/20 text-red-400 border border-red-600'
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    WIP: {column.tickets.length}/{column.wipLimit}
                  </div>
                )}
              </div>

              {/* Tickets */}
              <div className="space-y-3">
                {column.tickets.map((ticket) => (
                  <Card
                    key={ticket.id}
                    className="bg-gray-800 border-gray-600 cursor-move hover:bg-gray-750 transition-colors"
                    draggable
                    onDragStart={(e) => handleDragStart(e, ticket)}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <CardContent className="p-4">
                      {/* Ticket Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-blue-400">{ticket.key}</span>
                          <span className={`${getPriorityColor(ticket.priority)} px-2 py-1 rounded text-xs`}>
                            {ticket.priority}
                          </span>
                        </div>
                        
                        <span className={`${getTypeColor(ticket.type)} px-2 py-1 rounded text-xs border`}>
                          {ticket.type}
                        </span>
                      </div>

                      {/* Ticket Title */}
                      <h4 className="text-white font-medium mb-2 line-clamp-2">
                        {ticket.title}
                      </h4>

                      {/* Ticket Meta */}
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-3">
                          {ticket.assignee && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{ticket.assignee.name}</span>
                            </div>
                          )}
                          
                          {ticket.storyPoints && (
                            <div className="flex items-center gap-1">
                              <BarChart3 className="w-3 h-3" />
                              <span>{ticket.storyPoints}sp</span>
                            </div>
                          )}
                        </div>

                        {/* Timer Controls */}
                        <div className="flex items-center gap-1">
                          {activeTimer?.ticketId === ticket.id ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                stopTimer();
                              }}
                              className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                            >
                              <Square className="w-3 h-3" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                startTimer(ticket.id);
                              }}
                              className="h-6 w-6 p-0 text-green-400 hover:text-green-300"
                            >
                              <Play className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {ticket.estimatedHours && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Progress</span>
                            <span>{ticket.actualHours || 0}h / {ticket.estimatedHours}h</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-1.5">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, ((ticket.actualHours || 0) / ticket.estimatedHours) * 100)}%`
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Due Date Warning */}
                      {ticket.dueDate && new Date(ticket.dueDate) < new Date(Date.now() + 24 * 60 * 60 * 1000) && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-orange-400">
                          <Calendar className="w-3 h-3" />
                          <span>Due soon</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Ticket Details Modal */}
        {selectedTicket && (
          <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
            <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <DialogTitle className="text-white">{selectedTicket.key}</DialogTitle>
                  <span className={`${getPriorityColor(selectedTicket.priority)} px-2 py-1 rounded text-xs`}>
                    {selectedTicket.priority}
                  </span>
                  <span className={`${getTypeColor(selectedTicket.type)} px-2 py-1 rounded text-xs border`}>
                    {selectedTicket.type}
                  </span>
                </div>
                <DialogDescription className="text-gray-400">
                  {selectedTicket.title}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {selectedTicket.description && (
                  <div>
                    <h4 className="text-white font-medium mb-2">Description</h4>
                    <p className="text-gray-300 text-sm">{selectedTicket.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-white font-medium mb-2">Details</h4>
                    <div className="space-y-2 text-sm">
                      {selectedTicket.assignee && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Assignee:</span>
                          <span className="text-white">{selectedTicket.assignee.name}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className="text-white capitalize">{selectedTicket.status.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Created:</span>
                        <span className="text-white">{formatTimeAgo(selectedTicket.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-medium mb-2">Time Tracking</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Estimated:</span>
                        <span className="text-white">{selectedTicket.estimatedHours || 0}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Logged:</span>
                        <span className="text-white">{selectedTicket.actualHours || 0}h</span>
                      </div>
                      {selectedTicket.storyPoints && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Story Points:</span>
                          <span className="text-white">{selectedTicket.storyPoints}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Time Entry Section */}
                <div>
                  <h4 className="text-white font-medium mb-2">Log Time</h4>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="Hours"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                    <Input
                      placeholder="Work description"
                      className="bg-gray-800 border-gray-600 text-white flex-1"
                    />
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      Log Time
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}