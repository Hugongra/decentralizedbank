# Decentralized Bank Protocol (Inspired by Solend)

## Project Overview

The Decentralized Bank Protocol is a robust lending and borrowing platform built on the Solana blockchain. Inspired by the architecture and functionality of established DeFi protocols like Solend, this project aims to provide efficient, secure, and transparent financial services within the Solana ecosystem. Users can deposit various SPL tokens as collateral, borrow other supported assets, and earn interest on their deposits.

## Features

-   **Decentralized Lending & Borrowing**: Users can supply and borrow cryptographic assets without intermediaries.
-   **Interest Rate Model**: Dynamic interest rates for lending and borrowing, adjusting based on supply and demand.
-   **Collateral Management**: Support for multiple SPL tokens as collateral with configurable collateral factors.
-   **Liquidation Mechanism**: A robust liquidation engine to maintain protocol solvency and manage undercollateralized positions.
-   **Real-time Analytics (Statistics Backend)**: A dedicated backend service to track protocol statistics, user activities, and token prices.
-   **User-Friendly Frontend**: Intuitive web interfaces for both client-side users to interact with the protocol and an admin dashboard for protocol management.

## Technologies Used

The project is comprised of three main components:

### Smart Contract
-   **Blockchain**: Solana
-   **Language**: Rust
-   **Framework**: Anchor Framework (for Solana smart contract development)

### Frontend
-   **Framework**: Angular (TypeScript)
-   **Wallet Integration**: Solana Wallet Adapter
-   **Styling**: Tailwind CSS

### Statistics Backend
-   **Language**: Java
-   **Framework**: Spring Boot
-   **Database**: PostgreSQL (or similar relational database)
-   **APIs**: Integration with CoinMarketCap (or other price oracles) and Solana RPC for real-time data.

## Project Structure

The repository is organized into the following main directories:

-   `frontend/`: Contains the client-facing decentralized application (DApp) and potentially an admin dashboard.
    -   `frontend/admin/`: Admin dashboard application.
    -   `frontend/client/`: Client-facing DApp.
-   `smart-contract/`: Houses the core Solana smart contract logic.
    -   `programs/`: Anchor programs.
    -   `migrations/`: Deployment scripts.
-   `statistics-backend/`: Contains the Java Spring Boot application for data aggregation and analytics.

## Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

Before you begin, ensure you have the following installed:

-   Node.js (LTS version) & npm
-   Rust & Cargo (for Solana/Anchor development)
-   Solana Tool Suite (`solana-cli`, `anchor-cli`)
-   Java Development Kit (JDK 17 or newer) & Maven (for Spring Boot backend)
-   Docker & Docker Compose (recommended for running local services like PostgreSQL)

### Installation

Clone the repository:
```bash
git clone https://github.com/Hugongra/decentralizedbank-.git
cd decentralizedbank-
```

#### 1. Setup Smart Contract

Navigate to the `smart-contract` directory and follow its specific setup instructions (e.g., `anchor build`, `anchor deploy`). Refer to `smart-contract/README.md` for detailed steps.

#### 2. Setup Statistics Backend

Navigate to the `statistics-backend` directory.
```bash
cd statistics-backend
# Build the Spring Boot application
./mvnw clean install
# Run the application (ensure PostgreSQL or other database is running)
./mvnw spring-boot:run
```
Refer to `statistics-backend/README.md` for detailed steps on database setup and configuration.

#### 3. Setup Frontend

Navigate to the `frontend` directory.
```bash
cd frontend
# Install dependencies for both admin and client
npm install --prefix admin
npm install --prefix client
```

##### Running the Frontend (Client)
```bash
cd client
npm start
```

##### Running the Frontend (Admin)
```bash
cd admin
npm start
```
Refer to `frontend/README.md` for detailed instructions on running and developing the frontend applications.

## Usage

-   **Client DApp**: Access the frontend to deposit assets, borrow funds, repay loans, and view your positions.
-   **Admin Dashboard**: Use the admin interface to manage protocol parameters, list new assets, and monitor overall system health.
-   **Statistics Backend**: The backend runs in the background, continuously collecting data from the Solana blockchain and price oracles to provide real-time insights.

## Contributing

Contributions are welcome! If you'd like to contribute, please fork the repository, create a new branch for your feature or bug fix, and submit a pull request.

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.

## Contact

For any questions or inquiries, please open an issue on this repository or contact [Hugongra](https://github.com/Hugongra).
