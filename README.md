# StudyCircle — Full-stack collaborative learning platform

StudyCircle is a React + Vite frontend backed by an Express REST API and MongoDB. The project includes JWT authentication, student dashboards, study groups, group workspaces, discussions, shared resources, study sessions, notifications, member management, and profile settings.

## Requirements

- Node.js 20.19+ (Node 22 LTS recommended)
- npm
- MongoDB Community Server running locally **or** a MongoDB Atlas database
- Cloudinary account only if you want hosted file uploads (optional for link resources)

## 1. Configure environment variables (Windows)

From the project root, run:

```bat
setup.bat
```

This creates `server/.env` and `client/.env` from the safe example files. Open `server/.env` and check these values:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/studycircle
JWT_SECRET=replace_this_with_a_random_secret_at_least_32_characters_long
```

If using MongoDB Atlas, replace `MONGO_URI` with the connection string from Atlas. URL-encode special characters in the database username/password. Never commit or share your real `.env` file.

> Important: the ZIP intentionally does not contain database credentials. The backend will stop with a clear configuration error until `server/.env` exists and contains a valid `MONGO_URI` and `JWT_SECRET`.

## 2. Start the backend

Open Terminal 1:

```bash
cd server
npm install
npm run dev
```

Expected startup messages include MongoDB connected and API running on port 5000.

Check: http://localhost:5000/api/health

## 3. Start the frontend

Open Terminal 2 from the project root:

```bash
cd client
npm install
npm run dev
```

Open: http://localhost:5173

## Features / routes

- `/` — Login
- `/register` — Create account
- `/dashboard` — Overview and activity
- `/groups` — Your study groups
- `/discover` — Discover and join groups
- `/groups/:groupId` — Group workspace and member management
- `/discussions` — Group discussions and comments
- `/resources` — Shared resource library
- `/sessions` — Study sessions
- `/chat` and `/groups/:groupId/chat` — Real-time group chat, typing indicators and message history
- `/notes` and `/groups/:groupId/notes` — Group-shared Markdown notes with synchronized updates
- `/calendar` — Cross-group study calendar and `.ics` export
- `/admin` — Restricted platform moderation console
- `/notifications` — Persisted and real-time notifications
- `/settings` — Profile settings

## API

The Express API is mounted under `/api`:

- `/auth`
- `/users`
- `/groups`
- `/member-management`
- `/dashboard`
- `/discussions`
- `/resources`
- `/sessions`
- `/notifications`
- `/chat`
- `/notes`
- `/admin`

Most application endpoints require `Authorization: Bearer <token>`.

## Troubleshooting

### `MONGO_URI ... got undefined`

1. Confirm the file is named exactly `server/.env` (not `.env.txt`).
2. Confirm it contains a non-empty line beginning `MONGO_URI=`.
3. Start the backend from the `server` directory using `npm run dev`.
4. Confirm MongoDB is running, or use a valid Atlas URI.

The server now loads `.env` by its absolute path next to `server.js`, so launching nodemon from a different working directory will not make dotenv read the wrong file.

### MongoDB connection refused

For local MongoDB, start the MongoDB service and verify `mongodb://127.0.0.1:27017/studycircle`. For Atlas, check the URI, database password, and Network Access IP allowlist.

### CORS error

Set `CLIENT_URL` to the exact frontend origin, usually `http://localhost:5173`.

### Upload configuration

Cloudinary credentials are optional for local development until you use hosted file uploads. Add the three Cloudinary values to `server/.env` to enable them.

## Production

Deploy the client and API separately, set `VITE_API_URL` to the deployed API URL ending in `/api`, set `CLIENT_URL` to the deployed frontend origin, and configure MongoDB/Cloudinary secrets in the hosting provider. Use HTTPS and a unique production JWT secret.


## Collaboration upgrade (Socket.IO, shared notes, calendar and admin)

The upgrade adds these authenticated capabilities:

- **Real-time group chat:** Socket.IO rooms are authorized against MongoDB group membership. Messages are persisted in `ChatMessage`, broadcast to group members, and older history can be paged in. Typing indicators are scoped to authorized group rooms.
- **Group-specific discussions:** discussions are scoped to the selected group. New discussions and comments create persisted notifications for relevant members/authors.
- **Shared notes:** Markdown editor with live preview. Notes are stored in `StudyNote` and visible to members of the selected group. Note changes are broadcast to members in the group; authors and group moderators/admins can edit or delete. This is synchronized shared-note state, not simultaneous character-level co-editing.
- **Study calendar:** aggregates scheduled sessions across joined groups and exports an `.ics` calendar file for Google Calendar, Apple Calendar or Outlook import.
- **Admin console:** platform counts, recent users/groups/discussions/resources, account suspension, group disable/enable and content removal. All admin APIs enforce the `admin` role on the server.
- **Notifications:** group joins, new discussions, comments, session creation and session RSVPs generate persisted notifications; connected users receive them over Socket.IO.
- **Authentication and API hardening:** saved sessions are revalidated against `/api/auth/me` on startup, expired sessions are cleared, auth attempts are rate-limited, uploads are size/type limited, and API errors return consistent JSON.
- **Mobile navigation:** compact navigation, responsive dashboard workspace and adaptive collaboration screens.

