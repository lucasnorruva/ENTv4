# PassportFlow: Digital Product Passport Platform

PassportFlow is an enterprise-grade platform for creating, managing, and verifying Digital Product Passports (DPPs). It's designed to help businesses drive transparency, ensure compliance with global regulations, and build unshakable customer trust.

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
-   **Testing**: [Jest](https://jestjs.io/), [React Testing Library](https://testing-library.com/), [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)

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

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add your Firebase and Genkit configuration. You can start with an empty file if you are using the Firebase Emulator.
    ```bash
    touch .env
    ```

### Running the Application

This project requires two separate processes to run concurrently: the Next.js frontend and the Genkit AI server.

1.  **Start the Genkit AI flows:**
    This command starts the Genkit development server, which makes your AI flows available.
    ```bash
    npm run genkit:watch
    ```

2.  **Start the Next.js development server:**
    In a separate terminal, run the following command:
    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:9002`.

## Testing

The platform includes a comprehensive testing suite using Jest and the Firebase Emulator.

-   **Run all tests in watch mode:**
    ```bash
    npm run test
    ```
-   **Run tests for a CI environment (single run):**
    ```bash
    npm run test:ci
    ```
-   **Run tests against the Firebase Emulator:**
    This script automatically starts the emulators, runs the test suite, and then shuts them down.
    ```bash
    npm run test:emulate
    ```
-   **Run all validation checks (lint, typecheck, test, build):**
    This is the command used in our CI pipeline.
    ```bash
    npm run validate
    ```

## Documentation

This project includes detailed architectural and design documentation. You can find more information in the `/docs` directory:

-   [`docs/ai-prompt-design.md`](./docs/ai-prompt-design.md): Guidelines for engineering effective prompts for the AI modules.
-   [`docs/api.md`](./docs/api.md): REST API and webhook specifications.
-   [`docs/blockchain.md`](./docs/blockchain.md): Details on the blockchain anchoring strategy and smart contract design.
-   [`docs/compliance-matrix.md`](./docs/compliance-matrix.md): A comprehensive list of supported regulations and standards.
-   [`docs/roles.md`](./docs/roles.md): An overview of user roles and their responsibilities.
-   [`docs/versioning.md`](./docs/versioning.md): The platform's versioning strategy and release process.
