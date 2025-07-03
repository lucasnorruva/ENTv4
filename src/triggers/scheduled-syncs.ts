// src/triggers/scheduled-syncs.ts
"use server";

import { getCompliancePaths, saveCompliancePath, logAuditEvent } from "@/actions/index";

export async function runDailyReferenceDataSync(): Promise<{
  syncedItems: number;
  updatedRegulations: string[];
  details: string;
}> {
  console.log("Running scheduled reference data sync...");

  const compliancePaths = await getCompliancePaths();
  if (compliancePaths.length === 0) {
    console.log("No compliance paths to update.");
    return { syncedItems: 0, updatedRegulations: [], details: "No paths found." };
  }

  const pathIndexToUpdate = Math.floor(Math.random() * compliancePaths.length);
  const pathToUpdate = compliancePaths[pathIndexToUpdate];
  
  const oldScore = pathToUpdate.rules.minSustainabilityScore || 0;
  const newScore = Math.min(100, oldScore + 1);
  
  const updatedValues = {
      name: pathToUpdate.name,
      description: pathToUpdate.description,
      category: pathToUpdate.category,
      regulations: pathToUpdate.regulations.map(r => ({value: r})),
      minSustainabilityScore: newScore,
      requiredKeywords: pathToUpdate.rules.requiredKeywords?.map(r => ({value: r})),
      bannedKeywords: pathToUpdate.rules.bannedKeywords?.map(r => ({value: r})),
  }

  await saveCompliancePath(updatedValues, "system", pathToUpdate.id);
  
  const details = `Updated compliance path '${pathToUpdate.name}': minSustainabilityScore changed from ${oldScore} to ${newScore}.`;
  
  await logAuditEvent(
    "system.sync.reference_data",
    pathToUpdate.id,
    {
      change: details,
    },
    "system",
  );

  console.log(`Reference data sync complete. ${details}`);
  
  return {
    syncedItems: 1,
    updatedRegulations: [pathToUpdate.name],
    details,
  };
}
