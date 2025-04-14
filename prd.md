Below is the updated **Product Requirements Document (PRD)** for the Shared Expense Tracker Web App, revised to leverage the **Cloudflare ecosystem** (D1 for the database, Cloudflare Workers for the backend, Cloudflare Pages for the frontend, and Cloudflare R2 for receipt storage). The app remains lightweight, free, easy to host, and maintainable with no tech debt, tailored for you and your three flatmates to track shared expenses using GPT-4.0 for receipt image analysis.

-----

# Product Requirements Document (PRD) for Shared Expense Tracker Web App

## 1. Introduction

### 1.1 Purpose

The Shared Expense Tracker Web App enables three users (you and your flatmates) to manage shared expenses seamlessly. Users can upload receipt images, with the total amount extracted automatically using GPT-4.0, track expenses, and view individual balances. Instead of immediate payments, new purchases consolidate credits against what a user owes. The app is built entirely on Cloudflare’s free-tier services for simplicity, cost-free hosting, and minimal maintenance.

### 1.2 Scope

The app includes:

- Authentication for three users.
- Expense addition via receipt uploads with GPT-4.0 amount extraction.
- Expense tracking and automatic balance calculation.
- A simple interface to view expenses and balances.
  The tech stack uses **Cloudflare D1** (database), **Cloudflare Workers** (backend), **Cloudflare Pages** (frontend), and **Cloudflare R2** (receipt storage), ensuring a lightweight, serverless, and free solution.

-----

## 2. Features and Functionality

### 2.1 User Authentication

- The app shall support **three user accounts** (one for each flatmate).
- Each user shall have a **unique username and password**.
- Passwords shall be **hashed** and stored securely in **Cloudflare D1**.
- Users shall **log in** and **log out** via a frontend interface served by **Cloudflare Pages**.
- **Cloudflare Workers** shall handle authentication logic, validating credentials against D1 and issuing session tokens (e.g., JWT stored in cookies).

### 2.2 Adding Expenses

- Logged-in users shall **add new expenses** via the frontend.
- To add an expense:
  - Users shall **upload a receipt image** through a form on **Cloudflare Pages**.
  - The image shall be sent to **Cloudflare Workers**, which uploads it to **Cloudflare R2** for storage.
  - Workers shall call the **GPT-4.0 API** to analyze the image and extract the **total amount**.
  - The extracted amount shall be returned to the frontend for **user confirmation**.
  - Users shall be able to **edit the amount** if incorrect.
- Upon confirmation, **Cloudflare Workers** shall store the expense in **Cloudflare D1** with:
  - **Payer**: The user who uploaded it.
  - **Amount**: The confirmed total.
  - **Date**: Current date (default) or user-specified.
  - **Description**: Optional notes.
  - **Receipt Path**: The R2 object key for the stored image.

### 2.3 Expense Tracking and Balance Calculation

- **Cloudflare D1** shall store expenses with the following schema:
  - **Users Table**:
    
    ```sql
    CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE,
        password_hash TEXT
    );
    ```
  - **Expenses Table**:
    
    ```sql
    CREATE TABLE expenses (
        id INTEGER PRIMARY KEY,
        payer_id INTEGER,
        amount REAL,
        date TEXT,
        description TEXT,
        receipt_path TEXT,
        FOREIGN KEY (payer_id) REFERENCES users(id)
    );
    ```
- Expenses shall be **split equally** among the three users.
- **Cloudflare Workers** shall calculate each user’s balance:
  - **Total Paid**: Sum of amounts from expenses paid by the user.
  - **Total Owed**: (Sum of all expense amounts) / 3.
  - **Balance**: Total Paid - Total Owed.
- A **positive balance** indicates the user is owed money; a **negative balance** means they owe.
- Adding a new expense updates the user’s balance, **consolidating credits**. For example:
  - If you owe $10 and add a $15 expense (split as $5 each), your balance shifts from -$10 to $0, as your $15 payment offsets your debt and share.

### 2.4 Viewing Expenses and Balances

- The frontend on **Cloudflare Pages** shall display:
  - A **list of all expenses** (payer, amount, date, description) fetched via **Cloudflare Workers** querying **D1**.
  - The logged-in user’s **current balance**.
- Optionally, a **summary of all users’ balances** may be shown for transparency, fetched from **D1** via **Workers**.

### 2.5 Receipt Image Handling

- Receipt images shall be **uploaded to Cloudflare R2** for storage.
- **Cloudflare Workers** shall generate a unique object key for each image and store the key in **D1**’s `expenses.receipt_path`.
- Workers shall use the **GPT-4.0 API** to extract the total amount during upload.

-----

## 3. User Interface and User Experience

- The app shall provide a **simple, responsive web interface** hosted on **Cloudflare Pages** with:
  - **Login Page**: For user authentication.
  - **Home Page**: Shows the user’s balance and expense list.
  - **Add Expense Page**: Form for uploading receipt images and confirming amounts.
- The UI shall use lightweight HTML/CSS/JS, ensuring fast load times and compatibility with desktop and mobile devices.

-----

## 4. Non-Functional Requirements

- **Database**: **Cloudflare D1** (serverless SQLite) shall store user data and expenses, using the free tier (5 GB storage, 10M queries/month).
- **Backend**: **Cloudflare Workers** shall handle API logic, free tier (100,000 requests/day).
- **Frontend**: **Cloudflare Pages** shall serve the static UI, free tier (unlimited bandwidth).
- **Storage**: **Cloudflare R2** shall store receipt images, free tier (10 GB storage).
- **Security**:
  - Passwords shall be hashed (e.g., bcrypt) before storage in D1.
  - API endpoints in Workers shall require authentication (e.g., JWT).
  - R2 buckets shall be private, accessible only via signed URLs generated by Workers.
- **Reliability**: The app shall handle errors (e.g., invalid images, GPT-4.0 failures) gracefully, showing user-friendly messages.
- **Performance**: Global distribution of Cloudflare services ensures low-latency access.

-----

## 5. Assumptions and Constraints

- The app is designed for **three users**, but the D1 schema supports adding more if needed.
- Expenses are **split equally** among users.
- **GPT-4.0 API** is available for receipt analysis (assumes access is configured separately).
- Users have **internet access** to use the app.
- Cloudflare’s **free tiers** are sufficient (highly likely given the app’s small scale).

-----

## 6. Dependencies

- **Cloudflare Services**:
  - D1 for database.
  - Workers for backend logic.
  - Pages for frontend hosting.
  - R2 for receipt storage.
- **GPT-4.0 API** for receipt image analysis.

-----

## 7. Acceptance Criteria

- Users can **log in** securely using credentials stored in D1.
- Users can **add expenses** by uploading receipt images to R2, with amounts extracted by GPT-4.0 and confirmed via the UI.
- The app accurately **calculates and displays balances** in real-time, reflecting consolidated credits, using D1 data.
- The frontend on Pages fetches and displays **expense history** and balances correctly.
- Errors (e.g., invalid images, network issues) are handled without crashes, with clear feedback.

-----

## 8. Future Enhancements (Optional)

- Support for **unequal expense splits** via user input.
- **Balance settlement** feature to record payments between users.
- UI enhancements like **expense categories** or **charts**.
- Integration with **Cloudflare Workers KV** for caching frequent queries if performance needs improve.

-----

This PRD defines a lightweight, cost-free web app built on Cloudflare’s ecosystem, using **D1** for data, **Workers** for logic, **Pages** for the UI, and **R2** for receipt storage. It meets your needs for simplicity, maintainability, and expense tracking with GPT-4.0 integration. If you’d like sample code or further refinements, let me know!