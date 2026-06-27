// Test exact frontend encoding pattern vs Node buffer
const mermaidCode = `flowchart TD
    subgraph "Monolith: ACID Transaction"
        A[Begin Transaction] --> B[Update Stock]
        B --> C[Create Order]
        C --> D[Create Notification]
        D --> E[Commit or Rollback]
        E --> F{Success?}
        F -->|Yes| G[All Changes Applied Atomically]
        F -->|No| H[All Changes Reverted]
    end

    subgraph "Microservices: Saga Pattern"
        I[Begin Saga] --> J[Order Service: Create Order]
        J --> K[Payment Service: Reserve Payment]
        K --> L{Payment OK?}
        L -->|Yes| M[Cart Service: Clear Cart]
        L -->|No| N[Order Service: Cancel Order<br/>Compensating Transaction]
        M --> O[Inventory Service: Decrement Stock]
        O --> P{All Steps Succeed?}
        P -->|No| Q[Run Compensating Actions<br/>in Reverse Order]
    end

    style A fill:#27ae60,stroke:#1e8449,color:#fff
    style G fill:#27ae60,stroke:#1e8449,color:#fff
    style H fill:#e74c3c,stroke:#b71c1c,color:#fff
    style Q fill:#e74c3c,stroke:#b71c1c,color:#fff`

const initConfig = `%%{init: {"theme": "dark", "themeVariables": {"fontFamily": "Outfit, Inter, system-ui, sans-serif"}}}%%`
const formatted = initConfig + '\n' + mermaidCode

// Test 1: Buffer base64url (works)
const b64url = Buffer.from(formatted).toString('base64url')
const r1 = await fetch('https://mermaid.ink/svg/' + b64url)
console.log('Test 1 (base64url):', r1.status, r1.ok ? 'OK' : 'FAIL')

// Test 2: Buffer base64 (standard)
const b64std = Buffer.from(formatted).toString('base64')
const r2 = await fetch('https://mermaid.ink/svg/' + b64std)
console.log('Test 2 (base64 std):', r2.status, r2.ok ? 'OK' : 'FAIL')

// Test 3: Simulate frontend btoa(unescape(encodeURIComponent(str)))
const encoded = encodeURIComponent(formatted)
const unescaped = unescape(encoded)
const b64fe = Buffer.from(unescaped, 'latin1').toString('base64')
const r3 = await fetch('https://mermaid.ink/svg/' + b64fe)
console.log('Test 3 (btoa polyfill):', r3.status, r3.ok ? 'OK' : 'FAIL')

// Test 4: Just btoa straight (all ASCII)
const b64direct = Buffer.from(formatted).toString('base64')
// Compare b64direct vs b64fe - they should be identical for ASCII
console.log('\nb64std  length:', b64std.length)
console.log('b64fe   length:', b64fe.length)
console.log('Encoded same?', b64std === b64fe)

// Test 5: Check if any non-ASCII chars in formatted
for (let i = 0; i < formatted.length; i++) {
  if (formatted.charCodeAt(i) > 127) {
    console.log(`Non-ASCII char at ${i}: '${formatted[i]}' (code ${formatted.charCodeAt(i)})`)
  }
}
console.log('\nAll characters ASCII:', ![...formatted].some(c => c.charCodeAt(0) > 127))

process.exit(0)
