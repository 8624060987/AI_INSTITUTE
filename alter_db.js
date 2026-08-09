const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");
const envFile = fs.readFileSync(".env.local", "utf8");
let supabaseUrl = "";
let supabaseKey = "";
for (const line of envFile.split("\n")) {
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) supabaseUrl = line.split("=")[1].trim();
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY=")) supabaseKey = line.split("=")[1].trim();
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("We can't run DDL commands (ALTER TABLE) easily with just the anon key via supabase-js.");
}
run();
