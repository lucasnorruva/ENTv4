// src/triggers/scheduled-syncs.ts
"use server";

import { getCompliancePaths, saveCompliancePath, logAuditEvent } from "@/lib/actions";
import { predictRegulationChange } from "@/ai/flows/predict-regulation-change";

export async function runDailyReferenceDataSync(): Promise<{
  syncedItems: number;
  updatedRegulations: string[];
  details: string;
}> {
  console.log("Running scheduled AI-powered regulatory prediction...");
  await logAuditEvent("cron.prediction_engine.start", 'dailyRegulatoryPrediction', {}, "system");

  // This mock simulates deriving signals from internal data, not external news.
  const internalSignals = [
    'Increased number of products failing RoHS compliance in the last month.',
    'High number of service tickets related to battery degradation.',
  ];

  const prediction = await predictRegulationChange({
    signals: internalSignals,
    targetIndustry: 'Electronics',
  });
  console.log("AI regulatory prediction:", prediction);

  const allPaths = await getCompliancePaths();
  const pathToUpdate = allPaths.find(p => 
    prediction.impactedRegulations.some(reg => p.regulations.includes(reg)) && p.category === 'Electronics'
  );

  if (!pathToUpdate) {
    const details = "AI made a prediction, but no matching compliance path was found to update.";
    console.log(details);
    await logAuditEvent("cron.prediction_engine.end", 'dailyRegulatoryPrediction', { details }, "system");
    return { syncedItems: 0, updatedRegulations: [], details };
  }

  // Make the AI-driven update
  const oldScore = pathToUpdate.rules.minSustainabilityScore || 0;
  const newScore = Math.min(100, oldScore + 1); // Increment score as a mock update
  
  const updatedValues = {
      name: pathToUpdate.name,
      description: `${pathToUpdate.description} [Auto-updated based on AI prediction: ${prediction.prediction}]`, // Add a note
      category: pathToUpdate.category,
      jurisdiction: pathToUpdate.jurisdiction,
      regulations: pathToUpdate.regulations.map(r => ({value: r})),
      minSustainabilityScore: newScore,
      requiredKeywords: pathToUpdate.rules.requiredKeywords?.map(r => ({value: r})) || [],
      bannedKeywords: pathToUpdate.rules.bannedKeywords?.map(r => ({value: r})) || [],
  }

  await saveCompliancePath(updatedValues, "system:prediction_engine", pathToUpdate.id);
  
  const details = `Acted on prediction: "${prediction.prediction}". Updated path '${pathToUpdate.name}': minSustainabilityScore changed from ${oldScore} to ${newScore}.`;
  
  await logAuditEvent(
    "system.sync.prediction_update",
    pathToUpdate.id,
    {
      change: details,
      prediction,
    },
    "system",
  );

  console.log(`Regulatory prediction sync complete. ${details}`);
  
  return {
    syncedItems: 1,
    updatedRegulations: [pathToUpdate.name],
    details,
  };
}
