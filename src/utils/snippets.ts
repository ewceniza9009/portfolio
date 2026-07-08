function buildSnippet(lines: string[]): string {
  return '\n' + lines.join('\n') + '\n'
}

export const STEPS_SNIPPET = buildSnippet([
  '```interactive',
  '<!-- preset: steps -->',
  '<p>Click <strong>Next</strong> to reveal each step of this concept.</p>',
  '<p>Step 2 content goes here. You can use <em>HTML</em> inside steps.</p>',
  '<p>Step 3 - add as many steps as you need.</p>',
  '```',
])

export const QUIZ_SNIPPET = buildSnippet([
  '```interactive',
  '<!-- preset: quiz -->',
  '<div data-question="What is 2 + 2?" data-options="3|4|5|6" data-correct="1"></div>',
  '<div data-question="What color is the sky?" data-options="Green|Blue|Red|Yellow" data-correct="1"></div>',
  '```',
])

export function getGenericSnippet(): string {
  return buildSnippet([
    '```interactive',
    '<script type="module">',
    "const container = document.currentScript.parentElement;",
    "",
    "const btn = document.createElement('button');",
    "btn.textContent = 'Click me!';",
    "btn.style.cssText = 'padding:12px 24px;border-radius:8px;background:var(--accent);color:var(--bg-primary);font-weight:bold;cursor:pointer;border:none;font-size:14px;';",
    "",
    "const output = document.createElement('div');",
    "output.style.cssText = 'margin-top:16px;padding:16px;border-radius:8px;background:var(--bg-card);border:1px solid var(--border);font-size:14px;color:var(--text-primary);';",
    "output.textContent = 'Interact with the element above.';",
    "",
    "let count = 0;",
    "btn.onclick = () => { count++; output.textContent = 'Clicked ' + count + ' time' + (count !== 1 ? 's' : '') + '!'; };",
    "",
    "container.appendChild(btn);",
    "container.appendChild(output);",
    '</script>',
    '```',
  ])
}

export const INTERACTIVE3D_SNIPPET = buildSnippet([
  '```interactive-3d',
  '<canvas id="scene1"></canvas>',
  '<script type="module">',
  "  import * as THREE from 'three'",
  '  // Your Three.js code here',
  '</script>',
  '```',
])

export const MERMAID_SNIPPET = buildSnippet([
  '```mermaid',
  'flowchart TB',
  '    A["Start"] --> B["End"]',
  '```',
])

export const CHART_SNIPPET = buildSnippet([
  '```chart',
  'type: bar',
  'title: My Chart',
  'labels: [A, B, C, D]',
  'datasets:',
  '  - label: Series 1',
  '    data: [10, 20, 30, 40]',
  '    color: #3b82f6',
  '  - label: Series 2',
  '    data: [15, 25, 35, 45]',
  '    color: #10b981',
  '```',
])

export const CODEHIKE_SNIPPET = buildSnippet([
  '```codehike',
  'const greeting = "Hello, Code Hike!";',
  'console.log(greeting);',
  '```',
])

export const CH_FULL_BLOCK_SNIPPET = buildSnippet([
  '```codehike',
  '// !focus',
  'const greeting = "Hello, Code Hike!";',
  '// !mark(green)',
  'console.log(greeting);',
  '// !callout(This prints to console)',
  'alert(greeting);',
  '```',
])

export const REMOTION_SNIPPET = buildSnippet([
  '```remotion',
  '{',
  '  "src": "https://example.com/video.mp4",',
  '  "title": "My Video",',
  '  "controls": true,',
  '  "loop": false',
  '}',
  '```',
])
