<div dir="rtl">

# מדריך התקנה והרצה – FluxCRM

מדריך זה מיועד לתלמידים. הוא מסביר איך להתקין את הפרויקט **בפעם הראשונה**, ואיך להריץ אותו **בכל פעם אחרי זה**.

הפרויקט בנוי משני חלקים שרצים במקביל:

| חלק | טכנולוגיה | כתובת |
|---|---|---|
| Backend (שרת) | Node.js + Express + MongoDB | http://localhost:8888 |
| Frontend (ממשק) | React + Vite | http://localhost:3000 |

---

## חלק א׳ – התקנה בפעם הראשונה

### שלב 0: תוכנות שצריך להתקין מראש

1. **Node.js** גרסה 20 ומעלה (מומלץ גרסת LTS) – https://nodejs.org
2. **Git** – https://git-scm.com
3. **VS Code** (או כל עורך קוד אחר) – https://code.visualstudio.com
4. **חשבון MongoDB Atlas** (חינמי) – https://www.mongodb.com/cloud/atlas

בדיקה שהכול הותקן – פתחו טרמינל (PowerShell ב-Windows) והריצו:

```bash
node -v
npm -v
git --version
```

אם כל פקודה מדפיסה מספר גרסה – מצוין. ‏`node -v` חייב להציג **20 או 22**. אל תתקינו גרסאות חדשות יותר (25 ומעלה) – ה-Backend לא יעלה בהן.

### שלב 1: הורדת הפרויקט

```bash
git clone https://github.com/avivSolomon/fluxCrm.git FluxCRM
cd FluxCRM
```

### שלב 2: יצירת מסד נתונים ב-MongoDB Atlas

1. היכנסו ל-Atlas וצרו **Cluster** חינמי (M0).
2. ב-**Database Access** צרו משתמש עם שם משתמש וסיסמה. **שמרו אותם** – תצטרכו אותם עוד רגע.
3. ב-**Network Access** לחצו **Add IP Address** ← **Allow access from anywhere** (או הוסיפו את ה-IP שלכם).
   > אם ה-IP שלכם משתנה (למשל מעבר בין בית לכיתה) ותקבלו שגיאת חיבור – חזרו לכאן והוסיפו אותו שוב.
4. לחצו **Connect** ← **Drivers** והעתיקו את מחרוזת החיבור. היא נראית כך:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   החליפו `<user>` ו-`<password>` בפרטים שיצרתם, והוסיפו שם למסד הנתונים לפני סימן ה-`?`, למשל `/fluxcrm`.

### שלב 3: קובץ ההגדרות של ה-Backend

בתיקייה `backend` יש קובץ בשם `.env.example`. מעתיקים אותו לקובץ בשם `.env`:

```bash
cd backend
copy .env.example .env
```

(ב-Mac/Linux: `cp .env.example .env`)

פתחו את `.env` ב-VS Code ועדכנו:

```env
DATABASE = "מחרוזת-החיבור-שלכם-מ-Atlas"
JWT_SECRET = "כאן-מחרוזת-אקראית-ארוכה"
NODE_ENV = "development"
PUBLIC_SERVER_FILE = "http://localhost:8888/"
```

ליצירת `JWT_SECRET` אקראי הריצו:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

והעתיקו את התוצאה.

> ⚠️ **אסור להעלות את `.env` ל-Git ולא לשלוח אותו לאף אחד** – הוא מכיל סיסמאות. הוא כבר מוגדר ב-`.gitignore`.

### שלב 4: קובץ ההגדרות של ה-Frontend

בתיקייה `frontend` יש קובץ `.env` (אם אין – העתיקו את `temp.env` לשם `.env`). בהרצה מקומית **אין צורך לשנות בו כלום**; ה-Vite מעביר אוטומטית בקשות `/api` אל `http://localhost:8888`.

### שלב 5: התקנת חבילות

פותחים **שני טרמינלים** (ב-VS Code: `Terminal` ← `New Terminal`, ואז כפתור `+`).

**טרמינל 1 – Backend:**

```bash
cd backend
npm install
```

**טרמינל 2 – Frontend:**

```bash
cd frontend
npm install
```

ההתקנה יכולה לקחת כמה דקות. אזהרות (`warn`) בסדר – שגיאות (`ERR!`) לא.

### שלב 6: אתחול מסד הנתונים (פעם אחת בלבד!)

בטרמינל של ה-Backend:

```bash
npm run setup
```

הפקודה יוצרת משתמש מנהל והגדרות ברירת מחדל. אתם אמורים לראות:

