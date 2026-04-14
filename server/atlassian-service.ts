import { db } from './db';
import { atlassianIntegration, tickets, timeEntries, teamMembers, projects } from '@shared/ticketing-schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: string;
    status: { name: string };
    priority: { name: string };
    issuetype: { name: string };
    assignee?: { accountId: string; displayName: string };
    reporter?: { accountId: string; displayName: string };
    created: string;
    updated: string;
    timetracking?: {
      timeSpent?: string;
      remainingEstimate?: string;
      originalEstimate?: string;
    };
  };
}

interface JiraWorklog {
  id: string;
  author: {
    accountId: string;
    displayName: string;
  };
  comment?: string;
  timeSpent: string;
  timeSpentSeconds: number;
  started: string;
  created: string;
  updated: string;
}

export class AtlassianService {
  private baseUrl: string = '';
  private email: string = '';
  private apiToken: string = '';
  private isConfigured: boolean = false;

  constructor() {
    this.initializeConfig();
  }

  private async initializeConfig() {
    try {
      const [config] = await db.select()
        .from(atlassianIntegration)
        .where(eq(atlassianIntegration.isEnabled, true))
        .limit(1);

      if (config) {
        this.baseUrl = `https://${config.domain}`;
        this.email = config.email;
        this.apiToken = this.decryptToken(config.apiToken || '');
        this.isConfigured = true;
      }
    } catch (error) {
      console.error('Failed to initialize Atlassian config:', error);
    }
  }

  private encryptToken(token: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  private decryptToken(encryptedToken: string): string {
    if (!encryptedToken.includes(':')) return encryptedToken; // Not encrypted
    
    try {
      const algorithm = 'aes-256-gcm';
      const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
      const parts = encryptedToken.split(':');
      
      // Only support secure format with authentication tag (iv:authTag:encrypted)
      if (parts.length === 3) {
        const [ivHex, authTagHex, encrypted] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        
        // Validate authentication tag length for GCM mode (must be 16 bytes)
        if (authTag.length !== 16) {
          throw new Error('Invalid authentication tag length');
        }
        
        const decipher = crypto.createDecipheriv(algorithm, key, iv, { authTagLength: 16 });
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      } else {
        // Legacy tokens without auth tags are no longer supported for security
        throw new Error('Insecure token format detected - please re-configure your Atlassian integration');
      }
    } catch (error) {
      console.error('Failed to decrypt token:', error);
      return '';
    }
  }

  private async makeJiraRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.isConfigured) {
      await this.initializeConfig();
    }

    if (!this.isConfigured) {
      throw new Error('Atlassian integration not configured');
    }

    const auth = Buffer.from(`${this.email}:${this.apiToken}`).toString('base64');
    
