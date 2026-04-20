# Moctale Migrator 🎬

A standalone, professional-grade bridge tool to migrate your **Letterboxd** watch history and ratings to **Moctale.in**.

## ⚡ Instant Access (No Install Required)
The easiest way to use this tool is to simply open the standalone file in your browser:
1. Download this repository.
2. Double-click the **`migrator.html`** file in the root folder.
3. It works instantly—no terminal, no Node.js, and no `npm install` required.

---

## 🛠 Advanced / Developer Setup
If you want to run the full development environment:

### 1. Prerequisites
Ensure you have **Node.js** (v18+) installed.

### 2. Installation & Run
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

---

## 🛠 How to Use

### Step 1: Export from Letterboxd
1. Log in to [Letterboxd](https://letterboxd.com).
2. Go to **Settings** > **Import & Export**.
3. Click **Export Your Data**.
4. You will receive a ZIP file via email. Extract it and find `watched.csv` (history only) or `ratings.csv` (includes stars).

### Step 2: Parse & Configure
1. Open the **Moctale Migrator** (running on localhost:3000).
2. Drag and drop your `.csv` file into the "Step 1" zone.
3. Review the parsed films in the middle "Preview" column.
4. On the right, toggle **Sync Watched** or **Scale Ratings**.
5. Adjust the **Delay** (1200ms recommended to avoid rate limits).
6. Click **Generate Migration Payload**.

### Step 3: Inject into Moctale
1. Copy the generated code payload from the migrator.
2. Open [moctale.in](https://moctale.in) in a new tab and **log in**.
3. Press `F12` (or `Cmd+Opt+I` on Mac) to open Developer Tools.
4. Click the **Console** tab.
5. Paste the code and press **Enter**.
6. **Keep the tab focused** until the log says `Migration Complete!`.

---

## 🔒 Security & Privacy
- **No Private Keys**: This tool does not ask for your Moctale password.
- **Local Parsing**: Your CSV file is parsed directly in your browser. No data is sent to our servers.
- **Session-Based**: The script uses your existing browser session—it never sees your credentials.

---

## ⚖️ Disclaimer
This is an unofficial community tool. It is not affiliated with Letterboxd or Moctale. Use at your own risk. Automated scripts can lead to rate-limiting; always use a conservative delay (1s+).
