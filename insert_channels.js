const https = require("https");
const url = "https://stkcgemeowrjavcuuyqa.supabase.co/rest/v1/community_channels";

const channels = [
  { name: 'General', type: 'general' },
  { name: 'Announcements', type: 'announcements' },
  { name: 'Resources', type: 'resources' },
  { name: 'Doubts', type: 'doubts' }
];

const postData = JSON.stringify(channels);

const options = {
  method: 'POST',
  headers: {
    "apikey": "sb_publishable_I3bls7X7UGqLOArMCYlvlA_4FUH-4rF",
    "Authorization": "Bearer sb_publishable_I3bls7X7UGqLOArMCYlvlA_4FUH-4rF",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  }
};

const req = https.request(url, options, (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => console.log("INSERT RES:", data));
});
req.write(postData);
req.end();
