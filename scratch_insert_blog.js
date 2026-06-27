const { createClient } = require('@libsql/client')

const client = createClient({
  url: 'libsql://ewcportfolio-ewceniza9009.aws-ap-northeast-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODI0OTA4MzcsImlkIjoiMDE5ZjA0YmItMWEwMS03NWY4LTk3OWEtMzkzYmVlMjg2YjQxIiwicmlkIjoiOWI5ODgzM2QtNDI2OC00ZjhhLWI0MDgtMDcwMTU5OGZmY2VhIn0.4LbGvRCLhN7Cx8o5pzcPVHOx-MjXjmmH0F7LVbm3eNgav47PKx_4wVkBdf4MEO4BilJZ6BkgyY3LJAv8eUhWCQ'
})

const slug = 'engineering-realtime-telemetry-signalr'
const title = 'Engineering Real-Time Telemetry and Secure Clinical Messaging with SignalR'
const summary = 'A technical deep-dive into the real-time websocket pipelines of Halkyone Clinical OS (EMR), covering SignalR telemetry loops, geospatial privacy masking, and HIPAA-compliant secure messaging.'
const tags = 'SignalR, WebSockets, Real-Time, IoT, HealthTech, .NET, React'
const readTime = '8 min read'

const content = `# Engineering Real-Time Telemetry and Secure Clinical Messaging with SignalR

In modern healthcare infrastructure, real-time connectivity is no longer just a luxury feature—it is a critical requirement. Whether it is streaming dynamic cardiac vitals from an IoT device or maintaining a secure, instant chat session between a patient and their clinician care team, clinical platforms require sub-second synchronization coupled with rigid security.

This deep-dive analyzes the real-time pipelines implemented inside **Halkyone Clinical OS (EMR)**, examining the synchronization mechanics, geospatial privacy masking, and websocket fault-tolerance architectures built across the .NET backend (\`emr-server\`) and Next.js frontend (\`emr-client\`).

---

## 1. High-Level Architectural Flow

Halkyone OS implements three specialized SignalR hubs to isolate concerns:
1. **\`ChatHub\`**: Manages secure, real-time clinical chat threads and unread markers.
2. **\`TelemetryHub\`**: Streams real-time IoT patient vitals (heart rate, SpO2) and handles live clinician dispatch coordinates.
3. **\`NotificationHub\`**: Dispatches system-wide push alerts to specific users.

### The Telemetry & Privacy Masking Pipeline
\`\`\`mermaid
sequenceDiagram
    participant Clinician as Clinician App (GPS)
    participant Server as EMR Web Server (OSRM & TelemetryHub)
    participant DB as SQLite / Turso Database
    participant Navigator as Care Navigator Dashboard (Map)
    
    Clinician->>Server: HTTP POST coordinates (lat, lng)
    Server->>DB: Fetch patient geofence center
    DB-->>Server: Patient Address Coordinates
    Server->>Server: Calculate distanceToTarget
    alt distanceToTarget <= 500m
        Server->>Server: Mask coordinates to (0, 0)
    end
    Server->>Navigator: Broadcast TransitCoordinates (lat, lng, isMasked)
    Navigator->>Navigator: Draw dotted Polyline to Facility
\`\`\`

### The Secure Chat & Thread Read Synchronization
\`\`\`mermaid
sequenceDiagram
    participant Client as ChatInbox (Navigator)
    participant Hub as ChatHub (SignalR)
    participant Database as Database (EF Core)
    participant Patient as Patient Portal (React Client)
    
    Client->>Client: Optimistically render message (temp-id)
    Client->>Hub: Invoke SendMessage (CareThread_ID)
    Hub->>Database: Commit message (IsSeen = false)
    Database-->>Hub: Saved Message Details
    Hub->>Client: Broadcast ReceiveMessage (confirm payload)
    Client->>Client: Replace temp-id with db-id
    Hub->>Patient: Broadcast ReceiveMessage (CareThread group)
    Patient->>Hub: Invoke MarkAsSeen (CareThread_ID, senderRole)
    Hub->>Database: Update IsSeen = true
    Hub->>Client: Broadcast MessageSeen (CareThread group)
    Client->>Client: Turn checkmarks blue (Read)
\`\`\`

---

## 2. Core Code Components

### Backend Hubs (.NET / C#)
The backend leverages \`Microsoft.AspNetCore.SignalR\` to provision sockets. Sockets are guarded by cookie or JWT authorization via the \`[Authorize]\` attribute to guarantee HIPAA compliance.

#### ChatHub (\`ChatHub.cs\`)
The \`ChatHub\` is responsible for dynamic thread groups and read-receipt propagation:
* **Dynamic Group Join/Leave**: When a client enters a chat pane, they invoke \`JoinCareThread(careThreadId)\`, registering their connection in the SignalR group \`CareThread_{careThreadId}\`. This isolates broadcasts to active participants.
* **Ignored Query Filters (Tenant Bypass)**: To mark messages as seen across administrative partitions, the hub invokes \`IgnoreQueryFilters()\` on EF Core. This guarantees that multi-tenant boundaries do not block transaction records during message-seen updates.

\`\`\`csharp
[Authorize]
public class ChatHub : Hub
{
    private readonly IApplicationDbContext _context;

    public ChatHub(IApplicationDbContext context) => _context = context;

    public async Task JoinCareThread(string careThreadId)
        => await Groups.AddToGroupAsync(Context.ConnectionId, $"CareThread_{careThreadId}");

    public async Task MarkAsSeen(string careThreadId, string senderRole)
    {
        if (Guid.TryParse(careThreadId, out var threadGuid))
        {
            var unreadMessages = await _context.ChatMessages
                .IgnoreQueryFilters()
                .Where(m => m.CareThreadId == threadGuid && m.SenderRole != senderRole && !m.IsSeen)
                .ToListAsync();

            if (unreadMessages.Any())
            {
                foreach (var msg in unreadMessages) msg.IsSeen = true;
                await _context.SaveChangesAsync(default);
            }
        }
        await Clients.Group($"CareThread_{careThreadId}").SendAsync("MessageSeen", careThreadId, senderRole);
    }
}
\`\`\`

#### TelemetryHub (\`TelemetryHub.cs\`)
The \`TelemetryHub\` streams patient IoT telemetry and maps clinician transit. It houses a key privacy geofencing algorithm.

### Frontend Connections (Next.js / TypeScript)
On the client, connection state is unified via a singleton service to prevent redundant socket creations:

#### SignalR Service (\`signalr-connection.ts\`)
* **Singleton Instance**: Enforced via \`getInstance()\` to prevent memory leaks and duplicate handshakes.
* **Automatic Reconnection**: Configured with a backoff array \`[0, 2000, 10000, 30000]\` to recover connections if web connectivity drops.
* **JWT Handshake**: Securely passes token values via \`accessTokenFactory\` to authenticate with the authorized API hubs.

\`\`\`typescript
import * as signalR from '@microsoft/signalr';

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private static instance: SignalRService;

  public static getInstance(): SignalRService {
    if (!SignalRService.instance) SignalRService.instance = new SignalRService();
    return SignalRService.instance;
  }

  public async startConnection(token: string) {
    if (this.connection?.state === signalR.HubConnectionState.Connected) return;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(process.env.NEXT_PUBLIC_SIGNALR_ENDPOINT || 'http://localhost:34732/hubs/telemetry', {
        accessTokenFactory: () => token,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    try {
      await this.connection.start();
    } catch (err) {
      setTimeout(() => this.startConnection(token), 5000); // Retry loop
    }
  }
}
export const signalRService = SignalRService.getInstance();
\`\`\`

---

## 3. High-Fidelity Algorithms Implemented

### A. The 500m Privacy Masking Geofence
Clinicians in transit expose real-time coordinate streams so dispatchers can track route progress. However, exposing the exact coordinates when they approach a patient's home breaches security and privacy guidelines. 

To solve this, \`TelemetryHub\` implements a geofence algorithm:
* **The Math**: The server calculates the distance between the clinician's current coordinates and the patient's home coordinates.
* **The Mask**: If the clinician is **within 500 meters** of the target, the server alters the coordinates to \`(0, 0)\` and flags \`isMasked = true\` in the broadcast payload.
* **The Visual**: The client map draws the routing line, but hides the clinician's exact marker, displaying a general "near site" status instead.

\`\`\`csharp
public async Task BroadcastTransitCoordinates(Guid patientId, decimal latitude, decimal longitude, decimal distanceToTargetMeters)
{
    bool isMasked = distanceToTargetMeters <= 500;
    await Clients.Group(patientId.ToString()).SendAsync("ReceiveTransitCoordinates", new {
        patientId,
        latitude = isMasked ? 0 : latitude, // Geofenced mask
        longitude = isMasked ? 0 : longitude,
        isMasked,
        distance = distanceToTargetMeters
    });
}
\`\`\`

### B. Animated SVG ECG Cardiac Waveform
When live IoT heart telemetry streams to the patient dashboard, rendering simple text numbers lacks visual impact. The Next.js frontend implements a fully reactive SVG cardiac trace:
* **Sequence Path**: Coordinates define a realistic **P-Q-R-S-T sequence** (representing the cardiac cycle of atrial depolarization, ventricular depolarization, and ventricular repolarization).
* **CSS Sweeper**: A keyframe animation loops the \`stroke-dashoffset\` dynamically:
  \`\`\`css
  @keyframes ecg-sweep {
    0% { stroke-dashoffset: 200; }
    100% { stroke-dashoffset: 0; }
  }
  \`\`\`
* **Interactive Flash**: The heart icon scales (\`scale-125\`) dynamically in sync with incoming \`ReceiveVitals\` heartbeats.

---

## 4. Error Resilience & Recovery

* **Websocket Reconnect Group Re-joining**: When a SignalR connection experiences a network dropout and reconnects via \`.onreconnected()\`, it loses its hub group memberships. Halkyone resolves this by registering an automatic listener on reconnect:
  \`\`\`typescript
  connection.onreconnected(() => {
    joinAllThreadGroups(connection); // Re-registers connections in CareThread groups
    refetch(); // Refetches messages to catch up on missed inputs
  });
  \`\`\`
* **Initial Retry Fallback**: If the socket server is entirely unreachable on startup, the connection builder catch block schedules a reconnect timer using \`setTimeout(() => startConnection(token), 5000)\` to maintain a steady retry loop.

---

## 5. Third-Party Integrations & Configurations

* **Redis Backplane**: Sockets are stateful connections. In production, to scale out across multiple server nodes, the backend integrates \`Microsoft.AspNetCore.SignalR.StackExchangeRedis\` so messages sent to server A are correctly routed to groups connected to server B.
* **OSRM Routing Engine**: Connects to the **Open Source Routing Machine** (OSRM) to calculate coordinates, paths, and clinician transit drive times dynamically.
* **Nominatim Geocoding API**: Integrates with OpenStreetMap Nominatim to resolve coordinates into structured clinical addresses in real time.
* **Tenant Bypass Control**: Built-in boolean configurations (\`EnableSignalR\`) inside \`TenantConfiguration\` tables let administrators disable websocket feeds dynamically to save bandwidth on low-connectivity remote sites.

By combining SignalR's lightweight socket transport, JWT security, and client-side singleton connections with geofencing algorithms, Halkyone Clinical OS delivers a robust, real-time, HIPAA-compliant communication and vital monitoring suite.
`

async function run() {
  try {
    await client.execute({
      sql: 'DELETE FROM blogs WHERE slug = ?',
      args: [slug]
    })
    await client.execute({
      sql: 'INSERT INTO blogs (id, slug, title, content, summary, tags, published, likes, read_time) VALUES (?, ?, ?, ?, ?, ?, 1, 15, ?)',
      args: ['550e8400-e29b-41d4-a716-446655440000', slug, title, content, summary, tags, readTime]
    })
    console.log('Successfully inserted blog post!')
    process.exit(0)
  } catch (err) {
    console.error('Error inserting blog:', err)
    process.exit(1)
  }
}

run()
