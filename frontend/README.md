## AegisCloud Frontend

React + Vite + TypeScript frontend for AegisCloud.

### Key Sections
- Landing (Hero, Features, AI Features, Security)
- Auth (Signup / Login pages)
- Dashboard (authenticated file management placeholder)
- AI Insights (new) `/ai`

### AI Insights Dashboard
The AI dashboard consumes the backend AI endpoints to provide:
- Organization Overview: total files, total size, top tags, type distribution
- Duplicate Groups: checksum-based duplicate detection list
- Planned Actions: placeholders for upcoming automation (folder creation, cleanup)

Duplicate cleanup features:
- Select which file to keep per duplicate checksum group (radio column)
- Shows reclaimable size (sum of all duplicate sizes minus kept file size)
- Cleanup performs soft-delete (moves duplicates to trash) and merges tags into the kept file

Components added:
- `src/components/AIDashboard.tsx`
- API helpers in `src/api/ai.ts`

Navigation automatically shows an “AI Insights” link when logged in.

### Environment Assumptions
The app expects a backend at the same origin (`/api`). If served separately, configure a proxy (Vite dev server) or set absolute URLs in `api` helper modules.

### Development
```bash
npm install
npm run dev
```

### Future Enhancements
- Tag application UI flow
- Duplicate cleanup actions (bulk delete / keep newest)
- Semantic search & smart folder generation
- Tag suggestion acceptance workflow inline in file views

---
This README will grow as more frontend features are integrated.