### Install the new dependencies

After extracting the updated project, run `npm install` (not `npm ci`) once in each application folder. This resolves the added Socket.IO and Markdown packages and refreshes the lockfiles for your environment. Then run these in separate terminals:

```bash
cd server
npm install
npm run dev
```

```bash
cd client
npm install
npm run dev
```

`socket.io`, `socket.io-client` and `react-markdown` are included in the package manifests. `npm install` updates the lockfiles for the current npm version.

### New frontend routes

| Route | Purpose |
|---|---|
| `/chat` | Choose a joined group and open its live chat |
| `/chat/:groupId` | Live chat for a specific group |
| `/groups/:groupId/chat` | Group workspace chat shortcut |
| `/notes` | Shared notes for a selected group |
| `/groups/:groupId/notes` | Notes scoped to a group |
| `/groups/:groupId/discussions` | Discussions scoped to a group |
| `/calendar` | Calendar view and `.ics` export |
| `/admin` | Admin console (admin role only) |

### Promote the first administrator

New registrations intentionally receive the `student` role. Do not expose an admin registration form. Promote a trusted account directly in MongoDB using `mongosh`:

```javascript
use studycircle
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

Replace the email with the account you control. Then sign out and sign back in so the frontend refreshes the role. The server checks the role on every `/api/admin/*` request; hiding the navigation item is not the security boundary.

### New API endpoints

- `GET /api/chat/:groupId` and `POST /api/chat/:groupId`
- `GET /api/notes/group/:groupId`, `POST /api/notes`, `PUT /api/notes/:id`, `DELETE /api/notes/:id`
- `GET /api/admin/overview`, `GET /api/admin/users`
- `PATCH /api/admin/users/:id/status`, `PATCH /api/admin/groups/:id/status`
- `DELETE /api/admin/discussions/:id`, `DELETE /api/admin/resources/:id`

Socket.IO uses the same JWT stored by the client and only permits authenticated group members to join `group:<groupId>` rooms. For a deployed frontend/backend on different hosts, set `VITE_API_URL` and `VITE_API_SOCKET_URL` in `client/.env` and include the frontend origin in `server/.env` as `CLIENT_URL`.


## Verification notes

The source tree has been checked for:
- Node.js syntax across all backend JavaScript files.
- JSX/JavaScript transpilation syntax across all frontend source files.
- Missing relative frontend imports.
- The previously broken discussions route parameter and malformed route declaration.

A full Vite production build and live MongoDB/Socket.IO integration test still need to be run in an environment with npm registry access and a configured MongoDB instance. The development environment used to prepare this archive could not reach `registry.npmjs.org`, so dependencies could not be installed here. Do not treat static checks as a substitute for the deployment smoke test below.

## Deployment smoke test

After installing dependencies and configuring environment variables:

1. Run `npm run build` in `client` and confirm the `dist` directory is generated.
2. Start the API with `npm start` in `server`; verify `/api/health` returns HTTP 200.
3. Register two test accounts and create a public study group.
4. Join the group from the second account; verify the group owner receives a notification.
5. Send messages from both accounts; verify messages appear live and remain after refreshing.
6. Test typing indicators, older message pagination, shared note updates, discussion/comment notifications and session creation/RSVP notifications.
7. Confirm a non-admin receives HTTP 403 from `/api/admin/*`; confirm an admin can suspend/reactivate a test account and disable/re-enable a test group.
8. Confirm a non-member cannot join the Socket.IO group room or read group chat/notes.
9. Test file upload limits and verify uploaded Cloudinary files are removed when an administrator deletes a resource.
10. Test the deployed frontend on a narrow mobile viewport and verify all deep links resolve through the hosting provider's SPA fallback.


## Suggested deployment (Vercel + Render + MongoDB Atlas)

This repository includes `client/vercel.json` for SPA deep-link fallback and `render.yaml` for a Render API service. Deployment still requires your own provider accounts and secrets.

1. Create a MongoDB Atlas database and allow network access from your API host. Use the Atlas connection string as `MONGO_URI`.
2. Deploy the `server` folder as a Render web service using the included blueprint. Set `CLIENT_URL` to the exact deployed Vercel origin (no trailing slash). Keep the generated `JWT_SECRET` private.
3. Deploy the `client` folder to Vercel. Set `VITE_API_URL` to `https://YOUR-API-HOST/api` and `VITE_API_SOCKET_URL` to `https://YOUR-API-HOST`.
4. If using Cloudinary file uploads, configure its three secrets in Render. Link-only resources do not require Cloudinary.
5. Redeploy the API after setting the Vercel origin, then redeploy the client with the API URLs.
6. Run the deployment smoke test above. In particular, verify that the browser's Socket.IO connection upgrades successfully and that the API CORS origin matches the deployed frontend exactly.

The application cannot be deployed to your provider accounts from this archive without your account access, MongoDB URI and deployment secrets. The included configuration makes the deployment path explicit without embedding credentials.
