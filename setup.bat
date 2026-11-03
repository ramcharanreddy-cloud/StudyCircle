@echo off
setlocal
if not exist "server\.env" (
  copy "server\.env.example" "server\.env" >nul
  echo Created server\.env. Edit it and set your MongoDB URI and JWT secret.
) else (
  echo server\.env already exists; leaving it unchanged.
)
if not exist "client\.env" (
  copy "client\.env.example" "client\.env" >nul
  echo Created client\.env.
)
echo.
echo Next steps:
echo   1. Make sure MongoDB is running or configure MongoDB Atlas in server\.env.
echo   2. Open a terminal in server and run: npm install ^&^& npm run dev
echo   3. Open another terminal in client and run: npm install ^&^& npm run dev
endlocal
