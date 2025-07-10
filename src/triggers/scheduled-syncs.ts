// src/triggers/scheduled-syncs.ts
"use server";

import { getCompliancePaths, saveCompliancePath, logAuditEvent } from "@/lib/actions";
import { analyzeNewsReports } from "@/ai/flows/analyze-news-reports";
import { predictRegulationChange } from "@/ai/flows/predict-regulation-change";

// Mock data source for the prediction engine
const MOCK_NEWS_ARTICLES = [
    {
      headline: "EU Parliament Debates Stricter Rules on Microplastic Shedding from Textiles",
      content: "A new report from the European Environment Agency has highlighted the significant contribution of synthetic textiles to microplastic pollution. Members of Parliament are now pushing for amendments to the ESPR to include mandatory shedding tests and labeling for garments containing more than 50% synthetic fibers."
    },
    {
      headline: "Chemical Watch: Calls for Broader PFAS Restrictions in Consumer Electronics",
      content: "Environmental NGOs are petitioning the ECHA to expand the scope of PFAS restrictions under REACH to include all non-essential uses in consumer electronics, citing concerns over bio-accumulation and difficulties in recycling."
    }
];


export async function runDailyReferenceDataSync(): Promise<{
  syncedItems: number;
  updatedRegulations: string[];
  details: string;
}> {
  console.log("Running scheduled AI-powered regulatory prediction...");
  await logAuditEvent("cron.prediction_engine.start", 'dailyRegulatoryPrediction', {}, "system");

  // 1. Analyze Signals (e.g., from news)
  const newsAnalysis = await analyzeNewsReports({ articles: MOCK_NEWS_ARTICLES });
  console.log("AI analysis of news signals complete:", newsAnalysis);

  // 2. Make a Prediction based on signals
  const prediction = await predictRegulationChange({
    signals: newsAnalysis.keyTakeaways,
    targetIndustry: 'Electronics' // Focus on one for this mock
  });
  console.log("AI regulatory prediction:", prediction);

  // 3. Act on the Prediction
  // Find a compliance path related to the prediction to update it.
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
      requiredKeywords: pathToUpdate.rules.requiredKeywords?.map(r => ({value: r})),
      bannedKeywords: pathToUpdate.rules.bannedKeywords?.map(r => ({value: r})),
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
