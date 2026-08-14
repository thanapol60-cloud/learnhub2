# Vercel Environment Variables Setup

## ตัวแปรสภาพแวดล้อมที่ต้องตั้งค่า

> ⚠️ **ห้ามเขียนค่าจริงลงในไฟล์นี้** เอกสารนี้อยู่ในที่เก็บโค้ดสาธารณะ
> ให้คัดลอกค่าจริงจากผู้ให้บริการแต่ละราย แล้ววางลงใน Vercel Dashboard โดยตรง

---

## **วิธีที่ 1: ใช้ Vercel Web Dashboard (ง่ายที่สุด)**

### **Step 1: ไปที่ Vercel Environment Variables**
1. เข้า Vercel Dashboard
2. Select project: **learnhub2**
3. ไปที่ **Settings** (sidebar ซ้าย)
4. Click **Environment Variables**

### **Step 2: เพิ่มตัวแปรทีละตัว**

#### **ตัวแปรที่ 1: DATABASE_URL**
```
Name: DATABASE_URL
Value: <คัดลอกสตริงเชื่อมต่อจาก TiDB Cloud Console → Connect>
รูปแบบ: mysql://<user>:<password>@<host>:4000/learnhub?sslMode=REQUIRE
```
✅ Check: Production, Preview, Development

#### **ตัวแปรที่ 2: ANTHROPIC_API_KEY**
```
Name: ANTHROPIC_API_KEY
Value: <คีย์จาก https://console.anthropic.com/settings/keys>
```
✅ Check: Production, Preview, Development

#### **ตัวแปรที่ 3: NEXT_PUBLIC_API_URL**
```
Name: NEXT_PUBLIC_API_URL
Value: https://learnhub2.vercel.app
```
✅ Check: Production, Preview, Development

### **Step 3: Save & Redeploy**
1. Click "Save" หรือ "Add" หลังจากแต่ละตัวแปร
2. ไปที่ **Deployments**
3. Click deployment ล่าสุด → **Redeploy**

---

## **วิธีที่ 2: ใช้ Vercel CLI (ถ้ามี CLI ติดตั้ง)**

```bash
cd c:\Users\User\Desktop\learnhub2

# Pull environment file
vercel env pull

# This will add variables to .env.local

# Deploy again
vercel --prod
```

---

## **Environment Variables Summary**

| Variable | Value | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | `mysql://...` | Connect to TiDB Cloud database |
| `ANTHROPIC_API_KEY` | `sk-ant-placeholder` | AI video analysis (placeholder for now) |
| `NEXT_PUBLIC_API_URL` | `https://learnhub2-qsa4.vercel.app` | Frontend API endpoint |

---

## **Status Check**

✅ `DATABASE_URL` - ใช้ได้เลย (จาก TiDB)
⏳ `ANTHROPIC_API_KEY` - ยังใช้ placeholder (สามารถ update ทีหลัง)
✅ `NEXT_PUBLIC_API_URL` - ใช้ได้เลย (จาก Vercel)

---

## **Next Steps**

1. เพิ่มตัวแปร 3 ตัว ใน Vercel
2. Redeploy project
3. รอ 2-5 นาที
4. ทดสอบ: https://learnhub2-qsa4.vercel.app

---

## **เมื่อไหร่ที่จะอัพเดท API Key**

ถ้าต้องการเปิด AI video analysis:
1. ไป https://console.anthropic.com/api-keys
2. สร้าง API key ใหม่
3. มาที่ Vercel Environment Variables
4. Update `ANTHROPIC_API_KEY` ด้วย key ที่แท้จริง
5. Redeploy อีกครั้ง
