# Norruva: Digital Product Passport Platform

Norruva is an enterprise-grade platform for creating, managing, and verifying Digital Product Passports (DPPs). It's designed to help businesses drive transparency, ensure compliance with global regulations, and build unshakable customer trust.

This project is built with Next.js, Firebase, and Genkit AI.

## Key Features

-   **Digital Product Passport Management**: Full CRUD functionality for creating and managing DPPs for any product.
-   **AI-Powered Insights**: Leverages Google's Gemini models via Genkit for:
    -   Automated ESG (Environmental, Social, Governance) scoring.
    -   Regulatory compliance gap analysis.
    -   Product lifecycle analysis.
    -   Consumer-friendly summary generation.
-   **Blockchain Anchoring**: Secures product data hashes on the Polygon blockchain for immutable proof of authenticity, with a design that's ready for EBSI integration.
-   **Comprehensive Compliance Matrix**: In-built knowledge of 75+ global standards like ESPR, RoHS, REACH, and more, with automated checks.
-   **Role-Based Access Control (RBAC)**: A multi-tenant system with distinct dashboards and permissions for various roles like Suppliers, Auditors, Compliance Managers, and more.
-   **Developer-Friendly API**: A REST API and webhook system for seamless integration with external ERPs, supply chain software, or e-commerce platforms.

## Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (with App Router)
-   **Backend**: [Firebase](https://firebase.google.com/) (Firestore, Cloud Functions, Auth)
-   **AI Integration**: [Genkit](https://firebase.google.com/docs/genkit)
-   **UI**: [React](https://reactjs.org/), [ShadCN UI](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
-   **Testing**: [Jest](https://jestjs.io/), [React Testing Library](https://testing-library.com/)

## Getting Started

Follow these instructions to get the project running on your local machine for development and testing.

### Prerequisites

-   Node.js (v18 or later)
-   npm or yarn
-   Firebase CLI (`npm install -g firebase-tools`)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Backend Authentication:**
    For the backend (Firebase Admin SDK) to authenticate with your Firebase project, you need a service account key.
    - Go to your **Firebase project settings** > **Service accounts**.
    - Click **Generate new private key** and save the downloaded JSON file.
    - Rename the file to `serviceAccountKey.json` and place it in the root directory of this project.
    
    _Note: This file is included in `.gitignore` and should never be committed to source control._

4.  **Set up Client-side Environment:**
    Create a `.env` file in the root of the project. This file is for your **client-side** Firebase configuration keys (which are public). You can get these from your Firebase project settings under "Your apps" > "SDK setup and configuration".
    ```bash
    touch .env
    ```
    Your `.env` file should look like this:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=...
    ```
    If you plan to use only the Firebase Emulator for local development, you can start with an empty `.env` file.

5.  **Seed the Database:**
    The application requires initial data to function correctly. Run the following command to populate your local Firestore emulator or cloud database with mock data.
    ```bash
    npm run seed
    ```

### Running the Application

To run the full application, including the Next.js frontend and the Genkit AI server, use a single command:

```bash
npm run dev
```

This command starts all necessary services concurrently. The application will be available at `http://localhost:9002`. The Genkit developer UI will be available at `http://localhost:4000`.

## Testing

The platform includes a testing suite using Jest.

-   **Run all tests in watch mode:**
    ```bash
    npm run test
    ```
-   **Run tests for a CI environment (single run):**
    ```bash
    npm run test:ci
    ```

## Documentation

This project includes detailed architectural and design documentation. You can find more information in the `/docs` directory:

-   [`docs/ai-prompt-design.md`](./docs/ai-prompt-design.md): Guidelines for engineering effective prompts for the AI modules.
-   [`docs/api.md`](./docs/api.md): REST API and webhook specifications.
-   [`docs/blockchain.md`](./docs/blockchain.md): Details on the blockchain anchoring strategy and smart contract design.
-   [`docs/compliance-matrix.md`](./docs/compliance-matrix.md): A comprehensive list of supported regulations and standards.
-   [`docs/roles.md`](./docs/roles.md): An overview of user roles and their responsibilities.
-   [`docs/versioning.md`](./docs/versioning.md): The platform's versioning strategy and release process.
