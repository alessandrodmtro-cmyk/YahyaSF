# YahyaSF

منصة مشاهدة عربية مستقلة لمسلسل واحد (15 حلقة). الواجهة ثابتة وتُنشر على GitHub Pages، أما الفيديوهات فتبقى على جهاز الاستضافة المنزلي.

## الملفات
- `index.html`, `styles.css`, `app.js`: واجهة HTML5 عربية متجاوبة.
- `config.js`: عنوان HTTPS لخادم الفيديو؛ اتركه فارغاً إلى أن تنشئ النفق.
- `assets/`: الشعار والأعمال الرسومية.
- `.github/workflows/pages.yml`: نشر تلقائي إلى GitHub Pages عند كل تحديث على فرع `main`.

## تفعيل GitHub Pages أول مرة
1. افتح Settings ثم Pages.
2. تحت Build and deployment اجعل Source = GitHub Actions.
3. انتظر تشغيل workflow المسمى Deploy YahyaSF to GitHub Pages من تبويب Actions.
4. رابط الموقع المتوقع: https://alessandrodmtro-cmyk.github.io/YahyaSF/

## ربط خادم الفيديو لاحقاً
بعد تشغيل خادم Python على جهاز الاستضافة وإعداد HTTPS Tunnel إلى `http://127.0.0.1:8787`، ضع رابط النفق في `config.js`:

```js
window.YAHYASF_API = "https://YOUR-HTTPS-TUNNEL";
```

اضبط CORS في خادم الفيديو ليسمح فقط بـ `https://alessandrodmtro-cmyk.github.io`.

## تنبيه
- لا ترفع مجلدات الفيديو أو ملفات MP4/MKV إلى GitHub.
- لا ترفع كلمات مرور أو مفاتيح وصول أو رموز النفق إلى المستودع.
- GitHub Pages يستضيف الواجهة فقط؛ تشغيل الفيديو يتطلب بقاء جهازك والنفق متصلين.
- تأكد من امتلاك حقوق عرض كل الحلقات للجمهور.
