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
-   **Backend**: Local Mock Data (for development), [Firebase](https://firebase.google.com/) (for production)
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
    
3.  **Set up Environment:**
    Create a `.env` file in the root of the project. For local development, this file can be mostly empty, but it's required. For production deployment, you will need to add your Firebase configuration keys.
    ```bash
    touch .env
    ```
    Your `.env` file should look like this:
    ```env
    # Firebase client configuration (for production)
    NEXT_PUBLIC_FIREBASE_API_KEY=...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=...
    
    # Secret for securing cron job endpoints
    CRON_SECRET=...
    
    # (Optional) Blockchain Integration Variables for Data Anchoring
    # You will need these to test the blockchain anchoring feature.
    # Get a free RPC URL from providers like Alchemy or Infura for the Polygon Amoy testnet.
    POLYGON_AMOY_RPC_URL=...
    # The private key of the wallet that will pay for testnet gas fees.
    # IMPORTANT: Use a dedicated, testnet-only wallet with minimal funds.
    WALLET_PRIVATE_KEY=...
    # The address of your deployed smart contract on the Amoy testnet.
    # A sample contract is not provided, but the code expects a contract
    # with a `registerPassport(bytes32, bytes32)` function.
    SMART_CONTRACT_ADDRESS=...
    ```
    > **Important Note:** This `.env` file is locked and cannot be modified by the AI assistant. Please manage your environment variables manually.

### Running the Application

For local development, the application now runs entirely on mock data, so you no longer need to run the `seed` script.

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
```