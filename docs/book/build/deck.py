# Builds the FluxCRM defense presentation (edition 2), Hebrew RTL, 16:9.
# Run: python deck.py <out.pptx>
import sys, os, re
from pptx import Presentation
from pptx.util import Cm, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
A = lambda f: os.path.join(ROOT, 'docs', 'book', 'assets', f)
D = lambda f: os.path.join(ROOT, 'docs', 'book', 'diagrams', f)

NAVY = RGBColor(0x1F, 0x38, 0x64); BLUE = RGBColor(0x2E, 0x75, 0xB6); GREY = RGBColor(0x47, 0x55, 0x69)
GREEN = RGBColor(0x2E, 0x7D, 0x32); ORANGE = RGBColor(0xE6, 0x51, 0x00); LIGHT = RGBColor(0xEA, 0xF2, 0xFB)
FONT = 'Arial'

prs = Presentation()
prs.slide_width, prs.slide_height = Cm(33.867), Cm(19.05)
W, H = prs.slide_width, prs.slide_height
BLANK = prs.slide_layouts[6]


def rtl(p, align=PP_ALIGN.RIGHT):
    p.alignment = align
    pPr = p._p.get_or_add_pPr()
    pPr.set('rtl', '1')


LATIN = re.compile(r"\$?[A-Za-z][A-Za-z0-9_./:$@#=+*?&%\-]*(?: \$?[A-Za-z0-9][A-Za-z0-9_./:$@#=+*?&%\-]*)*")


def run(p, text, size=20, bold=False, color=GREY):
    # split into Hebrew and Latin runs so PowerPoint orders mixed text correctly
    last = 0
    for m in LATIN.finditer(text):
        tok = m.group(0).rstrip('.,:;-')
        if not tok:
            continue
        if m.start() > last:
            _run(p, text[last:m.start()], size, bold, color, 'he-IL')
        _run(p, tok, size, bold, color, 'en-US')
        last = m.start() + len(tok)
    if last < len(text):
        _run(p, text[last:], size, bold, color, 'he-IL')


def _run(p, text, size, bold, color, lang):
    r = p.add_run(); r.text = text
    f = r.font; f.size = Pt(size); f.bold = bold; f.color.rgb = color; f.name = FONT
    rPr = r._r.get_or_add_rPr(); rPr.set('lang', lang)
    cs = rPr.find(qn('a:cs'))
    if cs is None:
        cs = rPr.makeelement(qn('a:cs'), {}); rPr.append(cs)
    cs.set('typeface', FONT)
    return r


def textbox(slide, x, y, w, h, lines, size=20, color=GREY, bullet=True, align=PP_ALIGN.RIGHT, space=6):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame; tf.word_wrap = True
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        rtl(p, align); p.space_after = Pt(space)
        sub = isinstance(line, tuple)
        txt = line[1] if sub else line
        prefix = ('    – ' if sub else '•  ') if bullet else ''
        bold_part = None
        if txt.startswith('**') and '**' in txt[2:]:
            j = txt.index('**', 2); bold_part = txt[2:j]; txt = txt[j + 2:]
        run(p, prefix, size - (2 if sub else 0), color=BLUE)
        if bold_part: run(p, bold_part, size - (2 if sub else 0), True, NAVY)
        run(p, txt, size - (2 if sub else 0), color=color)
    return tb


def header(slide, title, sub=None):
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, W, Cm(2.6))
    bar.fill.solid(); bar.fill.fore_color.rgb = NAVY; bar.line.fill.background()
    tb = slide.shapes.add_textbox(Cm(1.2), Cm(0.45), W - Cm(2.4), Cm(1.8))
    p = tb.text_frame.paragraphs[0]; rtl(p); run(p, title, 30, True, RGBColor(0xFF, 0xFF, 0xFF))
    if sub:
        tb2 = slide.shapes.add_textbox(Cm(1.2), Cm(2.8), W - Cm(2.4), Cm(1.0))
        p2 = tb2.text_frame.paragraphs[0]; rtl(p2); run(p2, sub, 16, False, BLUE)


