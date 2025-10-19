# Warehouse Management System - Portable Package Instructions

## Current Status ✅

Your application has been built for production and is ready to use!

## Quick Start (On This Computer)

Simply double-click **`Warehouse-App.vbs`** or **`Start-Warehouse.bat`**

- The application will start automatically
- Your default browser will open with the warehouse system
- Keep the command window open while using the app
- Close the window when you're done to stop the server

## Making It Truly Portable (For Other Computers)

To run this on another computer **without installing Node.js**, follow these steps:

### Option 1: Using Node.js Portable (Recommended - Simplest)

1. **Download Portable Node.js**
   - Visit: https://nodejs.org/en/download/prebuilt-binaries
   - Download the Windows x64 ZIP file (e.g., `node-v20.x.x-win-x64.zip`)
   - Extract it to a folder called `node-portable`

2. **Create Portable Package Folder Structure**
   ```
   WarehouseApp-Portable/
   ├── node-portable/          (extracted Node.js)
   │   ├── node.exe
   │   └── ...
   ├── app/                    (copy entire G:\sales folder here)
   │   ├── .next/
   │   ├── node_modules/
   │   ├── src/
   │   ├── package.json
   │   ├── Start-Warehouse.bat
   │   └── Warehouse-App.vbs
   └── Start.bat               (new launcher - see below)
   ```

3. **Create `Start.bat` in the root folder**
   ```batch
   @echo off
   title Warehouse Management System

   :: Set portable Node.js path
   set PATH=%~dp0node-portable;%PATH%

   :: Navigate to app folder
   cd /d "%~dp0app"

   :: Run the application
   call Start-Warehouse.bat
   ```

4. **How to Use**
   - Copy the entire `WarehouseApp-Portable` folder to USB or another computer
   - Double-click `Start.bat`
   - Done! No installation needed!

### Option 2: Using pkg (Creates Single EXE)

This option creates a standalone .exe file but requires additional setup:

1. **Install pkg globally**
   ```bash
   npm install -g pkg
   ```

2. **Update package.json** with:
   ```json
   "bin": "server.js",
   "pkg": {
     "assets": [
       ".next/**/*",
       "public/**/*",
       "node_modules/better-sqlite3/**/*"
     ],
     "targets": [ "node18-win-x64" ]
   }
   ```

3. **Build the executable**
   ```bash
   pkg . --output warehouse-app.exe
   ```

   Note: This creates a ~50-80MB executable

## Database Location

The database is stored at: **`D:\MyWarehouseData\warehouse.db`**

- This location is configured in `src/config/database.ts`
- To change it, edit the `basePath` in that file
- For true portability, change it to a relative path:
  ```javascript
  basePath: path.join(process.cwd(), 'data')
  ```

## File Size Estimates

- **Current setup**: ~500MB (with node_modules)
- **With portable Node.js**: ~550MB
- **With pkg (single .exe)**: ~80MB

## Troubleshooting

### "Port 3000 already in use"
- Close any existing instances
- Or the batch file will automatically kill it

### "Cannot find module"
- Make sure `node_modules` folder is included
- Run `npm install` in the app folder

### Database errors
- Check that `D:\MyWarehouseData` exists
- Or update the database path in `src/config/database.ts`

### Browser doesn't open
- Manually open: http://localhost:3000

## For Non-Technical Users

**Simplest Instructions:**

1. Make sure this folder has internet connection (first time only)
2. Double-click `Warehouse-App.vbs`
3. Wait for browser to open
4. Start working!
5. When done, close the command window

---

## Current Configuration

- **Production build**: ✅ Complete
- **Launcher scripts**: ✅ Created
- **Database path**: `D:\MyWarehouseData`
- **Port**: 3000
- **Browser**: Automatically opens

## Next Steps

Choose one:

1. **Use as-is** on this computer (requires Node.js installed)
2. **Create portable version** following Option 1 above
3. **Create single .exe** following Option 2 above

---

*Generated: 2025-10-08*
