import { getAccessToken } from '../firebase';

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  date?: string;
}

export const gmailService = {
  /**
   * Fetches recent emails for the authenticated user.
   */
  async getRecentMessages(maxResults = 5): Promise<GmailMessageSummary[]> {
    const token = getAccessToken();
    if (!token) {
      console.warn("Gmail Service: No access token available");
      return [];
    }

    try {
      const listRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      if (!listRes.ok) {
        throw new Error(`Gmail API error: ${listRes.statusText}`);
      }

      const listData = await listRes.json();
      if (!listData.messages || listData.messages.length === 0) {
        return [];
      }

      const messageDetails: GmailMessageSummary[] = await Promise.all(
        listData.messages.slice(0, maxResults).map(async (msg: { id: string; threadId: string }) => {
          try {
            const detailRes = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: 'application/json',
                },
              }
            );

            if (!detailRes.ok) return { id: msg.id, threadId: msg.threadId };
            const detailData = await detailRes.json();
            const headers = detailData.payload?.headers || [];
            const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === 'subject');
            const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from');
            const dateHeader = headers.find((h: any) => h.name.toLowerCase() === 'date');

            return {
              id: msg.id,
              threadId: msg.threadId,
              snippet: detailData.snippet,
              subject: subjectHeader?.value || '(Konu Yok)',
              from: fromHeader?.value || '(Bilinmeyen Gönderen)',
              date: dateHeader?.value || '',
            };
          } catch {
            return { id: msg.id, threadId: msg.threadId };
          }
        })
      );

      return messageDetails;
    } catch (err) {
      console.error("Failed to fetch Gmail messages:", err);
      return [];
    }
  },
};