def footer(slide, n):
    tb = slide.shapes.add_textbox(Cm(1), H - Cm(1.1), Cm(10), Cm(0.8))
    p = tb.text_frame.paragraphs[0]; p.alignment = PP_ALIGN.LEFT
    run(p, f'FluxCRM · {n}', 11, color=RGBColor(0x9C, 0xA3, 0xAF))


def picture(slide, path, x, y, max_w, max_h):
    w, h = Image.open(path).size
    scale = min(max_w / w, max_h / h)
    pw, ph = int(w * scale), int(h * scale)
    slide.shapes.add_picture(path, int(x + (max_w - pw) / 2), int(y), pw, ph)


def caption(slide, x, y, w, text):
    textbox(slide, x, y, w, Cm(0.9), [text], 13, GREY, bullet=False, align=PP_ALIGN.CENTER)


n = 0
def new(title, sub=None):
    global n
    n += 1
    s = prs.slides.add_slide(BLANK); header(s, title, sub); footer(s, n); return s

# 1 Title -----------------------------------------------------------------
n += 1
s = prs.slides.add_slide(BLANK)
bg = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, W, H); bg.fill.solid(); bg.fill.fore_color.rgb = NAVY; bg.line.fill.background()
textbox(s, Cm(2), Cm(3.2), W - Cm(4), Cm(3), ['FluxCRM'], 66, RGBColor(0xFF, 0xFF, 0xFF), bullet=False, align=PP_ALIGN.CENTER)
textbox(s, Cm(2), Cm(6.6), W - Cm(4), Cm(2), ['מערכת לניהול לקוחות, חשבוניות ותשלומים לנותני שירות'], 28, RGBColor(0xDB, 0xEA, 0xFE), bullet=False, align=PP_ALIGN.CENTER)
textbox(s, Cm(2), Cm(9.4), W - Cm(4), Cm(5), [
    'פרויקט גמר — הנדסת תוכנה · מסלול טכנאים מוסמכים',
    'מגישים: רם רחמים משיח · מנחם מענדל לאופר',
    'מנחה: אביב סולומון',
    'המרכז החרדי להכשרה מקצועית — בני ברק',
], 20, RGBColor(0xFF, 0xFF, 0xFF), bullet=False, align=PP_ALIGN.CENTER)

# 2 What --------------------------------------------------------------------
s = new('מה זה FluxCRM?')
textbox(s, Cm(1.5), Cm(3.4), W - Cm(3), Cm(14), [
    'מערכת ווב לניהול לקוחות, חשבוניות ותשלומים',
    'קהל יעד: נותני שירות ועסקים קטנים — פרילנסרים, יועצים, קליניקות',
    'מסך אנליטיקה: הכנסות לפי חודש, פילוח סטטוסים, 5 לקוחות מובילים, בחירת טווח וייצוא CSV',
    'עברית ואנגלית עם RTL, וההעדפה נשמרת בחשבון המשתמש',
    'עובדת במחשב, בטאבלט ובטלפון',
    'מבוססת MERN: MongoDB · Express · React · Node',
], 22)

# 3 Problem -----------------------------------------------------------------
s = new('הבעיה בשוק')
textbox(s, Cm(1.5), Cm(3.4), W - Cm(3), Cm(14), [
    'מערכות CRM קיימות (Salesforce, Zoho, Monday) עוצמתיות, אבל:',
    ('', 'יקרות ומורכבות מדי לעסק קטן'),
    ('', 'תמיכה חלקית בעברית ו-RTL'),
    ('', 'סגורות — אין גישה לקוד ולהתאמות'),
    'הצורך: כלי פשוט, חסכוני, בעברית מלאה, שאפשר לארח בעצמנו',
], 24)

