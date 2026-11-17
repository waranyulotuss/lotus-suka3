# เว็บข้อมูลสาขา โลตัส สุขา 3 (ไทย/อังกฤษ)

เว็บนี้เป็น **หน้าข้อมูลของสาขา ไม่ใช่เว็บไซต์ทางการของ Lotus** ข้อความนี้แสดงอยู่ท้ายเว็บทุกหน้า

## วิธีแก้ข้อมูล (ไม่ต้องแตะ HTML)
เปิดไฟล์บน GitHub → กดปุ่มรูปดินสอ ✏️ → แก้ → กด **Commit changes** รอประมาณ 1 นาที เว็บจะเปลี่ยนเอง
**อย่าลบเครื่องหมาย `"` `,` `{` `}`** แก้เฉพาะข้อความระหว่างเครื่องหมายคำพูด

| อยากแก้ | ไฟล์ |
|---|---|
| โปรโมชัน | `data/promotions.json` |
| บริการ / ร้านค้าในศูนย์ | `data/services.json` |
| ชื่อ ที่อยู่ เบอร์ เวลาเปิด-ปิด วันหยุด ลิงก์ | `data/config.json` |
| ข้อความหัวข้อทั้งหมด (ไทย/อังกฤษ) | `i18n/th.json`, `i18n/en.json` |

### โปรโมชัน
แต่ละโปรโมชันคือก้อน `{ ... }` ที่มี `title` (ชื่อ) `desc` (รายละเอียด) `start` `end` เป็นวันที่แบบ `2026-11-30` ต้องใส่ทั้งภาษาไทย (`th`) และอังกฤษ (`en`)
- เมื่อพ้นวัน `end` การ์ดจะหายเอง ไม่ต้องลบ
- `"level": "hot"` = ป้ายแดง "ด่วน", `"normal"` = ปกติ
- แสดงสูงสุด 6 ใบ ใส่เฉพาะโปรโมชันจริง **ห้ามเดาราคา**
- คัดลอกก้อนเดิมแล้วแก้ จะเพิ่มโปรโมชันได้ (อย่าลืมเครื่องหมาย `,` คั่นระหว่างก้อน)

### เวลาเปิด-ปิด
ใน `config.json` ส่วน `hours.weekly` แก้ `"open"` / `"close"` เป็นเวลา 24 ชม. เช่น `"08:00"` `"22:00"`
- ปิดข้ามเที่ยงคืนเขียนได้เลย เช่น เปิด `"08:00"` ปิด `"02:00"`
- วันหยุดพิเศษ ใส่ใน `hours.closures`: `"closed": true` = ปิดทั้งวัน หรือ `"closed": false` พร้อม `open`/`close` = เวลาพิเศษ
- สถานะ "เปิดอยู่/ปิดแล้ว" คำนวณจากเวลาไทยเสมอ
- เมื่อใส่เวลาจริงแล้ว ให้เปลี่ยน `"is_sample": true` เป็น `false` (ป้ายเตือนจะหายและเวลาจะเข้า schema ของ Google)
- ต้องตรงกับ Google Business Profile ทุกตัวอักษร (ชื่อ ที่อยู่ เบอร์โทร)

### เบอร์โทร / LINE / Facebook / แผนที่
- `phone.display` = ที่แสดง เช่น `"02-xxx-xxxx"`, `phone.e164` = รูปแบบสากล เช่น `"+662xxxxxxx"` (ตัด 0 ตัวแรก ใส่ +66)
- `social.line` = ลิงก์ LINE OA, `social.facebook` = ลิงก์เพจ
- `geo.lat` / `geo.lng` = พิกัดจาก Google Maps, `maps.link` = ลิงก์ Google Maps, `maps.review_link` = ลิงก์ขอรีวิว
- `site_url` = ที่อยู่เว็บจริง เช่น `https://ชื่อผู้ใช้.github.io/ชื่อ-repo`
- ข้อความที่ยังเป็น `[ ... ]` คือตัวอย่างรอข้อมูลจริง

