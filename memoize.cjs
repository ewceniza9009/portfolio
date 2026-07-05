
const fs = require('fs');
const files = ['AnalyticsTab.tsx', 'BlogsTab.tsx', 'DashboardHeader.tsx', 'FocusModeOverlay.tsx', 'InlinePreviewTabs.tsx', 'LoginView.tsx', 'MessagesTab.tsx', 'SettingsTab.tsx'];
for (const file of files) {
  const path = 'src/components/admin/' + file;
  let content = fs.readFileSync(path, 'utf8');
  if (!content.includes('import React')) {
    content = 'import React from \'react\';\n' + content;
  }
  const match = content.match(/export default function (\w+)\s*\(/);
  if (match) {
    const name = match[1];
    content = content.replace(/export default function (\w+)\s*\(/, 'function ' + name + '(');
    content += '\nexport default React.memo(' + name + ');\n';
    fs.writeFileSync(path, content);
    console.log('Memoized ' + file);
  }
}

