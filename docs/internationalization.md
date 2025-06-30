# Internationalization and Localization

As a globally deployed platform, the DPP system is built with internationalization (i18n) in mind. All user-facing text, units, and regulatory references can adapt to the user’s locale. Moreover, the platform supports rendering the product passport content in multiple languages, which is crucial when products cross borders and have stakeholders speaking different languages. This section describes our approach to i18n, multi-language content, and how we handle translations and local regulatory context.

## i18n Infrastructure

Our platform uses a robust i18n infrastructure (leveraging either a framework like i18next for web or utilizing services like Firebase Remote Config or third-party localization platforms for dynamic content). Key features:

-   **Language Packs**: UI text and messages are stored in resource bundles for each supported language (e.g., English, French, Arabic, Chinese, etc.). Adding a new language is as simple as providing a new set of translations for these resources. We currently maintain translations for all major interface elements, error messages, and notifications.
-   **Dynamic Language Switching**: Users can select their preferred language in the interface, or it can be auto-detected from their browser settings. The change takes effect immediately (no re-login required), and all UI elements render in the chosen language.
-   **Date/Number/Unit Localization**: The platform automatically formats dates, numbers, and units based on locale. For example, a weight might show in kilograms in one locale vs pounds in another, or a date might display as DD/MM/YYYY vs MM/DD/YYYY depending on region. This is handled by our localization library to ensure consistency.
-   **Right-to-Left (RTL) Support**: For languages such as Arabic, the UI seamlessly switches to an RTL layout. We have tested components to ensure they render correctly in both LTR and RTL orientations.
-   **Firebase Integration (optional)**: For clients that want to manage certain text (like help content or glossary terms) dynamically, we can fetch those from Firebase or a CMS. This means updates to explanatory text or disclaimers don’t require a code deployment and can be localized on the fly.

Below is an excerpt of a localization JSON showing translations for a couple of text strings in different languages:

```json
{
  "passport_status_expired": {
    "en": "This product passport has expired.",
    "fr": "Ce passeport produit est expiré.",
    "de": "Dieser Produktpass ist abgelaufen.",
    "ar": "انتهت صلاحية جواز المنتج الرقمي هذا."
  },
  "action_override": {
    "en": "Override",
    "fr": "Outrepasser",
    "de": "Übersteuern",
    "ar": "تجاوز"
  }
}
```

This illustrates how the system stores multiple localizations for each key. The UI would use the key `passport_status_expired` and show the message in the appropriate language context.

## Multi-language DPP Rendering

Beyond the UI chrome, the content of the Digital Product Passports themselves may need translation. For example, a product description or a compliance note might need to be accessible in several languages:

-   **Field Level Localization**: The DPP schema supports multi-language fields. For any text attribute (like “Product Name” or “Material Description”), the database can store translations. E.g., `product_name_en`, `product_name_fr`, etc., or a structure like `product_name: {en: "...", fr: "..."}`. This allows the actual product data to appear in the viewer’s language when possible.
-   **Document Language Toggle**: In the UI, if a passport has multiple languages available, a viewer can switch the language of the content. For instance, an Italian user could switch an English passport to display Italian, seeing all fields (that have translations) in Italian.
-   **Default by Region/User**: The system can automatically show the passport in the language that matches the user’s locale, if available. If not available, it falls back to a default (often English or the original language of entry).
-   **AI Translation Aid**: If a certain field is not translated, the platform can use Gemini AI to provide an on-the-fly translation suggestion. This is labeled clearly (e.g., “AI-translated”) and can be reviewed by a human for accuracy. Over time, these suggestions can be saved to enhance the passport’s data.
-   **Regulatory Texts**: Some passports might include standard regulatory phrases or safety instructions. We maintain a library of these in multiple languages, so if a passport needs to display “Compliant with EU Regulation XYZ”, we can show the exact phrasing in French or German as needed.
-   **Formatting**: Certain languages have text expansion (German tends to be longer, for example) — our UI is designed with flexible layouts to accommodate this without breaking.