    const response = await fetch(`${this.baseUrl}/rest/api/3${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jira API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Sync configuration
  async updateIntegrationConfig(config: {
    domain: string;
    email: string;
    apiToken: string;
    isEnabled: boolean;
  }) {
    const encryptedToken = this.encryptToken(config.apiToken);
    
    const [existing] = await db.select()
      .from(atlassianIntegration)
      .limit(1);

    if (existing) {
      await db.update(atlassianIntegration)
        .set({
          domain: config.domain,
          email: config.email,
          apiToken: encryptedToken,
          isEnabled: config.isEnabled,
          updatedAt: new Date()
        })
        .where(eq(atlassianIntegration.id, existing.id));
    } else {
      await db.insert(atlassianIntegration)
        .values({
          domain: config.domain,
          email: config.email,
          apiToken: encryptedToken,
          isEnabled: config.isEnabled,
          webhookSecret: crypto.randomBytes(32).toString('hex')
        });
    }

    // Reinitialize config
    await this.initializeConfig();
  }

  // Issue synchronization
  async syncIssueFromJira(jiraKey: string): Promise<void> {
    try {
      const issue: JiraIssue = await this.makeJiraRequest(`/issue/${jiraKey}`);
      
      // Map Jira status to our status
      const statusMap: Record<string, string> = {
        'To Do': 'todo',
        'In Progress': 'in_progress',
        'Done': 'done',
        'Blocked': 'blocked',
        'Review': 'review',
        'Testing': 'testing'
      };

      // Map Jira priority to our priority
      const priorityMap: Record<string, string> = {
        'Lowest': 'low',
        'Low': 'low',
        'Medium': 'medium',
        'High': 'high',
        'Highest': 'urgent',
        'Critical': 'critical'
      };

      // Map Jira issue type to our type
      const typeMap: Record<string, string> = {
        'Bug': 'bug',
        'Story': 'story',
        'Task': 'task',
        'Epic': 'epic',
        'Improvement': 'improvement',
        'Spike': 'spike'
      };

      const status = statusMap[issue.fields.status.name] || 'backlog';
      const priority = priorityMap[issue.fields.priority.name] || 'medium';
      const type = typeMap[issue.fields.issuetype.name] || 'task';

      // Check if ticket already exists
      const [existingTicket] = await db.select()
        .from(tickets)
        .where(eq(tickets.atlassianIssueKey, issue.key))
        .limit(1);

      if (existingTicket) {
        // Update existing ticket
        await db.update(tickets)
          .set({
            title: issue.fields.summary,
            description: issue.fields.description || '',
            status: status as any,
            priority: priority as any,
            type: type as any,
            updatedAt: new Date()
          })
          .where(eq(tickets.id, existingTicket.id));
      } else {
        // Create new ticket
        await db.insert(tickets)
          .values({
            key: issue.key,
            title: issue.fields.summary,
            description: issue.fields.description || '',
            status: status as any,
            priority: priority as any,
            type: type as any,
            atlassianIssueId: issue.id,
            atlassianIssueKey: issue.key,
            projectId: 1, // Default project - should be mapped properly
            createdAt: new Date(issue.fields.created),
            updatedAt: new Date(issue.fields.updated)
          });
      }

    } catch (error) {
      console.error(`Failed to sync issue ${jiraKey}:`, error);
      throw error;
    }
  }

  // Time tracking synchronization
  async syncWorklogsFromJira(jiraKey: string): Promise<void> {
    try {
      const worklogsData = await this.makeJiraRequest(`/issue/${jiraKey}/worklog`);
      const worklogs: JiraWorklog[] = worklogsData.worklogs;

      const [ticket] = await db.select()
        .from(tickets)
        .where(eq(tickets.atlassianIssueKey, jiraKey))
        .limit(1);

      if (!ticket) {
        throw new Error(`Ticket not found for Jira key: ${jiraKey}`);
      }

      for (const worklog of worklogs) {
        // Check if worklog already exists
        const [existingEntry] = await db.select()
          .from(timeEntries)
          .where(eq(timeEntries.atlassianWorklogId, worklog.id))
          .limit(1);

        if (!existingEntry) {
          // Find or create team member
          let [member] = await db.select()
            .from(teamMembers)
            .where(eq(teamMembers.atlassianAccountId, worklog.author.accountId))
            .limit(1);

          if (!member) {
            // Create team member if not exists
            [member] = await db.insert(teamMembers)
              .values({
                email: `${worklog.author.accountId}@temp.com`,
                name: worklog.author.displayName || 'Unknown',
                atlassianAccountId: worklog.author.accountId
              })
              .returning();
          }

          // Convert time spent to hours
          const hoursLogged = worklog.timeSpentSeconds / 3600;

          await db.insert(timeEntries)
            .values({
              ticketId: ticket.id,
              teamMemberId: member.id,
              description: worklog.comment || 'Work logged from Jira',
              hoursSpent: hoursLogged,
              workDate: new Date(worklog.started),
              atlassianWorklogId: worklog.id
            });
        }
      }

    } catch (error) {
      console.error(`Failed to sync worklogs for ${jiraKey}:`, error);
      throw error;
    }
  }

  // Push time entry to Jira
  async logTimeToJira(timeEntryId: number): Promise<void> {
    try {
      const [timeEntry] = await db.select({
        timeEntry: timeEntries,
        ticket: tickets,
        member: teamMembers
      })
        .from(timeEntries)
        .innerJoin(tickets, eq(timeEntries.ticketId, tickets.id))
        .innerJoin(teamMembers, eq(timeEntries.teamMemberId, teamMembers.id))
        .where(eq(timeEntries.id, timeEntryId))
        .limit(1);

      if (!timeEntry || !timeEntry.ticket.atlassianIssueKey) {
        throw new Error('Time entry or Jira issue not found');
      }

      const timeSpentSeconds = Math.round((timeEntry.timeEntry.hoursSpent ?? 0) * 3600);
      
      const worklogData = {
        comment: timeEntry.timeEntry.description || 'Time logged from internal system',
        timeSpentSeconds: timeSpentSeconds,
        started: timeEntry.timeEntry.workDate.toISOString()
      };

      const response = await this.makeJiraRequest(
        `/issue/${timeEntry.ticket.atlassianIssueKey}/worklog`,
        {
          method: 'POST',
          body: JSON.stringify(worklogData)
        }
      );

      // Update time entry with Jira worklog ID
      await db.update(timeEntries)
        .set({
          atlassianWorklogId: response.id,
          updatedAt: new Date()
        })
        .where(eq(timeEntries.id, timeEntryId));

    } catch (error) {
      console.error(`Failed to log time to Jira for entry ${timeEntryId}:`, error);
      throw error;
    }
  }

  // Get project information from Jira
  async getJiraProjects(): Promise<any[]> {
    try {
      const response = await this.makeJiraRequest('/project/search');
      return response.values || [];
    } catch (error) {
      console.error('Failed to fetch Jira projects:', error);
      return [];
    }
  }

  // Create issue in Jira
  async createJiraIssue(ticketData: {
    projectKey: string;
    summary: string;
    description?: string;
    issueType: string;
    priority?: string;
    assignee?: string;
  }): Promise<string> {
    try {
      const issueData = {
        fields: {
          project: { key: ticketData.projectKey },
          summary: ticketData.summary,
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: ticketData.description || ''
                  }
                ]
              }
            ]
          },
          issuetype: { name: ticketData.issueType },
          priority: ticketData.priority ? { name: ticketData.priority } : undefined,
          assignee: ticketData.assignee ? { accountId: ticketData.assignee } : undefined
        }
      };

      const response = await this.makeJiraRequest('/issue', {
        method: 'POST',
        body: JSON.stringify(issueData)
      });

      return response.key;
    } catch (error) {
      console.error('Failed to create Jira issue:', error);
      throw error;
    }
  }

  // Test connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.makeJiraRequest('/myself');
      return { success: true, message: 'Connection successful' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}

export const atlassianService = new AtlassianService();