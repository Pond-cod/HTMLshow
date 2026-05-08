const https = require('https');
const fs = require('fs');

https.get('https://html-show.vercel.app/api/proxy-external?url=https://gemini.google.com/share/57593456eafd', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('out.html', data);
    console.log('done');
  });
});
