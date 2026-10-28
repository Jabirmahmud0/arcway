import "dotenv/config";
import { productionConfigurationErrors } from "../server/_core/production";
const errors = productionConfigurationErrors({ ...process.env, NODE_ENV: "production" });
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else console.log("Production configuration passed. Deploy with the matching browser build and persistent private storage.");
