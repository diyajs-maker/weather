import { db, sql } from '@/lib/db/client';
import { messageService } from './messageService';
import crypto from 'crypto';

export interface ComplianceStatus {
  buildingId: string;
  messageId: string;
  isCompliant: boolean;
  hoursSinceMessage: number;
  hasUpload: boolean;
  uploadTime?: string;
}

export class ComplianceService {
  async checkCompliance(messageId: string): Promise<ComplianceStatus | null> {
    const messageResult = await sql`
      SELECT * FROM messages WHERE id = ${messageId}
    `;

    if (messageResult.length === 0) return null;

    const message = messageResult[0];
    const sentAt = message.sent_at ? new Date(message.sent_at) : new Date(message.created_at);
    const now = new Date();
    const hoursSinceMessage = (now.getTime() - sentAt.getTime()) / (1000 * 60 * 60);

    const uploadResult = await sql`
      SELECT * FROM photo_uploads WHERE message_id = ${messageId} LIMIT 1
    `;

    const hasUpload = uploadResult.length > 0;
    const upload = uploadResult[0];
    const uploadTime = upload ? new Date((upload as any).uploaded_at).toISOString() : undefined;

    const complianceWindow = 2;
    const isCompliant = hasUpload && hoursSinceMessage <= complianceWindow;

    return {
      buildingId: (message as any).building_id,
      messageId,
      isCompliant,
      hoursSinceMessage: Math.round(hoursSinceMessage * 10) / 10,
      hasUpload,
      uploadTime,
    };
  }

  async checkAndSendWarnings(): Promise<number> {

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    const messagesResult = await sql`
      SELECT m.* FROM messages m
      LEFT JOIN photo_uploads p ON p.message_id = m.id
      WHERE m.delivered = true
        AND m.message_type IN ('alert', 'daily_summary')
        AND m.sent_at < ${twoHoursAgo.toISOString()}
        AND p.id IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM messages w 
          WHERE w.building_id = m.building_id 
            AND w.message_type = 'warning'
            AND w.created_at > m.sent_at
        )
      ORDER BY m.sent_at ASC
    `;

    const messages = messagesResult;
    let warningsSent = 0;

    for (const message of messages) {
      const recipientResult = await sql`
        SELECT * FROM recipients WHERE id = ${(message as any).recipient_id}
      `;
      const recipient = recipientResult[0];

      if (!recipient || !recipient.is_active) continue;

      const warningContent = `⚠️ COMPLIANCE WARNING\n\n` +
        `You have not uploaded a compliance photo for the message sent ${Math.round((Date.now() - new Date((message as any).sent_at).getTime()) / (1000 * 60 * 60) * 10) / 10} hours ago.\n\n` +
        `Please upload your photo immediately. Failure to comply may void your guarantee.\n\n` +
        `Upload link: ${process.env.NEXT_PUBLIC_APP_URL}/upload?token=${(message as any).id}`;

      const warningMessageId = crypto.randomUUID();
      
      await sql`
        INSERT INTO messages (
          id, building_id, recipient_id, message_type, 
          channel, content, delivered, created_at
        ) VALUES (
          ${warningMessageId},
          ${(message as any).building_id},
          ${(message as any).recipient_id},
          ${'warning'},
          ${(recipient as any).preference},
          ${warningContent},
          false,
          NOW()
        )
      `;

      warningsSent++;
    }

    if (warningsSent > 0) {
      await messageService.sendPendingMessages();
    }

    return warningsSent;
  }

  async getBuildingComplianceRate(buildingId: string, days: number = 30): Promise<number> {

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const messagesResult = await sql`
      SELECT m.id, m.sent_at FROM messages m
      WHERE m.building_id = ${buildingId}
        AND m.message_type IN ('alert', 'daily_summary')
        AND m.sent_at >= ${startDate.toISOString()}
        AND m.delivered = true
    `;

    const messages = messagesResult;
    if (messages.length === 0) return 100;

    let compliantCount = 0;

    for (const message of messages) {
      const compliance = await this.checkCompliance(message.id);
      if (compliance?.isCompliant) {
        compliantCount++;
      }
    }

    return Math.round((compliantCount / messages.length) * 100 * 10) / 10;
  }

  async markUploadCompliant(uploadId: string): Promise<void> {
    const uploadResult = await sql`
      SELECT * FROM photo_uploads WHERE id = ${uploadId}
    `;

    if (uploadResult.length === 0) return;

    const upload = uploadResult[0];
    const messageResult = await sql`
      SELECT * FROM messages WHERE id = ${(upload as any).message_id}
    `;

    if (messageResult.length === 0) return;

    const message = messageResult[0];
    const sentAt = (message as any).sent_at ? new Date((message as any).sent_at) : new Date((message as any).created_at);
    const uploadTime = new Date((upload as any).uploaded_at);
    const hoursSinceMessage = (uploadTime.getTime() - sentAt.getTime()) / (1000 * 60 * 60);

    const isCompliant = hoursSinceMessage <= (upload as any).compliance_window_hours;

    await sql`
      UPDATE photo_uploads SET is_compliant = ${isCompliant} WHERE id = ${uploadId}
    `;
  }
}

export const complianceService = new ComplianceService();
