const fs = require('fs');
let text = fs.readFileSync('App.tsx', 'utf8');

// The replacement should only happen inside handleSend, but I did it globally.
// First, revert the global replacement:
text = text.replace(/s\.id === \(typeof targetSessionId !== "undefined" \? targetSessionId : activeSessionId\)/g, 's.id === activeSessionId');

// Now, only inside handleSend's setSessions(prev => prev.map(s => s.id === activeSessionId ...)):
text = text.replace(/s\.id === activeSessionId\n          \? \{\n              \.\.\.s,\n              messages: updatedMessages,/g, 's.id === targetSessionId\\n          ? {\\n              ...s,\\n              messages: updatedMessages,');

fs.writeFileSync('App.tsx', text);
console.log("TS fixed");
