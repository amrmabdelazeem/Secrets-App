# Secrets App

This is a simple Secrets app built with Express.js and PostgreSQL, featuring local authentication as well as Google OAuth2.0 authentication.

## Features

- **Local Authentication**: Users can register and log in using their email and password.
- **Google OAuth2.0 Authentication**: Users can also log in using their Google account.
- **Session Management**: Sessions are managed using express-session.
- **Password Hashing**: User passwords are securely hashed using bcrypt before being stored in the database.
- **Secrets**: Authenticated users can submit and view secrets.
- **Static Files**: Static files (CSS, images, etc.) are served from the `public` directory.

## Prerequisites

- Node.js
- PostgreSQL

## Setup

1.  Clone this repository.
2.  Install dependencies:

    ```bash
    npm install

    ```

3.  Set up your PostgreSQL database and configure the environment variables in a `.env` file based on `.env.example`.
4.  Run the application:

    ```bash
    npm start
    ```

    Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Make sure to set the following environment variables:

- `DB_USER`: PostgreSQL database user.
- `DB_DATABASE`: PostgreSQL database name.
- `DB_PASSWORD`: PostgreSQL database password.
- `DB_PORT`: PostgreSQL database port.
- `DB_HOST`: PostgreSQL database host.
- `SECRET_SESSION`: Secret key for express-session.
- `CLIENT_ID`: Google OAuth2.0 client ID.
- `CLIENT_SECRET`: Google OAuth2.0 client secret.

## Routes

- `/`: Home page.
- `/secrets`: View secrets (requires authentication).
- `/login`: Login page.
- `/register`: Register page.
- `/logout`: Logout route.
- `/submit`: Submit secrets (requires authentication).
- `/auth/google`: Google OAuth2.0 authentication route.
- `/auth/google/secrets`: Google OAuth2.0 callback route.
