import { validateCampaignData } from "../src/lib/campaigns.mjs";

const errors = await validateCampaignData();

if (errors.length) {
  console.error("Campaign data validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("Campaign data validation OK.");
}