# 4 Base vs ours --------------------------------------------------------------
s = new('הבסיס מול מה שהוספנו', 'בסיס קוד פתוח: IDURAR (AGPL-3.0) — למדנו, תיקנו, הקשחנו והרחבנו')
textbox(s, Cm(17.5), Cm(4.2), Cm(15), Cm(13), [
    '**מהבסיס: **ניהול לקוחות, חשבוניות ותשלומים',
    '**מהבסיס: **התחברות JWT ו-bcrypt',
    '**מהבסיס: **מסכי CRUD והפקת PDF',
], 20)
textbox(s, Cm(1.2), Cm(4.2), Cm(16), Cm(13), [
    '**שלנו: **העדפת שפה שנשמרת בשרת + עברית ו-RTL',
    '**שלנו: **אנליטיקה עם טווח וייצוא CSV',
    '**שלנו: **שכבה רספונסיבית (390 / 768 / מחשב)',
    '**שלנו: **31 בדיקות שרת + 3 בדיקות דפדפן + CI',
    '**שלנו: **הפעלה בלחיצה אחת, seed קבוע, בדיקת עשן',
    '**שלנו: **הקשחות: הגבלת קצב, 401 לטוקן פגום, הזרקה, CORS',
], 20)

# 5 Architecture ----------------------------------------------------------
s = new('ארכיטקטורה — שלוש שכבות')
picture(s, D('arch.png'), Cm(1.5), Cm(3.6), W - Cm(3), Cm(9))
textbox(s, Cm(1.5), Cm(13.4), W - Cm(3), Cm(4), [
    'כל בקשה: מסך ← axios + JWT ← Express ← middleware אימות ← בקר ← MongoDB ← JSON ← מסך',
    'נבחרה מול חלופות: מונוליט MVC ו-Microservices',
], 18)

# 6 Division --------------------------------------------------------------
s = new('חלוקת העבודה — לפי שכבות, בתרחיש מלא')
textbox(s, Cm(17.5), Cm(3.6), Cm(15), Cm(14), [
    '**רם רחמים משיח — צד הלקוח**',
    ('', 'בורר שפה, תרגומים ו-RTL'),
    ('', 'מסך האנליטיקה, בחירת טווח והורדת CSV'),
    ('', 'רספונסיביות ובדיקות דפדפן'),
], 21)
textbox(s, Cm(1.2), Cm(3.6), Cm(15.5), Cm(14), [
    '**מנחם מענדל לאופר — צד השרת**',
    ('', 'התחברות ואימות JWT'),
    ('', 'שמירת העדפת השפה והחזרתה'),
    ('', 'אגרגציית האנליטיקה ונתוני הייצוא'),
    ('', 'בדיקות השרת'),
], 21)
textbox(s, Cm(1.5), Cm(14.6), W - Cm(3), Cm(2), ['כל אחד מציג תרחיש מלא ומסביר גם את הצד של חברו'], 18, BLUE, bullet=False, align=PP_ALIGN.CENTER)

# 7 Ram primary -------------------------------------------------------------
s = new('זרימת השפה מקצה לקצה', 'ירוק: רם (ממשק) · כתום וסגול: מנחם (שרת ומסד)')
picture(s, D('ram.png'), Cm(1.2), Cm(3.9), W - Cm(2.4), Cm(14))

# 8 Ram analytics -----------------------------------------------------------
s = new('רם — מסך האנליטיקה וייצוא CSV')
picture(s, A('02-analytics-en.png'), Cm(17.2), Cm(3.3), Cm(15.6), Cm(12.6)); caption(s, Cm(17.2), Cm(16.1), Cm(15.6), 'אנגלית')
picture(s, A('03-analytics-he.png'), Cm(1.0), Cm(3.3), Cm(15.6), Cm(12.6)); caption(s, Cm(1.0), Cm(16.1), Cm(15.6), 'עברית — RTL, תפריט מימין')

