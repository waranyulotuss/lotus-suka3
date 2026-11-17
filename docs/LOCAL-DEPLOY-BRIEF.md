# บรีฟสำหรับ Claude Code บนเครื่องเจ้าของ: เอาเว็บ "โลตัส สุขาภิบาล 3" ขึ้น GitHub Pages

## เป้าหมาย
เผยแพร่โปรเจกต์สแตติกนี้ (HTML/CSS/JS ล้วน ไม่มี build ที่ซับซ้อน) ที่ `https://waranyulotuss.github.io/lotus-suka3/` (ไทย) และ `/en/` (อังกฤษ) แล้วตรวจให้ผ่านเกณฑ์ด้านล่าง ทำต่อจากงานที่ทำไว้ในคอนเทนเนอร์คลาวด์ ซึ่งสร้าง repo ไม่ได้

## ข้อเท็จจริงที่ต้องรู้ก่อนเริ่ม
- โฟลเดอร์ที่แตกซิปมามี git history อยู่แล้ว (branch `main`) ยังไม่เคย push ที่ไหน
- เว็บเป็น **หน้าข้อมูลของสาขา ไม่ใช่เว็บทางการของ Lotus** ห้ามใส่โลโก้/รูป/ข้อความ/ราคาที่คัดลอกจาก lotuss.com ห้ามเดาข้อมูลจริง ห้ามใส่รหัสผ่าน/API key/token ใน repo (repo เป็นสาธารณะ)
- ชุดสี CP AXTRA: น้ำเงิน #306FC7, เหลือง #F6C24A, เขียว #43938F (Lotus), แดง #DA3832 (Makro) อย่าเปลี่ยน
- `site_url` ใน `data/config.json` = `https://waranyulotuss.github.io/lotus-suka3` ถ้าเปลี่ยนชื่อ repo/โดเมน ต้องแก้ค่านี้แล้วรัน `node tools/build.mjs` และ `python3 tools/make-qr.py` (ต้อง `pip install segno`)
- แก้ `data/*.json` หรือ `i18n/*.json` แล้วเว็บเปลี่ยนเอง ส่วน title/meta/schema/sitemap ต้องรัน `node tools/build.mjs` (หรือปล่อยให้ GitHub Action `.github/workflows/build.yml` รันให้หลัง push)
- ข้อมูลในไฟล์ที่ **ยังไม่ยืนยัน** (อย่าเอาไปประกาศเป็นข้อมูลทางการ):
  - ที่อยู่ เบอร์ 02-916-5500 เวลา 08:00–22:00: รวบรวมจากข้อมูลสาธารณะ (Wongnai, Sale Here, Yellow Pages) ณ 2026-11-17 มีแหล่งที่ขัดกัน (เลขที่ 101 vs 202, เวลา 09:00–21:00, เบอร์ 02-916-5700) → `hours.is_sample=true` เว็บจึงแสดงป้ายเตือนและยังไม่ส่งเวลาให้ schema
  - ชื่อภาษาอังกฤษ "Lotus's Sukhaphiban 3" และที่อยู่อังกฤษ ผมสะกดเอง ต้องเทียบ Google Maps
  - พิกัด 13.8067835, 100.7250887 และลิงก์ `https://maps.app.goo.gl/BcQLVT1cRvaJ2qwW9` มาจาก Google Maps ของเจ้าของ (เชื่อถือได้)
  - ลิงก์ App Store `https://apps.apple.com/th/app/lotuss/id1540944956` ปรับจาก storefront อื่น ยังไม่ได้ทดสอบเปิด; ยังไม่มีลิงก์ Google Play
  - ยังเป็น `[ ]` ตัวอย่าง: LINE, Facebook, จุดสังเกต, ที่จอดรถ, วิธีเดินทาง, โปรโมชัน, ร้านค้าในศูนย์, จุดเด่น, รูปสาขา

## ขั้นตอน (ทำตามลำดับ)
1. **เตรียม**: แตกซิป `lotus-suka3.zip` → `cd lotus-suka3` → `git status` ต้องสะอาด; `git log --oneline` ต้องเห็น commit ล่าสุด "Fill address and phone…"; ตรวจเครื่องมือ: `node -v` (≥18), `gh --version`
2. **ล็อกอิน GitHub**: `gh auth login` ด้วยบัญชี `waranyulotuss` (ถ้าไม่ได้เป็นบัญชีนี้ ให้หยุดและถามเจ้าของ)
3. **สร้าง repo สาธารณะแล้ว push**:
   ```bash
   gh repo create waranyulotuss/lotus-suka3 --public --source=. --remote=origin --push
   ```
   ถ้ามี repo ชื่อนี้อยู่แล้ว **ห้ามเขียนทับ** ให้ดูก่อนว่ามีอะไร แล้วถามเจ้าของ
4. **เปิด Pages** จาก branch `main` โฟลเดอร์ root:
   ```bash
   gh api -X POST repos/waranyulotuss/lotus-suka3/pages -f "source[branch]=main" -f "source[path]=/"
   ```
   (ถ้าตอบว่ามีอยู่แล้วให้ใช้ `-X PUT`) แล้วรอ build: `gh api repos/waranyulotuss/lotus-suka3/pages/builds/latest -q .status` จนเป็น `built`
