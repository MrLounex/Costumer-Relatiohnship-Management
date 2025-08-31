const fs = require("fs");
const path = require("path");

const dirs = [
  "src/config",
  "src/db",
  "src/middleware",
  "src/controllers",
  "src/services",
  "src/repositories",
  "src/routes",
  "src/utils",
  "src/views/partials",
  "src/views/dashboard",
  "src/public/assets/css",
  "src/public/uploads",
];

const files = {
  "src/config/env.js": "",
  "src/config/logger.js": "",
  "src/config/rateLimit.js": "",
  "src/db/mongo.js": "",
  "src/db/mysql.js": "",
  "src/middleware/errorHandler.js": "",
  "src/middleware/auth.js": "",
  "src/middleware/rbac.js": "",
  "src/controllers/userController.js": "",
  "src/services/userService.js": "",
  "src/repositories/userRepository.js": "",
  "src/routes/userRoutes.js": "",
  "src/utils/helpers.js": "",
  "src/app.js": "",
  "src/index.js": "",
  "src/views/layout.ejs": "",
  "src/views/partials/head.ejs": "",
  "src/views/partials/navbar.ejs": "",
  "src/views/dashboard/index.ejs": "",
  "src/public/assets/css/style.css": "",
  ".env": "",
};

dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log("Created dir:", dir);
  }
});

for (const file in files) {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log("Created dir:", dir);
  }
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, files[file]);
    console.log("Created file:", file);
  }
}

console.log("✅ Struktur CRM selesai dibuat!");