# 9 Responsive ------------------------------------------------------------
s = new('רם — רספונסיביות', 'אותו קוד באנגלית ובעברית, בזכות מאפיינים לוגיים ושאילתות מדיה')
for i, (f, cap) in enumerate([('08-mobile-analytics-he.png', 'טלפון — אנליטיקה'), ('09-mobile-invoices-en.png', 'טלפון — סטטוס מתחת ללקוח'), ('11-mobile-invoice-create-he.png', 'טלפון — שדה בכל שורה')]):
    x = W - Cm(1.2) - Cm(10.4) * (i + 1)
    picture(s, A(f), x, Cm(4.0), Cm(10), Cm(12.2)); caption(s, x, Cm(16.4), Cm(10), cap)

# 10 Menahem JWT ----------------------------------------------------------
s = new('מנחם — התחברות, אימות ושמירת השפה')
textbox(s, Cm(1.5), Cm(3.4), W - Cm(3), Cm(14), [
    'בהתחברות השרת משווה ב-bcrypt את הסיסמה, בתוספת salt, לגיבוב השמור',
    'אם היא נכונה, נחתם JWT לתוקף של 24 שעות ונוסף לרשימת loggedSessions',
    'בכל בקשה, isValidAuthToken בודק את החתימה ואת רשימת הסשנים; אחרת 401',
    'התנתקות מוציאה את הטוקן מהרשימה — טוקן ישן נדחה (נבדק)',
    'טוקן פגום או פג תוקף: 401 ולא 500 (הקשחה שלנו)',
    'הגבלת קצב: 20 ניסיונות התחברות ל-15 דקות',
    'שמירת השפה: בדיקה ב-Joi ועדכון השדה language של המשתמש',
], 21)

# 11 Menahem aggregation ----------------------------------------------------
s = new('מנחם — Aggregation Pipeline', 'החישוב מתבצע בתוך MongoDB — רק התוצאה עוברת ברשת')
textbox(s, Cm(1.5), Cm(4.2), W - Cm(3), Cm(13), [
    '**$match** — סינון לפי טווח התאריכים ו-removed: false',
    '**$group** — קיבוץ לפי חודש / סטטוס / לקוח, עם $sum',
    '**$sort, $limit** — מיון ובחירת 5 המובילים',
    '**$lookup** — צירוף שם הלקוח מאוסף Client',
    '**$project** — עיצוב התוצאה',
    'בקוד: השלמת חודשים ריקים ל-0 לסדרה רציפה',
], 22)

# 12 Tests ----------------------------------------------------------------
s = new('בדיקות ו-CI')
textbox(s, Cm(1.5), Cm(3.4), W - Cm(3), Cm(14), [
    '**31 בדיקות שרת **(Jest + supertest) ב-8 חבילות — כולן עוברות',
    ('', 'יחידה: חישובי כסף · אינטגרציה: התחברות, לקוחות, אנליטיקה, שפה, אבטחה'),
    ('', 'שני תרחישי זרימה מלאה — אחד לכל תלמיד'),
    '**3 בדיקות דפדפן **(Playwright) לצד הלקוח — של רם',
    '**8 בדיקות עשן **בסוף כל הפעלה של start-demo.cmd',
    '**GitHub Actions: **Node 20 ו-22, lint, בנייה ובדיקת דפדפן — 4 עבודות ירוקות',
], 21)

# 13 Security ----------------------------------------------------------------
s = new('אבטחת מידע')
textbox(s, Cm(1.5), Cm(3.4), W - Cm(3), Cm(14), [
    'סיסמאות: bcrypt עם salt — אינן נשמרות',
    'גישה: JWT ו-loggedSessions; טוקן חסר או ישן נדחה בקוד 401',
    'קלט: בדיקה ב-Joi, וניסיון הזרקת אופרטורים נדחה בקוד 400',
    'CORS: רק הממשק שלנו מורשה לקרוא ל-API; בפריסה מגדירים CORS_ORIGINS',
    'סודות: מפתח JWT אקראי לכל התקנה, וקובץ ההגדרות מחוץ ל-Git',
    'נשאר לפריסה ציבורית: HTTPS והגבלת קצב כללית',
], 21)