### รูปภาพ
- ใช้เฉพาะรูปที่สาขาถ่ายเองหรือมีสิทธิ์ใช้ ห้ามเอารูปจากเว็บ lotuss.com หรือเว็บอื่น
- แปลงเป็น WebP/JPEG ขนาดไม่เกิน 200 KB อัปโหลดไว้ใน `assets/img/`
- แสดงรูปหน้าสาขาที่ส่วนบน: ใน `config.json` แก้ `"hero": null` เป็น
  `"hero": { "src": "assets/img/store.jpg", "alt": { "th": "หน้าสาขา…", "en": "Branch front…" } }`
- รูปแชร์ LINE/Facebook คือ `assets/img/og.png` (1200×630)

## วัด traffic (ใช้อีเมล Outlook ได้)
**1) ตัวนับผู้เข้าชม (GoatCounter ฟรี ไม่ใช้คุกกี้)**
1. สมัครที่ goatcounter.com ด้วยอีเมล Outlook ตั้งชื่อ เช่น `lotus-suka3`
2. ใน `data/config.json` ส่วน `analytics` ใส่ `"goatcounter_code": "lotus-suka3"` แล้ว Commit
3. ดูผลที่ `https://lotus-suka3.goatcounter.com` จะเห็นจำนวนผู้เข้าชม แหล่งที่มา (รวม `utm_source=qr`) และจำนวนครั้งที่กดปุ่ม: `event/call-th`, `event/navigate-th`, `event/line-th`, `event/order-web-th` (ฝั่งอังกฤษลงท้าย `-en`)

**2) ดูว่าคนค้นหาอะไรแล้วเจอเว็บ (Google Search Console)**
1. สร้าง Google Account โดยเลือก "ใช้อีเมลปัจจุบันของฉัน" ใส่ Outlook (ไม่ต้องมี Gmail)
2. search.google.com/search-console → Add property → URL prefix → เลือกวิธี **HTML tag** → คัดลอกค่า `content="..."`
3. ใส่ใน `analytics.google_site_verification` ใน `config.json` → Commit → รอ 1-2 นาที → กด Verify → ส่ง `sitemap.xml`
4. (เสริม) Bing Webmaster Tools ล็อกอินด้วย Microsoft account แล้วนำเข้าจาก Search Console ได้

**3) แยกช่องทาง** ใช้ลิงก์ที่มี UTM: QR ในสาขา `?utm_source=qr&utm_medium=store`, โพสต์ Facebook `?utm_source=facebook&utm_medium=social`, LINE `?utm_source=line&utm_medium=social`

## การเปิดใช้บน GitHub Pages
1. สร้าง repo (public) แล้วอัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ไปที่ branch `main`
2. Settings → Pages → Source: **Deploy from a branch** → `main` / `(root)` → Save
3. แก้ `site_url` ใน `data/config.json` ให้เป็นลิงก์จริง แล้วรัน `node tools/build.mjs` (หรือปล่อยให้ GitHub Action ในโฟลเดอร์ `.github/workflows` รันให้เองหลังแก้ `config.json`/`i18n`)
4. ถ้ามีโดเมนของตัวเอง ใส่ไฟล์ `CNAME` (ชื่อโดเมนบรรทัดเดียว) และติ๊ก Enforce HTTPS ใน Pages
5. รัน `python3 tools/make-qr.py` เพื่อสร้าง QR ใหม่ให้ตรงลิงก์จริง (ไฟล์อยู่ใน `qr/`)

> ข้อควรระวัง: repo เป็นสาธารณะ ห้ามใส่รหัสผ่าน API key หรือข้อมูลส่วนตัวของลูกค้า

## สิ่งที่เจ้าของต้องทำเอง
- ใส่ลิงก์เว็บนี้ใน Google Business Profile และกรอกเวลาให้ตรงกับเว็บ
- ยืนยันความเป็นเจ้าของใน Google Search Console แล้วส่ง `sitemap.xml`
- ติด QR ในสาขา และใส่ลิงก์เว็บในโพสต์ Facebook/LINE
- ยืนยันกับส่วนกลางก่อนใช้โลโก้ Lotus (ตอนนี้ใช้ข้อความล้วน)
- ตรวจตัวสะกดชื่อภาษาอังกฤษ ("Lotus Suka 3") ให้ตรงกับที่ใช้ใน Google Maps

## โครงไฟล์
`index.html` (ไทย) · `en/index.html` (อังกฤษ) · `assets/` · `data/` · `i18n/` · `sitemap.xml` · `robots.txt` · `404.html` · `tools/` (สคริปต์สร้างหน้าและ QR)
