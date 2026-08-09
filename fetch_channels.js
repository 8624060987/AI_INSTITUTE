import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://stkcgemeowrjavcuuyqa.supabase.co", "sb_publishable_I3bls7X7UGqLOArMCYlvlA_4FUH-4rF");

async function test() {
  const { data, error } = await supabase.from("community_channels").select("*");
  console.log("Channels:", data);
  console.error("Error:", error);
}
test();
