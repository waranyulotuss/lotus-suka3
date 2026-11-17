"""สร้าง QR Code (PNG+SVG) ชี้ไปที่เว็บ — ใช้: python3 tools/make-qr.py
ต้องติดตั้ง: pip install segno   (ค่า site_url อ่านจาก data/config.json)"""
import json, pathlib, segno
root = pathlib.Path(__file__).resolve().parent.parent
site = json.load(open(root/'data/config.json', encoding='utf-8'))['site_url'].rstrip('/')
url = f"{site}/?utm_source=qr&utm_medium=store"
q = segno.make(url, error='m')
out = root/'qr'; out.mkdir(exist_ok=True)
q.save(out/'qr-lotus-suka3.png', scale=12, border=4, dark='#306FC7', light='#FFFFFF')
q.save(out/'qr-lotus-suka3.svg', scale=12, border=4, dark='#306FC7', light='#FFFFFF')
print('QR ->', url)
