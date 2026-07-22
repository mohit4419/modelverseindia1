# Database Schema (ModelVerse India)

## Core Tables

### 1. `profiles`
* **id:** Primary Key, matches Supabase Auth UID.
* **name:** Full Name.
* **email:** Email.
* **role:** 'client' | 'model' | 'admin'.
* **status:** 'active' | 'suspended'.

### 2. `users`
* **id:** Primary Key.
* **email:** Unique email index.
* **password_hash:** Hashed password string.
* **salt:** Cryptographic salt.

### 3. `models`
* **id:** Primary Key.
* **userId:** References users table.
* **name:** Display name.
* **city / state:** Location tags.
* **category:** Models category filter.
* **startingPrice:** Price in INR.

---

## Auxiliary Relational Tables

### 4. `categories`
* **id:** Primary Key.
* **name:** Category description (e.g. Ramp, Print, Parts).

### 5. `skills`
* **id:** Primary key.
* **name:** Skill tags (e.g. artistic posing).
* **categoryId:** Category grouping.

### 6. `favorites`
* **id:** Primary Key.
* **client_id:** Shortlist reference client.
* **model_id:** Shortlist reference model.