## Smart Label Translation

An important aspect of DPPs is the use of labels or codes for materials, chemicals, or components which might be technical. The platform incorporates logic to intelligently translate or clarify such labels:

-   **Material and Component Labels**: Suppose a DPP lists a material code “PA66 GF30” (a plastic type). A casual user might not know what that means. The system can have a built-in glossary that identifies this as “Polyamide 66, 30% glass fiber” and then, using i18n, display a more understandable name in the user’s language.
-   **AI-driven Label Recognition**: If an unknown term appears, Gemini AI can attempt to detect what it is (maybe from context or an internal database) and provide a translation or description. For instance, a French user sees “Stainless Steel (Grade 304)” which is originally in English; the platform could show “Acier inoxydable (Grade 304)” automatically.
-   **Regulatory Codes Interpretation**: Many products have codes like “REACH SVHC: Yes” or “RoHS Compliant”. The platform will show a tooltip or note explaining “SVHC” (Substance of Very High Concern) in the user’s language, perhaps with a link to more info. These explanations are pre-translated and reviewed by compliance experts for accuracy in each language.
-   **Contextual Localization**: Smart translation also means understanding where not to translate. For example, part numbers or proper nouns remain unchanged, but units or generic names do. Our rules ensure that, say, “ISO 14001 Certification” remains that and isn’t oddly translated, but the word “Certification” itself might be shown as “Zertifizierung” for a German context if it stands alone.
-   **Learning from Users**: If users manually override a translation or provide a better one, the system can learn from that (especially for internal company-specific terminology). Admins might have a section to manage custom glossary entries for their own products.

## Regulatory Context Localization

Interpreting compliance data correctly often depends on local regulations and language:

-   **Local Regulatory References**: If a DPP references a regulation, e.g., “EU Regulation 2018/851”, the platform can detect the region of the user and provide context. A user in Germany might see additionally “(Umgesetzt in deutsches Recht durch das Kreislaufwirtschaftsgesetz)” – i.e., how that EU regulation is known locally.
-   **Units and Standards Conversion**: A product passport might contain values that need context. For example, a limit of a chemical in ppm (parts per million) might have different legal limits in different regions. While the passport will always list the value, the platform might display a note like “Complies with EU limit of 1000 ppm” vs “Complies with US limit of 500 ppm” depending on locale. Essentially, it cross-references the data with the region’s rules.
-   **Compliance Status per Region**: If a product is compliant in one region but not another, and a user from that other region views the passport, the UI could proactively warn them. E.g., “Note: This product meets EU standards, but you are viewing from California where additional requirements (Prop 65) apply.” This is forward-looking and would rely on mapping regulatory requirements to regions.
-   **International Symbols and Icons**: We ensure that any symbols used (recycling icons, hazard pictograms) are the correct ones for the locale when there are differences. For example, a biodegradability icon might differ by region or the text accompanying it will.
-   **Multi-regional Passports**: For global products, one DPP might consolidate requirements. The platform can filter or emphasize what’s relevant to the user’s region. For example, all data is stored, but a Japanese user might by default see only what’s needed for Japan; they could toggle on “EU details” if interested. This localized filtering is done via the region toggles but at the display level.
-   **Collaboration with Gemini AI**: The AI can assist in regulatory localization by answering user questions like “What does this value mean under EU law?” or “Is this product allowed in X country?”. It can draw from the data and an up-to-date knowledge base of regulations (with proper safeguards to avoid giving legal advice, it instead provides factual interpretations).

By having a strong internationalization and localization strategy, the DPP platform ensures that whether a product passport is viewed in Brussels, Dubai, or New York, it is understandable and contextually relevant to the viewer. This not only improves usability but also compliance, as stakeholders are more likely to catch and address issues when information is presented in their own language and framework.