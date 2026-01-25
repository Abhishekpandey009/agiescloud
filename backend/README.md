# AegisCloud Backend API

A robust Node.js/Express backend for the AegisCloud file storage application with MongoDB and GridFS for file management.

## Features

- 🔐 **User Authentication** - JWT-based authentication with bcrypt password hashing
- 📁 **File Management** - Upload, download, delete, and organize files using GridFS
- 🔍 **File Search** - Full-text search across file names, descriptions, and tags
- 🏷️ **Smart Tagging** - Automatic tag generation based on file type and content
- 🤝 **File Sharing** - Share files with other users with customizable permissions
- ⭐ **Favorites** - Mark files as favorites for quick access
- 🗑️ **Trash System** - Soft delete with restore functionality
- 🔒 **Rate Limiting** - Comprehensive rate limiting for security
- 📊 **Storage Management** - Track and limit user storage usage
- 🛡️ **Security** - Helmet, CORS, input validation, and more

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **File Storage**: GridFS (MongoDB)
- **Authentication**: JWT + bcrypt
- **Validation**: express-validator
- **Security**: Helmet, CORS, express-rate-limit
- **Environment**: dotenv

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start MongoDB (if running locally)
```bash
mongod
```

5. Run the development server
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Required
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/aegiscloud
JWT_SECRET=your-super-secure-jwt-secret

# Optional
FRONTEND_URL=http://localhost:3000
MAX_FILE_SIZE=52428800
ALLOWED_FILE_TYPES=pdf,doc,docx,txt,jpg,jpeg,png,gif,mp4,mp3,zip,rar
```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /signup` - Register new user
- `POST /login` - Login user
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `PUT /change-password` - Change password
- `GET /verify` - Verify JWT token
- `POST /forgot-password` - Request password reset
- `POST /reset-password/:token` - Reset password
- `GET /verify-email/:token` - Verify email
- `POST /logout` - Logout user

### Files (`/api/files`)
- `POST /upload` - Upload file
- `GET /list` - List user files
- `GET /search` - Search files
- `GET /download/:id` - Download file
- `DELETE /:id` - Delete file (soft delete)
- `PATCH /:id/favorite` - Toggle favorite status
- `GET /favorites` - Get favorite files
- `PATCH /:id/restore` - Restore file from trash
- `POST /:id/share` - Share file with users
- `DELETE /:id/unshare` - Unshare file
- `GET /shared` - Get files shared with user
- `GET /shared-by-me` - Get files shared by user
- `PUT /:id/share-settings` - Update share settings
- `GET /trash` - Get trash files
- `DELETE /:id/permanent` - Permanently delete file
- `DELETE /trash/empty` - Empty trash

### AI Features (`/api/ai`)
Foundational AI-assisted organization endpoints:
- `GET /` - API overview & endpoint map
- `POST /analyze/:fileId` - Basic heuristic analysis (type, size, category, checksum, existing tags)
- `POST /tags/:fileId` - Generate heuristic tag suggestions (not persisted)
- `POST /tags/:fileId/apply` - Apply selected tags to file (persists)
- `GET /similar/:fileId` - Similar files (Jaccard similarity over tags) plus exact duplicates (checksum)
- `GET /duplicates` - All duplicate groups (checksum >1 occurrence)
- `POST /duplicates/cleanup` - Soft-delete duplicates for a checksum keeping one file (merge tags)
- `GET /semantic/search?q=term&limit=20` - Semantic search over names/tags/description
- `POST /tags/:fileId/auto?limit=5` - Auto-apply top suggested tags to a file

### AI Chat (`/api/ai/chat`)
- `GET /sessions` - List chat sessions
- `POST /sessions` - Start new session (optional title, systemPrompt)
- `GET /sessions/:id` - Get full session (messages)
- `POST /sessions/:id/messages` - Send user message & receive assistant reply

If `OPENAI_API_KEY` is not set or the OpenAI library is unavailable, the assistant returns a stub echo response.

Environment variables:
```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-3.5-turbo
# Optional: switch provider to Grok (xAI)
CHAT_PROVIDER=grok
GROK_API_KEY=xa-...
GROK_MODEL=grok-2-latest
# Or Hugging Face Inference API (free tier)
CHAT_PROVIDER=huggingface
HF_API_KEY=hf_...
HF_MODEL=tiiuae/falcon-7b-instruct
# Or Anthropic Claude (Sonnet)
CHAT_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
# Set to your target Claude model (e.g., claude-3-5-sonnet-20241022 or your org alias)
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_VERSION=2023-06-01
LLM_TIMEOUT_MS=30000
```

