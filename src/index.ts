#!/usr/bin/env node

const { runWrapper } = require("./npm-wrapper.js");
import { ApplicationFactory } from "./factories/ApplicationFactory";

async function main(): Promise<void> {
  try {
    const app = ApplicationFactory.create(runWrapper);
    await app.run();
  } catch (error) {
    console.error("❌ Error ejecutando ggpm:", (error as Error).message);
    process.exit(1);
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  main();
}
