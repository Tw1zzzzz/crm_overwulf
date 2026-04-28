# CRMAtlant

CRMAtlant - веб-приложение на React/Vite с Node.js/Express backend и MongoDB. В проекте есть обычный web-режим и сборка под Overwolf.

## Что нужно установить на Windows

1. Установите [Git for Windows](https://git-scm.com/download/win).
2. Установите [Node.js LTS](https://nodejs.org/) версии 20 или новее.
3. Установите MongoDB одним из способов:
   - проще всего через [Docker Desktop](https://www.docker.com/products/docker-desktop/);
   - либо через [MongoDB Community Server](https://www.mongodb.com/try/download/community).
4. Откройте PowerShell в папке, где хотите хранить проект.

Проверка после установки:

```powershell
git --version
node -v
npm -v
```

## Запуск на Windows через PowerShell

1. Склонируйте репозиторий:

```powershell
git clone https://github.com/Tw1zzzzz/crm_overwulf.git
cd crm_overwulf
```

2. Запустите автоматическую установку:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1
```

Если на новой машине еще нет Node.js или MongoDB, можно попросить скрипт поставить их через `winget`:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1 -InstallMissing
```

Чтобы после установки сразу запустить проект:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1 -InstallMissing -Start
```

После успешной установки откройте:

```text
http://localhost:8080
```

## Ручной запуск на Windows

1. Установите зависимости frontend:

```powershell
npm install
```

2. Установите зависимости backend:

```powershell
npm run server:install
```

3. Создайте локальный `.env` из примера:

```powershell
copy .env-example .env
```

4. Откройте `.env` в любом редакторе и задайте минимум эти значения:

```env
PORT=5001
NODE_ENV=development
JWT_SECRET=replace_with_long_random_secret
MONGODB_URI=mongodb://localhost:27017/esports-mood-tracker
STAFF_PRIVILEGE_KEY=replace_with_staff_key
CLIENT_URL=http://localhost:8080
```

FACEIT, почта и Robokassa нужны только для соответствующих интеграций. Для первого локального запуска их можно оставить плейсхолдерами.

5. Запустите MongoDB.

Вариант через Docker:

```powershell
docker run --name crmatlant-mongo -d -p 27017:27017 -v crmatlant-mongo:/data/db mongo:6
```

Если контейнер уже создан и был остановлен:

```powershell
docker start crmatlant-mongo
```

Если MongoDB установлена как Windows-служба, запустите службу `MongoDB Server` через `services.msc` или командой:

```powershell
net start MongoDB
```

6. Запустите приложение:

```powershell
npm run dev
```

7. Откройте приложение в браузере:

```text
http://localhost:8080
```

Backend API будет доступен на:

```text
http://localhost:5001/api
```

Проверка backend:

```text
http://localhost:5001/health
```

## Полезные команды

```powershell
npm run build
npm run preview
npm run test
npm run build:overwolf
```

`npm run build:overwolf` собирает Overwolf-версию в папку `dist-overwolf`.

## Частые проблемы

Если порт `8080` занят, остановите другой frontend-процесс или поменяйте порт в `vite.config.ts`.

Если порт `5001` занят, поменяйте `PORT` в `.env` на свободный порт и перезапустите `npm run dev`.

Если backend пишет, что не может подключиться к MongoDB, проверьте, что MongoDB запущена и `MONGODB_URI` в `.env` совпадает с вашим способом запуска.

Если PowerShell блокирует команды, запустите его от имени администратора или используйте Git Bash.
