const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf8');
code = code.replace(
  /<Button variant="ghost" size="icon" aria-label="Notifications">\s*<Bell className="h-5 w-5" \/>\s*<\/Button>/,
  '<NotificationDropdown />'
);
fs.writeFileSync('src/components/layout/Navbar.tsx', code);
