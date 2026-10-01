import { getAccessToken, signInWithGooglePopup } from '../firebase';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  iconLink?: string;
  modifiedTime?: string;
  size?: string;
}

export interface CalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
}

export interface TaskListItem {
  id: string;
  title: string;
}

export interface TaskItem {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
}

export interface ContactItem {
  resourceName: string;
  displayName: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
}

export class GoogleWorkspaceService {
  /**
   * Ensure user has an access token, or prompt to sign in with Google
   */
  async ensureToken(): Promise<string> {
    const token = getAccessToken();
    if (token) return token;

    // Prompt user to sign in to obtain access token with Workspace scopes
    const result = await signInWithGooglePopup();
    const freshToken = getAccessToken();
    if (!freshToken) {
      throw new Error('Google Workspace yetkilendirmesi başarısız oldu veya token alınamadı.');
    }
    return freshToken;
  }

  hasToken(): boolean {
    return !!getAccessToken();
  }

  // ===================== GOOGLE DRIVE =====================
  async listDriveFiles(query?: string, pageSize: number = 20): Promise<DriveFileItem[]> {
    const token = await this.ensureToken();
    let url = `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&fields=files(id,name,mimeType,webViewLink,iconLink,modifiedTime,size)&orderBy=modifiedTime desc`;
    if (query) {
      url += `&q=${encodeURIComponent(query)}`;
    }

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Google oturumunuzun süresi doldu. Lütfen yeniden yetkilendirin.');
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Google Drive hatası (${res.status})`);
    }

    const data = await res.json();
    return data.files || [];
  }

  async searchDrive(term: string): Promise<DriveFileItem[]> {
    const q = `name contains '${term.replace(/'/g, "\\'")}' and trashed = false`;
    return this.listDriveFiles(q, 15);
  }

  // ===================== GOOGLE CALENDAR =====================
  async listCalendarEvents(timeMin?: string, maxResults: number = 15): Promise<CalendarEventItem[]> {
    const token = await this.ensureToken();
    const nowIso = timeMin || new Date().toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(nowIso)}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Google Takvim oturum süresi doldu.');
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Google Takvim hatası (${res.status})`);
    }

    const data = await res.json();
    return (data.items || []).map((item: any) => ({
      id: item.id,
      summary: item.summary || '(Başlıksız Etkinlik)',
      description: item.description,
      location: item.location,
      start: item.start || {},
      end: item.end || {},
      htmlLink: item.htmlLink
    }));
  }

  async createCalendarEvent(eventData: {
    summary: string;
    description?: string;
    location?: string;
    startDateTime: string; // ISO string
    endDateTime: string;   // ISO string
  }): Promise<CalendarEventItem> {
    const token = await this.ensureToken();
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events`;

    const body = {
      summary: eventData.summary,
      description: eventData.description,
      location: eventData.location,
      start: { dateTime: eventData.startDateTime },
      end: { dateTime: eventData.endDateTime }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Takvim etkinliği oluşturulamadı (${res.status})`);
    }

    return await res.json();
  }

  // ===================== GOOGLE TASKS =====================
  async listTaskLists(): Promise<TaskListItem[]> {
    const token = await this.ensureToken();
    const url = 'https://tasks.googleapis.com/tasks/v1/users/@me/lists';

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Görev listeleri alınamadı (${res.status})`);
    }

    const data = await res.json();
    return (data.items || []).map((list: any) => ({
      id: list.id,
      title: list.title
    }));
  }

  async listTasks(taskListId: string = '@default'): Promise<TaskItem[]> {
    const token = await this.ensureToken();
    const url = `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks?showCompleted=true&maxResults=30`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Görevler alınamadı (${res.status})`);
    }

    const data = await res.json();
    return (data.items || []).map((t: any) => ({
      id: t.id,
      title: t.title || '(İsimsiz Görev)',
      notes: t.notes,
      status: t.status,
      due: t.due
    }));
  }

  async createTask(taskListId: string = '@default', title: string, notes?: string, due?: string): Promise<TaskItem> {
    const token = await this.ensureToken();
    const url = `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks`;

    const body: Record<string, any> = { title };
    if (notes) body.notes = notes;
    if (due) body.due = due;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Görev eklenemedi (${res.status})`);
    }

    return await res.json();
  }

  // ===================== GOOGLE CONTACTS (PEOPLE API) =====================
  async listContacts(pageSize: number = 30): Promise<ContactItem[]> {
    const token = await this.ensureToken();
    const url = `https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,photos&pageSize=${pageSize}&sortOrder=FIRST_NAME_ASCENDING`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Kişiler alınamadı (${res.status})`);
    }

    const data = await res.json();
    return (data.connections || []).map((p: any) => ({
      resourceName: p.resourceName,
      displayName: p.names?.[0]?.displayName || 'İsimsiz Kişi',
      email: p.emailAddresses?.[0]?.value,
      phone: p.phoneNumbers?.[0]?.value,
      photoUrl: p.photos?.[0]?.url
    }));
  }

  // ===================== GOOGLE DOCS =====================
  async getDocument(documentId: string): Promise<{ title: string; text: string }> {
    const token = await this.ensureToken();
    const url = `https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Belge okunamadı (${res.status})`);
    }

    const data = await res.json();
    let text = '';
    if (data.body?.content) {
      for (const elem of data.body.content) {
        if (elem.paragraph?.elements) {
          for (const pe of elem.paragraph.elements) {
            if (pe.textRun?.content) {
              text += pe.textRun.content;
            }
          }
        }
      }
    }

    return {
      title: data.title || 'Başlıksız Doküman',
      text: text.trim()
    };
  }

  // ===================== GOOGLE SHEETS =====================
  async getSpreadsheet(spreadsheetId: string, range?: string): Promise<{ title: string; sheets: string[]; values?: any[][] }> {
    const token = await this.ensureToken();
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`;

    const res = await fetch(metaUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `E-tablo okunamadı (${res.status})`);
    }

    const meta = await res.json();
    const sheetTitles = (meta.sheets || []).map((s: any) => s.properties?.title || 'Sayfa');

    let values: any[][] | undefined;
    if (range) {
      const valUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`;
      const valRes = await fetch(valUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (valRes.ok) {
        const valData = await valRes.json();
        values = valData.values;
      }
    }

    return {
      title: meta.properties?.title || 'Başlıksız Tablo',
      sheets: sheetTitles,
      values
    };
  }

  // ===================== WORKSPACE SNAPSHOT FOR AI =====================
  /**
   * Generates a context snapshot of the user's workspace to help Chat_CNR answer user questions accurately.
   */
  async getWorkspaceSnapshot(): Promise<string> {
    if (!this.hasToken()) {
      return '';
    }

    try {
      const [events, tasks, files] = await Promise.all([
        this.listCalendarEvents(undefined, 5).catch(() => []),
        this.listTasks('@default').catch(() => []),
        this.listDriveFiles(undefined, 6).catch(() => [])
      ]);

      const parts: string[] = [];

      if (events.length > 0) {
        parts.push(`- YAKLAŞAN TAKVİM ETKİNLİKLERİ (${events.length}):\n` + 
          events.map(e => `  * ${e.summary} [Başlangıç: ${e.start.dateTime || e.start.date || 'Belirtilmedi'}${e.location ? ` | Konum: ${e.location}` : ''}]`).join('\n')
        );
      }

      if (tasks.length > 0) {
        const activeTasks = tasks.filter(t => t.status === 'needsAction');
        parts.push(`- AKTİF GÖREVLER (${activeTasks.length}):\n` +
          activeTasks.slice(0, 5).map(t => `  * ${t.title}${t.due ? ` (Bitiş: ${t.due})` : ''}`).join('\n')
        );
      }

      if (files.length > 0) {
        parts.push(`- GOOGLE DRIVE SON DOSYALAR (${files.length}):\n` +
          files.map(f => `  * ${f.name} [Tip: ${f.mimeType}]`).join('\n')
        );
      }

      if (parts.length === 0) {
        return '';
      }

      return `\n[KULLANICININ GOOGLE WORKSPACE AKTİF VERİLERİ (GÜNCEL CANLI ENTEGRASYON)]:\n${parts.join('\n\n')}\n`;
    } catch {
      return '';
    }
  }
}

export const googleWorkspaceService = new GoogleWorkspaceService();
