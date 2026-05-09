import type { FrequencyBand, FrequencyRequest, Service, Venue } from './types';

export interface AppData {
  bands: FrequencyBand[];
  services: Service[];
  venues: Venue[];
  allRequests: FrequencyRequest[];
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"') {
        if (line[i + 1] === '"') { current += '"'; i++; }
        else inQuote = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuote = true;
    } else if (ch === ',') {
      values.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  values.push(current.trim());
  return values;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n').map(l => l.replace(/\r$/, ''));
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1)
    .filter(l => l.trim())
    .map(line => {
      const values = parseCSVLine(line);
      return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
    });
}

export async function loadData(): Promise<AppData> {
  const [bandsText, servicesText, venuesText, requestsText] = await Promise.all([
    fetch('/data/bands.csv').then(r => r.text()),
    fetch('/data/services.csv').then(r => r.text()),
    fetch('/data/venues.csv').then(r => r.text()),
    fetch('/data/requests.csv').then(r => r.text()),
  ]);

  const bands: FrequencyBand[] = parseCSV(bandsText).map(row => ({
    id: row.id,
    name: row.name,
    startMHz: parseFloat(row.startMHz),
    endMHz: parseFloat(row.endMHz),
    color: row.color,
    snapMHz: row.snapMHz ? parseFloat(row.snapMHz) : undefined,
    channelMHz: row.channelMHz ? parseFloat(row.channelMHz) : undefined,
  }));

  const services: Service[] = parseCSV(servicesText).map(row => ({
    id: row.id,
    name: row.name,
    color: row.color,
    bandIds: row.bandIds.split(';').map(s => s.trim()).filter(Boolean),
  }));

  const serviceColorMap = Object.fromEntries(services.map(s => [s.id, s.color]));

  const venueRows = parseCSV(venuesText);
  const requestRows = parseCSV(requestsText);

  const venueRequestMap = new Map<string, FrequencyRequest[]>();
  for (const row of requestRows) {
    const req: FrequencyRequest = {
      id: row.id,
      label: row.label,
      device: row.device,
      bandwidthMHz: parseFloat(row.bandwidthMHz),
      serviceId: row.serviceId,
      color: serviceColorMap[row.serviceId] ?? '#94a3b8',
      duplexOffsetMHz: row.duplexOffsetMHz ? parseFloat(row.duplexOffsetMHz) : undefined,
    };
    if (!venueRequestMap.has(row.venueId)) venueRequestMap.set(row.venueId, []);
    venueRequestMap.get(row.venueId)!.push(req);
  }

  const venues: Venue[] = venueRows.map(row => ({
    id: row.id,
    name: row.name,
    requests: venueRequestMap.get(row.id) ?? [],
  }));

  const allRequests = venues.flatMap(v => v.requests);

  return { bands, services, venues, allRequests };
}
