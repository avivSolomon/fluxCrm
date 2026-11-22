<div dir="rtl">

# מדריך התקנה והרצה – FluxCRM

מדריך זה מיועד לתלמידים. הוא מסביר איך להריץ את הפרויקט **בלחיצה אחת** (להדגמה ולהגנה), ואיך לעבוד עליו בפיתוח.

| חלק | טכנולוגיה | כתובת |
|---|---|---|
| Backend (שרת) | Node.js + Express + MongoDB | http://localhost:8888 |
| Frontend (ממשק) | React (בנוי מראש, מוגש מתיקיית `frontend/dist`) | http://localhost:3000 |

---

## חלק א׳ – מה צריך להתקין (פעם אחת)

1. **Node.js** גרסה **20 או 22 (LTS)** – https://nodejs.org. (גרסאות חדשות יותר עובדות גם הן, אך 20/22 הן הנבדקות ב-CI.)
2. **Git** – https://git-scm.com
3. **MongoDB Community Server** – מותקן כשירות Windows. הדרך הפשוטה, בטרמינל כמנהל:

```bash
winget install MongoDB.Server
```

   (חלופה: Docker – `docker run -d -p 27017:27017 mongo:7`.)

בדיקה שהכול הותקן:

```bash
node -v
git --version
```

---

## חלק ב׳ – הרצה בלחיצה אחת

1. הורידו את הפרויקט:

```bash
git clone https://github.com/avivSolomon/fluxCrm.git FluxCRM
```

2. לחצו פעמיים על **`start-demo.cmd`** בתיקיית הפרויקט.

הסקריפט עושה הכול לבד: בודק Node ו-MongoDB, יוצר את קובץ `backend\.env` (עם מפתח JWT אקראי), מתקין חבילות, מכין נתוני דוגמה, בונה את הממשק (בפעם הראשונה – כשתי דקות), מפעיל את השרת והממשק, ומריץ **בדיקת עשן** (8 בדיקות). בסוף נפתח הדפדפן.

3. התחברו:

| שדה | ערך |
|---|---|
| אימייל | `admin@admin.com` |
| סיסמה | `admin123` |

**עצירה:** `scripts\stop-demo.ps1` (MongoDB נשאר פועל).
**בנייה מחדש של הממשק** (אחרי שינוי בקוד הלקוח): `scripts\start-demo.ps1 -Rebuild`.
**בדיקת עשן בלבד** (כשהמערכת רצה): `scripts\smoke-test.ps1`.

> הפורטים קבועים: 8888 ו-3000. אם הסקריפט אומר שפורט תפוס – הריצו קודם `scripts\stop-demo.ps1`.

### נתוני הדוגמה
הנתונים (6 לקוחות, 47 חשבוניות ו-34 תשלומים) נוצרים באופן **קבוע** – בכל פעם אותם מספרים. כדי לאפס אותם: `cd backend` ואז `npm run seed`.

---

## חלק ג׳ – עבודה בפיתוח

```bash
cd backend
npm install
npm run dev        # שרת עם הפעלה מחדש אוטומטית (8888)
```

```bash
cd frontend
npm install
npm run dev        # Vite עם רענון חי (3000)
```

### בדיקות

```bash
cd backend
npm test           # 34 בדיקות שרת (דורש MongoDB פועל)
npm run test:unit  # בדיקות יחידה בלבד (בלי MongoDB)
```

```bash
cd frontend
npm test           # 11 בדיקות רכיבים (Vitest, בלי שרת)
npm run lint:own   # בדיקת סגנון לקבצים שפיתחנו
```

```bash
cd e2e
npx playwright test   # 7 בדיקות דפדפן (כשהמערכת רצה)
```

ה-CI ב-GitHub (`.github/workflows/ci.yml`) מריץ את בדיקות השרת על Node 20 ו-22, את בדיקות הרכיבים והבנייה, ואת בדיקות הדפדפן מול המערכת המלאה.

---

## פתרון בעיות נפוצות

| הבעיה | הפתרון |
|---|---|
| `MongoDB is not running on 127.0.0.1:27017` | התקינו MongoDB (חלק א׳), או הפעילו את השירות: `net start MongoDB` (כמנהל). |
| `Port 8888/3000 is already in use` | `scripts\stop-demo.ps1`. |
| `Could not start service 'MongoDB'` | הריצו את הסקריפט פעם אחת כמנהל. |
| מסך 404 / ריק אחרי שינוי בקוד הלקוח | `scripts\start-demo.ps1 -Rebuild`. |
| רוצים להתחיל ממסד נקי | מחקו את המסד `fluxcrm` (ב-MongoDB Compass) והריצו שוב את `start-demo.cmd`. |
| שגיאת `EBADENGINE` / גרסת Node ישנה | התקינו Node 20 או 22. |

</div>
