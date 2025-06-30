# Recommendations for Prompt Design (Gemini AI)

To ensure the AI modules (powered by Gemini) produce predictable and composable outputs, we follow best practices in prompt engineering. This is crucial for consistency (so that our code can parse AI outputs reliably) and for maintaining a professional, factual tone in AI-generated content (as these outputs may be seen by users or used for compliance). Here we outline guidelines for designing prompts and handling AI responses:

## Prompt Structure and Consistency

### Use Clear Instruction-Context Separation

We structure prompts with a distinct instruction section and input data section. For example, we might start with a system message like "You are an expert compliance assistant..." and then separate with a delimiter (like `"""` or a token) before listing the product data ([medium.com](https://medium.com)). This ensures the model distinguishes our request from the data it’s analyzing.

**Example:**

```
[System] You are an AI that provides compliance gap analysis.
[User] Product Data: ... [detailed JSON or text]
Requirements: ... [list]
Provide output as JSON with fields "gaps" and "summary".
```

By consistently formatting this, the model learns to expect a certain pattern.

### Be Specific and Descriptive in Instructions

Avoid vague prompts. If we want a list of suggestions, explicitly say “Provide 3 suggestions, each starting with an action verb, in JSON format” ([medium.com](https://medium.com)). The more we pin down the format and content, the less variance. We explicitly specify output format whenever possible (especially since we parse it). For instance, for ESG:

**Output format:**

```json
{
  "score": "<number>",
  "environmental": "<number>",
  "social": "<number>",
  "governance": "<number>",
  "summary": "<text>"
}
```

This is included in the prompt so the model is guided to comply with the JSON structure. If the model still returns slight deviations, our post-processor will adjust (like adding missing quotes or handling minor differences).

### Few-Shot Examples for Edge Cases

For complex tasks, we might include a brief example in the prompt (few-shot learning) to illustrate what we want ([medium.com](https://medium.com)). E.g., “Example: For a product with X, Y, Z, the output gaps might be ...” and show a JSON example. However, since each call costs tokens, we carefully use this only if the model needed extra training signal. Another approach is fine-tuning or custom training, but with Gemini, we probably rely on prompting.

If we notice the model often strays (like sometimes writes an essay instead of JSON), we can include a short dummy example to reinforce the format.

### Control Tone and Content

We instruct the model to keep language factual, neutral, and concise. For compliance, it's important it doesn't speculate beyond data. So prompt might include: “If data is insufficient, state 'unknown' or leave field blank, do not fabricate.” Also, e.g., “Use formal language without marketing fluff.” This ensures consistency in style across outputs.

### Token Limits and Chaining

If a single prompt would be too large (product data + lots of regulations might exceed model context), we may break tasks into chained prompts:

1.  First, ask model to summarize product key points.
2.  Then feed that summary with requirements to check compliance.

This chaining (using outputs of one prompt in another) helps manage context and potentially uses specialized prompts for each step. We design these in a way that output of step 1 is easily fed to step 2 (structuring it or tagging it).

However, chaining adds complexity and latency, so we do it only if necessary (maybe for extremely large data sets). In normal cases, a single prompt can handle it given typical product data sizes.

## Ensuring Predictable AI Output

### Validation and Post-Processing

We never fully trust the AI output blindly. After the model responds, we run a validation layer:

-   If expecting JSON, attempt to parse it. If parse fails, we either attempt to fix simple errors (like add a missing comma or quote if the structure is obvious) or we can re-prompt the model asking it to correct format.
-   We also validate values (e.g., ESG score should be 0-100, if model gave 110 or "B+", we detect and normalize or flag it).
-   If the model provides extra text outside JSON, we trim it out if possible. We explicitly instruct the model e.g., “No additional explanation outside JSON” to minimize this.

### Deterministic or Temperature Settings

When calling the model, if API allows, we set parameters to favor consistency. For example, using a relatively low temperature (like 0.2-0.5) to make outputs more deterministic/repetitive (the model will be less creative and more likely to output in the taught format). This reduces random variations. We might use higher temperature for suggestions (to get creative ideas), but still moderate to avoid off-the-wall suggestions.

For compliance checks, a deterministic approach (maybe even temperature 0) ensures if given same input, we get same output, which is desirable for auditing and debugging.

### Prompt Versioning

Just like API version, if we improve a prompt significantly, that's a change that could slightly alter outputs. We document prompt changes (especially if they might affect downstream systems or require re-acceptance of AI text). We could tie prompt templates to our platform version. For instance, `compliance_prompt_v2` might include new logic. We test that the new prompt still works on past known cases (regression testing on AI outputs).

If there's a major change (like we add 10 more regulations in the prompt), we ensure it's still within token limit and doesn't confuse the model (we might test with a sample product to see if output still good).

We keep older prompt versions accessible for debugging if needed (maybe as comments in code or an archive) to see why an earlier output might differ.

### Modular Prompt Functions

We maintain our prompts in a structured way in code (not scattered strings). For example:

```javascript
const generateCompliancePrompt(productData) {
  return `
    You are an AI compliance checker...
    PRODUCT DATA:
    ${productData}
    REGULATIONS:
    ${listRelevantRegulations(productData.category)}
    OUTPUT: JSON with "gaps" and "summary"
  `;
}
```

This modular approach allows easy updates and ensures all developers use the same format. We also log the prompts (with sensitive data masked if needed) for analysis so we can refine them.

### Composability

We want AI outputs that can be easily combined or inserted into our documents. For example, the ESG summary might be used in the passport directly. So we ensure the model’s language is appropriate for that context:

-   Possibly instruct model to write summary in third person without referring to itself or the process. E.g., "The product demonstrates..." instead of "I have calculated...".
-   For suggestions, ensure each suggestion is standalone and actionable, since we may list them as bullet points in the UI.

### Avoiding Unwanted Content

We explicitly instruct the AI to avoid certain pitfalls:

-   No legal advice or definitive compliance judgment (word it as suggestions or findings).
-   No identifying individuals or unrelated info. (Not too relevant here, but a general practice).
-   If something is uncertain, say "Not enough data to assess X." It's better than hallucinating an answer. We phrase prompts to prefer saying “unknown” than guessing.
-   Use of model knowledge vs. provided data: For compliance, regulations text is more authoritative. We feed the pertinent points. We don't expect model to know latest law text precisely unless given. So we try to provide what it needs. If model knowledge fills gaps (like it knows threshold values), that's fine but we should confirm those in our logic too.

### Testing AI Outputs

Part of our QA is reviewing a sample of AI outputs for quality:

-   We have sample products and have subject matter experts (like a compliance officer) review if the AI’s gaps and suggestions make sense and are correct.
-   If AI ever gives a wrong or dangerous suggestion, we adjust the prompt or possibly add a rule-based check to catch that. For example, if AI fails to flag something critical, we might put an extra check in code for that condition as backup.

Thomson Reuters noted GenAI can accelerate data analysis but needs oversight ([tax.thomsonreuters.com](https://tax.thomsonreuters.com)). We implement that oversight via both human review and automated validations.

### Logging and Monitoring AI

We log model responses along with prompts (in a secure way) so if a user says "This suggestion is weird", we can trace back to the prompt and improve it. Also, we count how often the model needed re-prompt or output was unparseable. If >1% calls require a fix, that's a signal to refine the prompt.

### Compositional Outputs for Future Use

-   If we plan to feed one AI output into another (like ESG summary might feed into an overall product sustainability narrative), we ensure the first output is formatted simply (like key points listed) to ease reuse.
-   Also, building a small knowledge graph or at least structured storage of AI findings (like storing each compliance gap as structured data) allows future AI queries (maybe a chatbot answering "Is this product compliant with X?") to retrieve info without recomputation.

So our prompt design leans toward structured outputs (JSON) where feasible, making them composable and easier for other code or AI to consume.

### Example Prompt (Compliance Gap)

```
SYSTEM: You are an expert compliance auditor AI. You strictly output JSON.
USER:
"""
Product:
Name: ABC Gadget
Category: Electronics
Substances: Contains Lead 0.2%, Cadmium 0%
Certifications: CE (EMC, LVD)
...
Requirements:
1. RoHS: Pb <0.1%, Cd <0.01%, ...
2. REACH: SVHC >0.1% must be reported.
3. WEEE: Provide recycling info.
4. ...
"""
Give compliance_gaps as JSON.
```

We expect output:

```json
{
  "gaps": [
    {"regulation": "RoHS", "issue": "Lead content 0.2% exceeds 0.1% limit."},
    {"regulation": "WEEE", "issue": "No recycling information provided."}
  ],
  "summary": "Non-compliance with RoHS (lead too high) and missing recycling info for WEEE."
}
```

The instructions and examples push the model towards that exact style. (Following these prompt design guidelines ensures that the AI behaves as a reliable component of the system, rather than a whimsical black box. By being explicit, specific ([medium.com](https://medium.com)), and iterative in our approach, we make the AI’s contributions consistent and trustworthy. This is crucial in a compliance context where unpredictable AI output could lead to errors or confusion. In essence, we treat prompt design as part of the software code – versioned, tested, and refined – to harness Gemini’s capabilities in a controlled, “composable” manner.)
