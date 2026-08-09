const https = require("https");
const url = "https://stkcgemeowrjavcuuyqa.supabase.co/rest/v1/community_channels?select=*";
const options = {
  headers: {
    "apikey": "sb_publishable_I3bls7X7UGqLOArMCYlvlA_4FUH-4rF",
    "Authorization": "Bearer sb_publishable_I3bls7X7UGqLOArMCYlvlA_4FUH-4rF"
  }
};
https.get(url, options, (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => console.log("DATA:", data));
});
