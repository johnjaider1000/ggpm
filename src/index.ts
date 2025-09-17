#!/usr/bin/env node

import { NpmWrapper } from "./services/NpmWrapper";

async function main(): Promise<void> {
  try {
    const wrapper = new NpmWrapper();
    await wrapper.run();
  } catch (error) {
    console.error("❌ Error executing ggpm:", (error as Error).message);
    process.exit(1);
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  main();
}
