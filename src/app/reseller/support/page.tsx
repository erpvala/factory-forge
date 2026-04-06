// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Headphones, 
  Search, 
  Filter, 
  Plus,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Calendar,
  Reply,
  ExternalLink
} from 'lucide-react';
import { useResellerDashboardAuth } from '@/hooks/useResellerDashboardAuth';
import { useResellerDashboardState } from '@/hooks/useResellerDashboardState';

const ResellerSupportPage: React.FC = () => {
  const { user, isAuthenticated } = useResellerDashboardAuth();
  const { state, refreshData } = useResellerDashboardState();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    message: '',
    priority: 'medium'
  });

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated, refreshData]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to access your support tickets.</p>
        </div>
      </div>
    );
  }

  const filteredTickets = state.supportTickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleCreateTicket = () => {
    // Create new support ticket
    console.log('Create ticket:', newTicket);
    setShowNewTicket(false);
    setNewTicket({ subject: '', message: '', priority: 'medium' });
  };

  const handleViewTicket = (ticketId: string) => {
    // Navigate to ticket details
    console.log('View ticket:', ticketId);
  };

  const handleReplyTicket = (ticketId: string) => {
    // Reply to ticket
    console.log('Reply to ticket:', ticketId);
  };

  const handleCloseTicket = (ticketId: string) => {
    // Close ticket
    console.log('Close ticket:', ticketId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'pending': return 'secondary';
      case 'closed': return 'outline';
      case 'resolved': return 'default';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const openTickets = state.supportTickets.filter(t => t.status === 'open').length;
  const pendingTickets = state.supportTickets.filter(t => t.status === 'pending').length;
  const closedTickets = state.supportTickets.filter(t => t.status === 'closed').length;
  const highPriorityTickets = state.supportTickets.filter(t => t.priority === 'high' && t.status !== 'closed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support</h1>
          <p className="text-muted-foreground">
            Manage customer support tickets and requests
          </p>
        </div>
        <Button onClick={() => setShowNewTicket(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTickets}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
            {openTickets > 0 && (
              <div className="flex items-center mt-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 mr-1" />
                <span className="text-xs text-orange-600">Action required</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tickets</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTickets}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed Tickets</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{closedTickets}</div>
            <p className="text-xs text-muted-foreground">
              Resolved
            </p>
            <div className="flex items-center mt-2">
              <Badge variant="default" className="text-green-600">
                {((closedTickets / state.supportTickets.length) * 100).toFixed(1)}% resolved
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highPriorityTickets}</div>
            <p className="text-xs text-muted-foreground">
              Need urgent attention
            </p>
            {highPriorityTickets > 0 && (
              <div className="flex items-center mt-2">
                <Badge variant="destructive">
                  Urgent
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Ticket Modal */}
      {showNewTicket && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Support Ticket</CardTitle>
            <CardDescription>Submit a new support request</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  placeholder="Brief description of your issue"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <select 
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  placeholder="Detailed description of your issue"
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({...newTicket, message: e.target.value})}
                  rows={4}
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleCreateTicket}>Submit Ticket</Button>
                <Button variant="outline" onClick={() => setShowNewTicket(false)}>Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => setFilterStatus('all')}>
          <Filter className="h-4 w-4 mr-2" />
          All Status
        </Button>
        <Button variant="outline" onClick={() => setFilterStatus('open')}>
          Open
        </Button>
        <Button variant="outline" onClick={() => setFilterStatus('pending')}>
          Pending
        </Button>
        <Button variant="outline" onClick={() => setFilterStatus('closed')}>
          Closed
        </Button>
        <select 
          value={filterPriority} 
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Support Tickets */}
      <div className="space-y-4">
        {filteredTickets.map((ticket: any) => (
          <Card key={ticket.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                    <Badge variant={getStatusColor(ticket.status)}>
                      {ticket.status}
                    </Badge>
                    <Badge variant={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-4">{ticket.message}</p>
                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{ticket.customerName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>{ticket.replies || 0} replies</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleViewTicket(ticket.id)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  {ticket.status !== 'closed' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleReplyTicket(ticket.id)}
                    >
                      <Reply className="h-4 w-4" />
                    </Button>
                  )}
                  {ticket.status !== 'closed' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleCloseTicket(ticket.id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTickets.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Headphones className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No support tickets found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Create your first support ticket to get started'}
            </p>
            <Button onClick={() => setShowNewTicket(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Ticket
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResellerSupportPage;
