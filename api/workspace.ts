export async function listCalendarEvents(accessToken: string, maxResults: number = 10) {
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=${maxResults}&orderBy=startTime&singleEvents=true`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Calendar API error: ${res.statusText}`);
  const data = await res.json();
  return data.items?.map((e: any) => ({
    summary: e.summary,
    start: e.start?.dateTime || e.start?.date,
    end: e.end?.dateTime || e.end?.date,
    link: e.htmlLink
  })) || [];
}

export async function searchGmail(accessToken: string, query: string = "", maxResults: number = 5) {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Gmail API error: ${res.statusText}`);
  const data = await res.json();
  
  if (!data.messages) return [];
  
  const messages = [];
  for (const msg of data.messages) {
    const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (msgRes.ok) {
      const msgData = await msgRes.json();
      const headers = msgData.payload?.headers || [];
      const subject = headers.find((h: any) => h.name === 'Subject')?.value;
      const from = headers.find((h: any) => h.name === 'From')?.value;
      const date = headers.find((h: any) => h.name === 'Date')?.value;
      messages.push({ subject, from, date, snippet: msgData.snippet });
    }
  }
  return messages;
}

export async function listChatSpaces(accessToken: string) {
  const url = `https://chat.googleapis.com/v1/spaces`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Chat API error: ${res.statusText}`);
  const data = await res.json();
  return data.spaces?.map((s: any) => ({
    name: s.name,
    displayName: s.displayName,
    type: s.spaceType
  })) || [];
}
