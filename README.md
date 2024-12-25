# Email Engine

## Features

This Email Engine leverages Elasticsearch for fast, scalable email search functionality and Redis for efficient caching and managing message queues. It supports a wide range of email management tasks, including synchronization, search, and sending emails.
## Prerequisites

- Node.js: Make sure Node.js is installed.
- Elasticsearch: Ensure Elasticsearch is installed and running if you are using a local system. Download Elasticsearch.
- Azure Subscription: An Azure subscription is required to set up Azure Active Directory.

### Register an Application:

1. Go to the [Azure portal](https://portal.azure.com/).
2. Navigate to **"Azure Active Directory"** > **"App registrations"**.
3. Click on **"New registration"**.
4. Enter a name for the application (e.g., EmailEngine).
5. Set **"Supported account types"** to **"Accounts in this organizational directory only"**.
6. Set the **"Redirect URI"** to `http://localhost:3000/auth/outlook/callback`. This redirect URL should not be changed, as the same route is used in the code.
7. Click **"Register"**.

### Configure API Permissions:

1. After registering the application, go to **"API permissions"**.
2. Click **"Add a permission"**.
3. Select **"Microsoft Graph"**.
4. Choose **"Delegated permissions"**.
5. Select the following permissions:
    - `openid`
    - `profile`
    - `email`
    - `Mail.Read`
    - `offline_access`
6. Click **"Add permissions"**.
7. Click **"Grant admin consent for [your organization]"**.

### Generate Client Secret:

1. Navigate to **"Certificates & Secrets"** in your app registration.
2. Click on **"New Client Secret"**.
3. Provide a description and select an expiration period.
4. Click **"Add"**, then copy the client secret value (make sure to save the secret ID somewhere, as it will be required for setting up environment variables).

## Environment Variables
Create a `.env` file in the root of your project

### Application Configuration
NODE_ENV=development
PORT=3000



### Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

### Elasticsearch Configuration
ELASTICSEARCH_HOST=http://localhost:9200
ELASTICSEARCH_PORT=9200
ELASTICSEARCH_NODE=http://localhost:9200

### OAuth Configuration for Email Services
OAUTH_CLIENT_ID=
OAUTH_CLIENT_SECRET=
OAUTH_TENANT_ID=
OAUTH_REDIRECT_URI=




### Optional Debugging Configuration
DEBUG=true

### session secret
SESSION_SECRET="

# API Documentation

This API provides endpoints for user account management and OAuth authentication. Below are the details of each endpoint.

---

## Base URL
`http://localhost:3000/api/user`

---

## Endpoints

### 1. Create Account
**Route:** `POST /create`

**Description:** Creates a new user account.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
- `201 Created` - Account successfully created.
- `400 Bad Request` - Missing or invalid data.

---

### 2. Get User Information
**Route:** `GET /:userId`

**Description:** Retrieves details of a user by their ID.

**Path Parameters:**
- `userId` (string): The ID of the user to fetch information for.

**Response:**
- `200 OK` - Returns user details.
- `404 Not Found` - User not found.

---

### 3. Initiate Outlook Authentication
**Route:** `GET /auth/outlook`

**Description:** Initiates the OAuth process for linking an Outlook account.

**Response:**
- `302 Found` - Redirects to the Outlook authentication page.

---

### 4. Handle Outlook Authentication Callback
**Route:** `GET /auth/outlook/callback`

**Description:** Handles the callback from Outlook OAuth and links the account.

**Query Parameters:**
- `code` (string): The authorization code provided by Outlook.
- `state` (string): A random string to validate the session.
- `error` (string): Error message if authentication failed.

**Response:**
- `200 OK` - Account linked successfully.
- `400 Bad Request` - Invalid or missing parameters.
- `500 Internal Server Error` - Server error during linking.

---

## Example Usage

### Create Account
```bash
curl -X POST http://localhost:3000/api/user/create \
-H "Content-Type: application/json" \
-d '{"email": "test@example.com", "password": "securepassword"}'
```

### Get User Info
```bash
curl -X GET http://localhost:3000/api/user/12345
```

### Initiate Outlook Auth
```bash
curl -X GET http://localhost:3000/api/user/auth/outlook
```

### Handle Outlook Callback
```bash
curl -X GET "http://localhost:3000/api/user/auth/outlook/callback?code=abc123&state=randomstate"
```

# API Documentation

This API provides endpoints for email synchronization and management. Below are the details of each endpoint.

---

## Base URL
`http://localhost:3000/api/sync`

---

## Endpoints

### 1. Start Email Synchronization
**Route:** `POST /start-sync`

**Description:** Starts email synchronization for a user.

**Request Body:**
```json
{
  "userId": "string"
}
```

**Response:**
- `200 OK` - Sync started successfully.
- `400 Bad Request` - Missing or invalid data.

---

### 2. Check Sync Status
**Route:** `GET /status/:syncId`

**Description:** Checks the status of an ongoing email sync.

**Path Parameters:**
- `syncId` (string): The ID of the synchronization process.

**Response:**
- `200 OK` - Returns sync status.
- `404 Not Found` - Sync not found.

---

### 3. Get User Emails
**Route:** `GET /:userId/emails`

**Description:** Retrieves emails for a specific user.

**Path Parameters:**
- `userId` (string): The ID of the user.

**Response:**
- `200 OK` - Returns the user's emails.
- `404 Not Found` - User not found.

---

### 4. Get User's Mail Folders
**Route:** `GET /:userId/mailfolders`

**Description:** Retrieves the mail folders of a user.

**Path Parameters:**
- `userId` (string): The ID of the user.

**Response:**
- `200 OK` - Returns the user's mail folders.
- `404 Not Found` - User not found.

---

### 5. Get Specific Email Details
**Route:** `GET /:userId/emails/details/:messageId`

**Description:** Retrieves details of a specific email.

**Path Parameters:**
- `userId` (string): The ID of the user.
- `messageId` (string): The ID of the email message.

**Response:**
- `200 OK` - Returns email details.
- `404 Not Found` - Email not found.

---

### 6. Send an Email
**Route:** `POST /:userId/emails/send`

**Description:** Sends an email from the user's account.

**Path Parameters:**
- `userId` (string): The ID of the user.

**Request Body:**
```json
{
  "subject": "string",
  "body": "string",
  "to": ["string"],
  "cc": ["string"],
  "attachments": ["string"]
}
```

**Response:**
- `200 OK` - Email sent successfully.
- `400 Bad Request` - Missing or invalid data.

---

### 7. Search Emails
**Route:** `POST /:userId/emails/search`

**Description:** Searches emails for a specific user based on a search query.

**Path Parameters:**
- `userId` (string): The ID of the user.

**Request Body:**
```json
{
  "searchText": "string"
}
```

**Response:**
- `200 OK` - Returns search results.
- `400 Bad Request` - Missing or invalid search text.

---

### 8. Mark Email as Read/Unread
**Route:** `PATCH /:userId/emails/markAsRead/:messageId`

**Description:** Marks an email as read or unread.

**Path Parameters:**
- `userId` (string): The ID of the user.
- `messageId` (string): The ID of the email message.

**Response:**
- `200 OK` - Email status updated successfully.
- `404 Not Found` - Email not found.

---

### 9. Move Email to Folder
**Route:** `POST /:userId/emails/move/:messageId`

**Description:** Moves an email to a specific folder.

**Path Parameters:**
- `userId` (string): The ID of the user.
- `messageId` (string): The ID of the email message.

**Response:**
- `200 OK` - Email moved successfully.
- `404 Not Found` - Email not found.

---

### 10. Delete Email
**Route:** `DELETE /:userId/emails/delete/:messageId`

**Description:** Deletes a specific email.

**Path Parameters:**
- `userId` (string): The ID of the user.
- `messageId` (string): The ID of the email message.

**Response:**
- `200 OK` - Email deleted successfully.
- `404 Not Found` - Email not found.

---

## Example Usage

### Start Sync
```bash
curl -X POST http://localhost:3000/api/sync/start-sync \
-H "Content-Type: application/json" \
-d '{"userId": "12345"}'
```

### Check Sync Status
```bash
curl -X GET http://localhost:3000/api/sync/status/sync123
```

### Get User Emails
```bash
curl -X GET http://localhost:3000/api/sync/12345/emails
```

### Send an Email
```bash
curl -X POST http://localhost:3000/api/sync/12345/emails/send \
-H "Content-Type: application/json" \
-d '{"subject": "Test", "body": "Hello", "to": ["recipient@example.com"]}'
