const fs = require('fs');
let code = fs.readFileSync('src/components/video/SubscribeButton.tsx', 'utf8');

code = code.replace(
  /className=\{cn\(layout === 'shorts' \? className : \[isSubscribed \? "" : "px-6 rounded-full", className\]\)\}/,
  "className={cn(layout === 'shorts' ? className : (isSubscribed ? \"\" : \"px-6 rounded-full\"), layout !== 'shorts' ? className : \"\")}"
);

fs.writeFileSync('src/components/video/SubscribeButton.tsx', code);
