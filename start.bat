@echo off
echo ==========================================
echo Starting Predictive Urban Growth Modeling
echo ==========================================

echo [1/4] Installing Backend Dependencies...
cd server
call npm install

echo [2/4] Installing Frontend Dependencies...
cd ../client
call npm install

echo [3/4] Starting Backend Server on port 5000...
start cmd /k "cd ../server && npm run dev"

echo [4/4] Starting Frontend App...
start cmd /k "npm run dev"

echo All done! A browser should open automatically or you can visit http://localhost:5173
