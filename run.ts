import { readFileSync } from "fs";
import { CallHandler } from "./src/call-handler";

const csv = readFileSync("./examples/call-batch.csv", "utf-8");
const handler = new CallHandler();

handler.handleBatch(csv).then((response) => {
  console.log("[handler] response:", response);
});

// Keep process alive long enough for async worker to finish (~500ms)
setTimeout(() => {}, 1000);
