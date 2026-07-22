# API Specifications (ModelVerse India)

## Authentication API (V2)

### 1. User Registration
* **Endpoint:** `POST /api/v2/auth/register`
* **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "name": "John Doe",
    "phone_number": "+919876543210",
    "role": "client"
  }
  ```
* **Response:** `201 Created` with jwt token and profile data.

### 2. User Login
* **Endpoint:** `POST /api/v2/auth/login`
* **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```
* **Response:** `200 OK` with token and user profile details.

---

## Models & Bookings API (V2)

### 3. Fetch Models
* **Endpoint:** `GET /api/v2/models?approved=true`
* **Response:** `200 OK` list of approved models.

### 4. Create Booking
* **Endpoint:** `POST /api/v2/bookings`
* **Body:**
  ```json
  {
    "clientId": "client_id",
    "modelId": "model_id",
    "amount": 25000,
    "bookingDate": "2026-08-15",
    "location": "Mumbai, India",
    "notes": "E-commerce fashion campaign"
  }
  ```
* **Response:** `201 Created` with details of booking.

---

## Categories & Skills API (V2)

### 5. Fetch Categories
* **Endpoint:** `GET /api/v2/categories`
* **Response:** `200 OK` category list.

### 6. Fetch Skills
* **Endpoint:** `GET /api/v2/skills`
* **Response:** `200 OK` skills list.
