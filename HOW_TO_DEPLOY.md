# Step-by-Step Guide: How to Run This Project on Another Computer

Agar aap is project ko kisi dusre computer (PC/Laptop) par chalana chahte hain, toh neeche diye gaye steps ko dhyan se follow karein.

---

## 1. Prerequisites (Zaroori Software)
Naye computer me yeh 2 software install hone chahiye:
1. **Node.js**: [Download here](https://nodejs.org/) (LTS version install karein).
2. **VS Code** (Ya koi aur Code Editor): [Download here](https://code.visualstudio.com/).
3. **Python**: Quantum circuits aur AI scripts run karne ke liye Python 3+ install hona zaroori hai.

---

## 2. Project Setup
1. Maine jo **`QuantumLab_DRDO.zip`** file create ki hai, use naye computer me bhej dein (via PenDrive / Google Drive).
2. Naye computer me us `.zip` file ko **Extract** (unzip) kar lein.
3. Extracted folder ko **VS Code** me open karein.

---

## 3. Environment Variables (.env File)
Jab aap zip file extract karenge, toh hidden files (jaise `.env`) extract ho jayengi. Fir bhi aap check kar lena ki root folder me `.env` file mojood ho.
Isme database aur API keys hoti hain:

```env
MONGO_URI=mongodb+srv://... (Aapki DB link)
JWT_SECRET=your_super_secret_jwt_key
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
PYTHON_PATH=python

# Cloudinary (Images ke liye)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Google OAuth (Login ke liye)
GOOGLE_CLIENT_ID=...
VITE_GOOGLE_CLIENT_ID=...

# GNews API (News ke liye)
GNEWS_API_KEY=...
```
*(Aap chahein toh apni purani `.env` file ko seedha naye PC me copy-paste kar sakte hain).*

---

## 4. Install Dependencies
Kyunki humne `.zip` file ka size chota rakhne ke liye `node_modules` folder ko hata diya tha, isliye aapko naye PC par packages install karne honge.

**Backend Setup:**
1. VS Code me Terminal open karein (`Ctrl + ~`).
2. Backend folder me jayein aur install karein:
   ```bash
   cd backend
   npm install
   ```

**Frontend Setup:**
1. Ek aur naya Terminal open karein (VS Code me terminal panel ke top right me `+` icon par click karein).
2. Root folder (main folder) me reh kar run karein:
   ```bash
   npm install
   ```

---

## 5. Run the Project
Project ko chalane ke liye dono terminals me command run karni padegi.

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```
*(Backend `http://localhost:8000` par start ho jayega)*

**Terminal 2 (Frontend):**
```bash
npm run dev
```
*(Frontend `http://localhost:5173` par start ho jayega)*

Ab aap apne naye computer ke browser me **`http://localhost:5173`** open karke puri website aur Admin Panel use kar sakte hain! 🚀

---

## (Optional) Online Deploy Karne Ke Steps (Vercel/Render)
Agar aap isko kisi aur PC par local chalane ke bajaye internet par (live) deploy karna chahte hain, toh ye steps use karein:
1. Apna pura code **GitHub** par upload (push) karein.
2. Backend ko **Render.com** par deploy karein. Waha Environment Variables (`.env` wale) configure karein. Start command me `node server.js` likhein.
3. Frontend ko **Vercel.com** par deploy karein. Framework me `Vite` select karein aur Environment Variables me ye add karein:
   - `VITE_API_BASE_URL` → Render ka URL + `/api` (Jaise: `https://xyz.onrender.com/api`)
   - `VITE_GOOGLE_CLIENT_ID` → Aapka Google OAuth Client ID (Jaise: `878678...apps.googleusercontent.com`)
4. Jab Vercel ka URL mil jaye, toh usko wapas Render me `FRONTEND_URL` naam se add kar dein taaki CORS block na kare.
5. Google Cloud Console me bhi apna Vercel production URL add karein (neeche Section 7 dekhein).

---

## 6. Google OAuth Setup (Sign In with Google)

Yeh section batata hai ki **Google Sign-In** feature ke liye Google Cloud Console me kya-kya karna hota hai. Agar aap naya project bana rahe hain ya kisi aur Google account se setup kar rahe hain, toh in steps ko follow karein.

### Step 1: Google Cloud Console me jayein
1. Browser me jayein: **[https://console.cloud.google.com](https://console.cloud.google.com)**
2. Apne Google account se login karein.

### Step 2: Naya Project banayein (ya existing select karein)
1. Top-left me project selector hoga (jaise "drdo" likha hua) — us par click karein.
2. **"NEW PROJECT"** par click karein.
3. Project Name daalein (jaise: `QuantumLab` ya `drdo`).
4. **"Create"** par click karein.
5. Project ban jane ke baad, usko select karein.

### Step 3: OAuth Consent Screen configure karein
1. Left sidebar me jayein: **APIs & Services → OAuth consent screen** (ya search karein "OAuth consent screen").
2. **"Get Started"** ya **"Configure Consent Screen"** par click karein.
3. **App Information** fill karein:
   - **App name**: `Quantiva` (ya jo bhi naam chahiye)
   - **User support email**: Apna Gmail select karein
   - **Developer contact email**: Apna Gmail daalein
4. **Audience** section me:
   - **User Type**: `External` select karein (taaki koi bhi login kar sake)
5. Baaki sab default rakh ke **"Save and Continue"** karte jayein.
6. **Publish** karein: Agar "Testing" mode me hai toh **"PUBLISH APP"** button par click karein. Testing mode me sirf manually add kiye gaye test users hi login kar paayenge.

### Step 4: OAuth Client ID banayein
1. Left sidebar me jayein: **APIs & Services → Credentials** (ya search karein "Credentials").
2. Top par **"+ CREATE CREDENTIALS"** par click karein → **"OAuth client ID"** select karein.
3. **Application type**: `Web application` select karein.
4. **Name**: Kuch bhi daal do (jaise: `GitHappens` ya `quantumlab-web`).
5. **Authorized JavaScript origins** me yeh URLs add karein:

   **Local Development ke liye:**
   ```
   http://localhost:5173
   http://localhost:5174
   ```

   **Production ke liye (Vercel):**
   ```
   https://quantum-sim-lab.vercel.app
   ```
   *(Apna actual production URL daalein)*

6. **Authorized redirect URIs** — Abhi ke liye blank chhod sakte hain (Google Sign-In button library ko redirect URI ki zaroorat nahi hoti).
7. **"Create"** par click karein.
8. Ek popup aayega jisme **Client ID** dikhega — isko copy kar lein.

### Step 5: Client ID ko project me add karein

**Local Development (.env file):**
Root folder ki `.env` file me yeh 2 lines add/update karein:
```env
GOOGLE_CLIENT_ID=aapka-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=aapka-client-id.apps.googleusercontent.com
```
> **Note:** Dono same honi chahiye. `GOOGLE_CLIENT_ID` backend use karta hai aur `VITE_GOOGLE_CLIENT_ID` frontend use karta hai.

**Production (Vercel):**
1. Vercel Dashboard → Apna project → **Settings → Environment Variables**
2. Yeh variable add karein:
   - **Key**: `VITE_GOOGLE_CLIENT_ID`
   - **Value**: Wahi Client ID jo aapne copy kiya
   - **Environment**: `Production` (aur `Preview` bhi agar chahiye toh)
3. **Redeploy** karein (Deployments → latest deployment par 3 dots → Redeploy). Bina redeploy ke change nahi aayega kyunki Vite build time par env vars ko bundle me bake karta hai.

**Production (Render — Backend):**
1. Render Dashboard → Apna backend service → **Environment**
2. Yeh variable add karein:
   - **Key**: `GOOGLE_CLIENT_ID`
   - **Value**: Wahi Client ID

### Step 6: Test karein
1. Browser me `http://localhost:5173` open karein (local) ya apna production URL.
2. Login page par jayein.
3. **"Sign in with Google"** button par click karein.
4. Google account select karein aur authorize karein.
5. Dashboard par redirect ho jaana chahiye. ✅

### Common Errors aur Solutions

| Error | Kya hua | Solution |
|-------|---------|----------|
| `The given origin is not allowed for the given client ID` | Browser ka URL, Google Console ke Authorized JavaScript origins me nahi hai | Google Console me `http://localhost:5173` ya apna production URL add karein |
| `The OAuth client was not found (401: invalid_client)` | Client ID galat hai ya production me `VITE_GOOGLE_CLIENT_ID` set nahi hai | Vercel me env var add karein aur **redeploy** karein |
| `Cross-Origin-Opener-Policy would block the window.postmessage call` | Browser security header Google popup ko block kar raha hai | `vite.config.js` me `"Cross-Origin-Opener-Policy": "same-origin-allow-popups"` header add karein (already done) |
| `popup_closed_by_user` | User ne Google popup band kar diya | User ko dubara try karna hoga |
| `Consent screen is in Testing mode` | Sirf test users login kar sakte hain | Google Console → OAuth consent screen → **PUBLISH APP** |

---

## 7. Production me Google OAuth Origins Update Karna

Jab bhi aapka production URL change ho (jaise naya Vercel deployment), toh Google Console me bhi update karna zaroori hai:

1. [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials) jayein.
2. Apna OAuth Client ID click karein.
3. **Authorized JavaScript origins** me naya URL add karein.
4. **Save** karein.
5. 2-5 minute wait karein (Google ko propagate hone me time lagta hai).
