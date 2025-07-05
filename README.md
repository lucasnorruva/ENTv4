# Norruva: Digital Product Passport Platform

The Norruva platform is an enterprise-grade, blockchain-anchored DPP-as-a-Service solution. Built for global scale and EU compliance, our platform enables manufacturers, brands, and supply chain partners to create, manage, and verify digital product passports with robust security and consumer-friendly accessibility.

## Vision
To democratize sustainability and compliance by providing the world's most robust, scalable, and interoperable Digital Product Passport infrastructure — enabling every product to carry its complete digital identity from cradle to grave while creating new circular economy opportunities.

## Key Features

-   **AI-Powered Intelligence**: Leverage Google's Gemini models via Genkit for automated compliance checking against 75+ regulations, dynamic ESG scoring, supply chain risk assessment, and auto-generation of product descriptions and compliance summaries.
-   **Enterprise-Grade Security**: Built with a focus on security, all data integrity can be secured via blockchain anchoring for immutable proof of authenticity.
-   **Multi-Persona Dashboards**: A multi-tenant system with distinct, feature-rich dashboards and granular permissions for 10 unique roles, including Suppliers, Auditors, Compliance Managers, Service Providers, and Manufacturers.
-   **Global Supply Chain Visualization**: An interactive 3D globe tracker to visualize product transit routes and supply chain networks in real-time.
-   **Seamless Integration**: A developer-friendly GraphQL API, a versioned REST API, and a webhook system for real-time notifications and integration with external ERPs or e-commerce platforms.

## Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (with App Router)
-   **Backend**: [Firebase](https://firebase.google.com/) (Firestore, Auth, Storage)
-   **AI & Machine Learning**: [Genkit](https://firebase.google.com/docs/genkit) for leveraging Google Gemini models.
-   **Blockchain & Trust Layer**: [Polygon](https://polygon.technology/) for low-cost, energy-efficient Ethereum Layer 2 anchoring.
-   **UI**: [React](https://reactjs.org/), [ShadCN UI](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
-   **Testing**: [Jest](https://jestjs.io/), [React Testing Library](https://testing-library.com/)

## Getting Started

Follow these instructions to get the project running on your local machine for development and testing.

### Prerequisites

-   Node.js (v20 or later)
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

For local development, the application runs against the Firebase Emulator Suite, providing a local, offline development environment that simulates the live Firebase backend.

To run the full application, including the Next.js frontend and the emulated backend services, use a single command in your terminal:

```bash
npm run dev
```

This command concurrently starts two processes:
-   **Genkit Developer UI**: Runs the AI flow debugger, which can be accessed at `http://localhost:4000`.
-   **Next.js Frontend**: Runs the main web application. The dashboard can be accessed at `http://localhost:9002`.

Both services will run in the same terminal, and you will see logs from both. Upon starting, the Firebase Emulators (Firestore, Auth, Storage) will be automatically launched.

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
    
## Contributing
We welcome contributions! Please see our [Contributor Guidelines](./docs/contributing) for more details on our branching strategy, coding standards, and pull request process.

## Documentation
This project includes detailed architectural and design documentation. You can find more information in the `/docs` directory, including:

-   [`/docs`](./docs): High-level overview of the system architecture.
-   [`/docs/api`](./docs/api): REST API and webhook specifications.
-   [`/docs/blockchain`](./docs/blockchain): Details on the blockchain anchoring strategy.
-   [`/docs/compliance-matrix`](./docs/compliance-matrix): A list of supported regulations.

## License
This project is licensed under the MIT License - see the LICENSE file for details.