# 14 Problems ---------------------------------------------------------------
s = new('בעיות שפתרנו בדרך')
textbox(s, Cm(1.5), Cm(3.4), W - Cm(3), Cm(14), [
    'השרת קרס על Node 26 (תלות של jsonwebtoken) ← שדרוג ל-9.0.3',
    'בדיקות יחידה דרשו מסד ← פיצול לפרויקטי unit ו-integration',
    'בטלפון כפתור התפריט דחף את המסך ← הוצאה מהזרימה',
    'תוויות החודשים באנגלית בעברית ← מפתח ניטרלי + Intl.DateTimeFormat',
    'נתוני דוגמה השתנו בכל הרצה ← seed דטרמיניסטי',
    'Docker הכביד על המחשב ← MongoDB מקומי כשירות',
], 21)

# 15 Demo -----------------------------------------------------------------
s = new('הדגמה חיה')
textbox(s, Cm(17.5), Cm(3.6), Cm(15), Cm(14), [
    '**רם — על המסך**',
    ('', '1. התחברות (אנגלית)'),
    ('', '2. בחירת עברית ← RTL'),
    ('', '3. התנתקות והתחברות ← עדיין עברית'),
    ('', '4. אנליטיקה, טווח, ייצוא CSV'),
    ('', '5. רוחב טלפון'),
], 20)
textbox(s, Cm(1.2), Cm(3.6), Cm(15.5), Cm(14), [
    '**מנחם — מה קורה בשרת**',
    ('', 'updateLanguage.js: בדיקה ושמירה'),
    ('', 'הצינור ב-analytics.js'),
    ('', 'קריאה ל-API עם טוקן ובלי טוקן (401)'),
    ('', 'npm test — 31 בדיקות'),
], 20)

# 16 Limits ---------------------------------------------------------------
s = new('מגבלות ופיתוחים עתידיים')
textbox(s, Cm(17.5), Cm(3.6), Cm(15), Cm(14), [
    '**מגבלות**',
    ('', 'בדיקות דפדפן רק לזרימה של רם'),
    ('', 'לא בוצעו מדידות עומס'),
    ('', 'יצירת חשבונית אינה אטומית'),
    ('', 'החלפת שפה טוענת את הדף מחדש'),
], 20)
textbox(s, Cm(1.2), Cm(3.6), Cm(15.5), Cm(14), [
    '**בהמשך**',
    ('', 'ריבוי משתמשים ותפקידים'),
    ('', 'השוואת תקופות וחיזוי הכנסות'),
    ('', 'טרנזקציות, HTTPS, פריסה בענן'),
    ('', 'בדיקות דפדפן לכל המסכים'),
], 20)

# 17 Summary ----------------------------------------------------------------
s = new('סיכום')
textbox(s, Cm(1.5), Cm(3.4), W - Cm(3), Cm(14), [
    'נכנסנו למערכת קיימת וגדולה, למדנו אותה, תיקנו והרחבנו',
    'כל אחד פיתח שכבה, ושנינו מציגים את הזרימה המלאה: מסך ← API ← מסד ← מסך',
    'למדנו: MERN, אגרגציות, JWT ואבטחה, בדיקות ו-CI, RTL ורספונסיביות',
    'הקוד מנוהל ב-Git במאגר פרטי של צוות התלמידים, עם בדיקות ו-CI',
    'תודה — נשמח לשאלות',
], 22)

out = sys.argv[1] if len(sys.argv) > 1 else 'deck.pptx'
prs.save(out)
print('written', out, 'slides', len(prs.slides))
