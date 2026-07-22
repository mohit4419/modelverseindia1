# Architecture Layout (ModelVerse India)

ModelVerse India utilizes a layered modular architectural layout ensuring robust offline/sandboxed capabilities alongside seamless integration with Supabase and relational PostgreSQL databases.

## Layered Design Flow
The system operates using a strict unidirectional control sequence:

```
[Client App Fetch] 
       ↓
[Route Layer (v2)] - Enforces authentication and validators (Zod schemas)
       ↓
[Controller Layer] - Manages express Request/Response streams
       ↓
[Service Layer]    - Executes business logic, security permissions, and notifications
       ↓
[Repository Layer] - Directs persistence, merging local JSON storage with remote Supabase
```

## Resilience Mechanics
* **Hybrid Storage Pattern:** Repositories automatically store records locally in JSON files (`local_models.json`, `local_categories.json`, etc.) while pushing real-time updates asynchronously to Supabase when active. This prevents crashes if Supabase configurations are missing or connection rates fluctuate.
* **Separation of Concerns:** Shared schemas, DTOs, interfaces, and validation boundaries reside in `/shared` ensuring complete compilation parity across full-stack layers.
