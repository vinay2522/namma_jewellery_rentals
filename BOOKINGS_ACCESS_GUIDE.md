# 📊 How to Access Your Booking Data

Your bookings are now **permanently saved** and won't be lost when you restart the server!

---

## ✅ 3 Ways to View Your Bookings

### 1️⃣ **JSON File (Recommended for You)**
   
**Location:** `data/bookings.json`

This file contains all your bookings in a simple text format. You can:
- Open it with **Notepad** or any text editor
- View all booking details
- Copy and paste to share with others
- Never gets deleted (permanent storage)

**How to open:**
1. Go to your project folder: `C:\Users\swath\OneDrive\Desktop\Namma-Jewllery-Rentals`
2. Open the `data` folder
3. Double-click `bookings.json`
4. Opens in Notepad - you can read all bookings!

---

### 2️⃣ **Excel/Google Sheets (CSV Export)**

Download all bookings as a CSV file that opens in Excel:

**Online Method:**
- Go to: `http://localhost:5000/api/bookings/export/csv`
- File downloads automatically
- Open in Excel or Google Sheets
- Sort, filter, and analyze your data

**Or use the Download Button:**
- Visit: `http://localhost:5000/admin/bookings`
- Click "Download CSV" button
- Opens in Excel with all booking details

---

### 3️⃣ **Email Notifications**

Get instant email alerts for every new booking (if configured):
- Beautiful HTML email with all details
- Customer contact info
- List of items they want to rent
- Direct link to booking

See `EMAIL_SETUP_GUIDE.md` for email setup instructions.

---

## 📁 File Structure

```
Namma-Jewllery-Rentals/
├── data/
│   └── bookings.json    ← ALL YOUR BOOKINGS ARE HERE (PERMANENT)
├── .env                 ← Email settings (optional)
└── ...
```

---

## 🔍 What's in bookings.json?

Each booking contains:
- **Customer Details**: Name, phone, email
- **Event Info**: Date, rental duration
- **Items**: Complete list of jewelry pieces
- **Status**: Pending, confirmed, completed, cancelled
- **Timestamp**: When the booking was submitted
- **Message**: Any special requests from customer

Example:
```json
[
  {
    "id": "abc-123",
    "fullName": "Priya Sharma",
    "phoneNumber": "+91 98765 43210",
    "email": "priya@example.com",
    "eventDate": "2026-03-15",
    "rentalDuration": "3 days",
    "items": [
      {
        "name": "Royal Annapakshi Temple Set",
        "category": "Temple Jewellery",
        "price": "₹4,500/day"
      }
    ],
    "status": "pending",
    "createdAt": "2026-02-23T12:30:00.000Z"
  }
]
```

---

## 📊 Viewing Options Summary

| Method | Best For | File Location |
|--------|----------|---------------|
| **bookings.json** | Quick view, backup | `data/bookings.json` |
| **CSV Download** | Excel analysis | Downloads folder |
| **Email** | Instant notifications | Your inbox |
| **Admin Page** | Managing status | http://localhost:5000/admin/bookings |

---

## ⚡ Quick Access Links

- **Download CSV**: http://localhost:5000/api/bookings/export/csv
- **Admin Dashboard**: http://localhost:5000/admin/bookings
- **JSON File**: `data/bookings.json` (in project folder)

---

## 💾 Backup Your Data

**Important:** Keep a backup of `data/bookings.json`

1. Copy `data/bookings.json` 
2. Paste it to OneDrive, Google Drive, or USB drive
3. Your bookings are safe even if computer crashes!

---

## 🔄 Data Persistence

✅ **Bookings are saved automatically** after each submission  
✅ **Data persists** even after server restart  
✅ **File-based storage** - no database needed  
✅ **Easy to backup** - just copy the JSON file  

---

## 📱 Recommended Workflow

1. **Customer submits booking** → Automatically saved to `bookings.json`
2. **You receive email** (if configured) → Check your inbox
3. **Open bookings.json** → View all details in Notepad
4. **OR Download CSV** → Open in Excel for better view
5. **Contact customer** → Use phone/email from booking
6. **Update status** → Use admin page or manually edit JSON

---

## ❓ Common Questions

**Q: Will I lose bookings if I restart the server?**  
A: No! All bookings are saved to `data/bookings.json` permanently.

**Q: Can I edit bookings manually?**  
A: Yes! Open `bookings.json` in Notepad, edit, and save. Server will load changes.

**Q: Can I delete old bookings?**  
A: Yes! Edit `bookings.json` and remove old entries, or download CSV to keep a record first.

**Q: I can't find the data folder?**  
A: It's created automatically when first booking is submitted. Look in your project root folder.

**Q: Can I share bookings with someone?**  
A: Yes! Email them the `bookings.json` file or the downloaded CSV.

---

## 🎯 Your Easiest Option

Since you mentioned the admin page is not suitable:

**Just open:** `data/bookings.json` with Notepad  
**Location:** `C:\Users\swath\OneDrive\Desktop\Namma-Jewllery-Rentals\data\bookings.json`

This file has everything you need, updates automatically, and never gets deleted!