```
👍 Admin created : Done!
👍 Settings created : Done!
```

> ⚠️ **מריצים את `setup` רק פעם אחת.** הרצה שנייה על אותו מסד נתונים תיצור כפילויות או תיכשל. אם התבלבלתם – מחקו את המסד ב-Atlas (או צרו חדש) והריצו שוב.

### שלב 7: הרצה

**טרמינל 1 (Backend):**

```bash
npm run dev
```

חכו עד שתראו `Express running → On PORT : 8888`.

**טרמינל 2 (Frontend):**

```bash
npm run dev
```

פתחו בדפדפן: **http://localhost:3000**

### שלב 8: כניסה למערכת

| שדה | ערך |
|---|---|
| אימייל | `admin@admin.com` |
| סיסמה | `admin123` |

🎉 אם אתם רואים את לוח הבקרה – הכול עובד!

---

## חלק ב׳ – הרצה בפעמים הבאות

אחרי ההתקנה הראשונה **לא צריך** `npm install`, **לא** `npm run setup` ולא לגעת ב-`.env`. רק:

1. פתחו את תיקיית `FluxCRM` ב-VS Code.
2. פתחו שני טרמינלים.

**טרמינל 1:**

```bash
cd backend
npm run dev
```

**טרמינל 2:**

```bash
cd frontend
npm run dev
```

3. היכנסו ל-http://localhost:3000.

**לעצירה:** בכל טרמינל לחצו `Ctrl + C`.

### מתי כן צריך `npm install` שוב?

- אחרי `git pull` שהביא שינויים ב-`package.json`.
- אם קיבלתם שגיאת `Cannot find module`.

מריצים אותו בתיקייה המתאימה (`backend` ו/או `frontend`).

### קבלת עדכונים מהמורה

```bash
git pull
```

---

## פתרון בעיות נפוצות

| הבעיה | הפתרון |
|---|---|
| `MongoServerSelectionError` / שגיאת חיבור למסד | ה-IP שלכם לא ברשימה ב-Atlas (Network Access), או שהסיסמה ב-`DATABASE` שגויה. אם בסיסמה יש תווים מיוחדים (`@`, `#`, `/`) – החליפו אותה בסיסמה פשוטה יותר. |
| `Please upgrade your node.js version` | הגרסה ישנה. התקינו Node 20 ומעלה. |
| ה-Backend קורס עם `Cannot read properties of undefined (reading 'prototype')` (מופיע ב-`jwa` / `buffer-equal-constant-time`) | הגרסה **חדשה מדי**. Node 25 ומעלה לא תואם לחבילת ה-JWT. התקינו **Node 20 או 22 (LTS)**, לא את הגרסה האחרונה. |
| `connection timed out` למסד מקומי (`mongodb://localhost:27017`) | ב-`.env` החליפו `localhost` ב-`127.0.0.1`: `mongodb://127.0.0.1:27017/idurar` (בעיית IPv6). לא קורה עם Atlas. |
| `Port 8888 is already in use` | יש עוד Backend רץ. סגרו טרמינלים ישנים (`Ctrl + C`) ונסו שוב. |
| `Port 3000 is already in use` | כנ״ל לגבי Frontend ישן. |
| הדפדפן מציג שגיאת רשת / `ECONNREFUSED` | ה-Backend לא רץ. בדקו שבטרמינל 1 מופיע `Express running`. |
| `Cannot find module ...` | הריצו `npm install` בתיקייה הרלוונטית. |
| שגיאת `OpenSSL` / `digital envelope routines` | `$env:NODE_OPTIONS = "--openssl-legacy-provider"` (PowerShell) ואז `npm run dev`. מומלץ לשדרג ל-Node 20+. |
| ההתחברות נכשלת | ודאו שהרצתם `npm run setup` **פעם אחת** ושמשתמשים ב-`admin@admin.com` / `admin123`. |
| `npm` או `node` לא מזוהים | סגרו ופתחו מחדש את הטרמינל/VS Code אחרי התקנת Node. |

---

## סיכום קצר (לשמירה)

**פעם ראשונה:** `git clone` ← יצירת מסד ב-Atlas ← `backend/.env` ← `npm install` בשתי התיקיות ← `npm run setup` (פעם אחת!) ← `npm run dev` בשתיהן.

**כל פעם אחרת:** `npm run dev` ב-`backend`, `npm run dev` ב-`frontend`, ופתיחת http://localhost:3000.

</div>