5. **ตรวจ Action**: ใน Settings → Actions ต้องอนุญาต workflow เขียนได้ (`contents: write` ตั้งใน workflow แล้ว) ถ้า Action `rebuild-pages` ล้มเพราะสิทธิ์ ให้ตั้ง Settings → Actions → General → Workflow permissions = Read and write
6. **ตรวจเว็บจริง** (ทั้งสองภาษา) ด้วย `curl -sI` และเปิดใน Playwright/เบราว์เซอร์:
   - `/`, `/en/`, `/privacy.html`, `/en/privacy.html`, `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, `/assets/img/og.png` ตอบ 200; URL ที่ไม่มีจริงตอบหน้า 404.html
   - `canonical` / `hreflang` (th, en, x-default) ชี้ URL จริงและตอบ 200 ทั้งหมด
   - ไม่มี error ใน console; ปุ่มโทร (`tel:+6629165500`), นำทาง, สลับ TH/EN, แชร์, ปุ่มหมวดสินค้า ใช้ได้
   - สถานะเปิด/ปิดตรงเวลาไทย (ทดสอบเวลาจำลองด้วย Playwright ได้)
   - Lighthouse มือถือ ทั้ง 4 หมวด ≥ 90 (เคยวัดได้ 99/100/100/100 บนเซิร์ฟเวอร์ภายในเครื่อง)
   - Rich Results Test: https://search.google.com/test/rich-results ใส่ URL หน้าแรก ควรเจอ `GroceryStore` ไม่มี error (เจ้าของเปิดเองในเบราว์เซอร์ได้)
   - ตรวจว่าไม่มีรูป/โลโก้จากเว็บแม่ และท้ายเว็บมีข้อความ "ไม่ใช่เว็บไซต์ทางการ"
7. **GoatCounter** (`analytics.goatcounter_code = lotus-suka3` ตั้งไว้แล้ว): เปิดเว็บจริง กดปุ่มโทรหนึ่งครั้ง แล้วดู `https://lotus-suka3.goatcounter.com` ว่ามี pageview และ event `call-th` (ถ้าไม่เห็น ตรวจ Site domain ใน GoatCounter Settings ให้เป็น `waranyulotuss.github.io`)
8. **QR**: `python3 tools/make-qr.py` ผลอยู่ใน `qr/` (PNG+SVG) ชี้ `…/lotus-suka3/?utm_source=qr&utm_medium=store` commit ถ้ามีการเปลี่ยน
9. **ส่งรายงานให้เจ้าของ** เป็นภาษาไทย: ลิงก์เว็บ ไทย/อังกฤษ, ลิงก์ repo, ผลตรวจทุกข้อด้านบน (ผ่าน/ไม่ผ่านตามจริง พร้อมหลักฐาน), รายการข้อมูลที่ยังเป็นตัวอย่าง/รอยืนยัน

## สิ่งที่เจ้าของต้องทำเอง (อย่าทำแทน ให้แจ้งเท่านั้น)
- ยืนยัน Google Search Console: เพิ่ม URL prefix → วิธี HTML tag → ใส่ค่า `content` ใน `analytics.google_site_verification` → `node tools/build.mjs` → commit/push → กด Verify → ส่ง `sitemap.xml`
- ใส่ลิงก์เว็บใน Google Business Profile (ต่อท้าย `?utm_source=gbp&utm_medium=profile`) และกรอกชื่อ ที่อยู่ เบอร์ เวลาให้ตรงกับเว็บทุกตัวอักษร
- ยืนยันที่อยู่/เบอร์/เวลา แล้วตั้ง `hours.is_sample=false`
- ขอลิงก์ App Store / Google Play ทางการจากส่วนกลาง; ขอ/ยืนยันสิทธิ์ใช้โลโก้ Lotus (ตอนนี้ใช้ข้อความล้วน); ส่งรูปหน้าสาขาที่ถ่ายเองหรือมีสิทธิ์ใช้ (WebP/JPEG ≤ 200 KB)
- ติด QR ในสาขา

## ห้าม
- ห้าม force-push, ห้ามลบ/เขียนทับ repo ที่มีอยู่ก่อน, ห้ามแก้ข้อมูลธุรกิจ (ที่อยู่ เบอร์ เวลา) ให้ดูเหมือนยืนยันแล้วโดยไม่มีหลักฐานจากเจ้าของ
- ห้ามคัดลอกเนื้อหา/รูป/ราคาจาก lotuss.com; ห้ามรับประกันอันดับหรือ traffic
- ห้ามใส่ token หรือรหัสผ่านใดใน repo; ถ้า `gh` ขอสิทธิ์เพิ่ม ให้ถามเจ้าของ
- หากพบสิ่งที่ขัดกับบรีฟนี้ ให้หยุดและถามเจ้าของ แทนการเดา

## เอกสารอ้างอิงใน repo
`README.md` (วิธีแก้ข้อมูลสำหรับเจ้าของ), `docs/seo-plan.md` (โครงสร้างเว็บ/แผน SEO/ลำดับงาน)
