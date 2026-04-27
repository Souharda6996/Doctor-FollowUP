# HomeoDoc: Homeopathy AI Assistant

A full-stack medical follow-up application.

## 📁 Repository Structure

- **[homeo-app/](./homeo-app/)**: Next.js 14 Frontend.
- **[backend/](./backend/)**: FastAPI Production Backend.
- **[database/](./database/)**: Supabase PostgreSQL + pgvector schema.

---

### 🛠️ Quick Start

#### 1. Setup Database
Apply the migration found in [database/schema.sql](./database/schema.sql) to your Supabase instance.

#### 2. Start Backend
```bash
cd backend
pip install -r requirements-api.txt
python start_api.py
```

#### 3. Start Frontend
```bash
cd homeo-app
npm install
npm run dev
```

For detailed setup instructions for each service, please refer to their respective README files.