Streaming (chunked text)
- Endpoint: `POST /api/ai/chat/sessions/:id/messages/stream`
- Returns plain text chunks; message is persisted after stream ends.

Install dependency (backend):
```bash
npm install openai
```

#### Quick Test (PowerShell)
```powershell
# List sessions (should be empty initially)
curl -Method GET http://localhost:5000/api/ai/chat/sessions -Headers @{Authorization="Bearer $env:JWT"}

# Start a session
$body = @{ title = 'First Chat'; systemPrompt = 'You are a helpful assistant.' } | ConvertTo-Json
curl -Method POST http://localhost:5000/api/ai/chat/sessions -Headers @{Authorization="Bearer $env:JWT"; 'Content-Type'='application/json'} -Body $body

# Capture sessionId (replace with actual from previous response)
$sessionId = 'REPLACE_SESSION_ID'

# Send a message
$msg = @{ content = 'Hello assistant, summarize your capabilities.' } | ConvertTo-Json
curl -Method POST http://localhost:5000/api/ai/chat/sessions/$sessionId/messages -Headers @{Authorization="Bearer $env:JWT"; 'Content-Type'='application/json'} -Body $msg

# Get session transcript
curl -Method GET http://localhost:5000/api/ai/chat/sessions/$sessionId -Headers @{Authorization="Bearer $env:JWT"}
```
- `GET /organization/suggestions` - Organization insights (top tags, type distribution, suggested actions)
- `GET /search/suggestions?q=pre` - Tag prefix suggestions for search assist

### Free HF Chat (`/api/chat`)
- `POST /api/chat` with JSON body `{ "message": "...", "model": "tiiuae/falcon-7b-instruct" }`
- Uses Hugging Face Inference API. Set `HF_API_KEY` and optionally `HF_MODEL` in `.env`.
- The endpoint now accepts `model` from the request to override the default and applies light sanitization to reduce generic boilerplate like "I'm here to help".

Troubleshooting repeated generic replies:
- Ensure `HF_API_KEY` is set and valid.
- Try a different model (e.g., `tiiuae/falcon-7b-instruct`). Some base models without instruction tuning can behave poorly.
- Phrase your prompt as an instruction or question. The backend wraps it as `Instruction: ...\n\nResponse:` to guide the model.

Planned future enhancements (not yet implemented):
- Content extraction (OCR / text) for deeper tagging
- Semantic similarity via embeddings
- Automatic folder creation from tag clusters
- Duplicate resolution helpers (bulk merge/delete API)

## File Upload

The API supports file uploads up to 50MB by default. Supported file types include:
- Documents: PDF, DOC, DOCX, TXT
- Images: JPG, JPEG, PNG, GIF
- Videos: MP4
- Audio: MP3
- Archives: ZIP, RAR

## Security Features

- **Rate Limiting**: Different limits for various operations
- **Input Validation**: Comprehensive validation using express-validator
- **Authentication**: JWT tokens with secure defaults
- **Password Security**: bcrypt with salt rounds
- **CORS Protection**: Configured for frontend domains
- **Helmet**: Security headers protection
- **Account Locking**: Protection against brute force attacks

## Database Schema

### User Model
- Authentication fields (name, email, password)
- Profile information (avatar, phone, bio, location)
- Storage management (used/limit)
- Security settings (2FA, notifications)
- Account status (verified, active, locked)

### File Model
- File metadata (name, size, type, mimeType)
- GridFS reference for file storage
- Organization (tags, description, favorites)
- Sharing and permissions
- Activity tracking (downloads, views)
- Soft delete functionality

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (to be implemented)

### Project Structure
```
backend/
├── config/          # Database and configuration
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/         # Database models
├── routes/         # API routes
├── server.js       # Main application file
├── package.json    # Dependencies and scripts
└── .env.example    # Environment template
```

## Deployment

### Heroku
1. Set environment variables in Heroku dashboard
2. Push to Heroku: `git push heroku main`

### Vercel
1. Configure `vercel.json` (already included)
2. Set environment variables in Vercel dashboard
3. Deploy: `vercel --prod`

### Manual Deployment
1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Start with `npm start`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
