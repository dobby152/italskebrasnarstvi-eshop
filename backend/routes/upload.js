const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Vytvoření složky pro nahrané soubory, pokud neexistuje
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurace multer pro nahrávání souborů
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generování unikátního názvu souboru
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Filtrace souborů - pouze obrázky
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Nepodporovaný typ souboru. Povolené jsou pouze JPEG, PNG a WebP obrázky.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // maximálně 10 souborů najednou
  }
});

// POST /api/upload - nahrání souborů
router.post('/', upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nebyly nahrány žádné soubory'
      });
    }

    // Vytvoření URL pro nahrané soubory
    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      url: `/uploads/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype
    }));

    res.json({
      success: true,
      message: `Úspěšně nahráno ${uploadedFiles.length} souborů`,
      files: uploadedFiles
    });

  } catch (error) {
    console.error('Chyba při nahrávání souborů:', error);
    res.status(500).json({
      success: false,
      message: 'Chyba serveru při nahrávání souborů',
      error: error.message
    });
  }
});

// Middleware pro zpracování chyb multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Soubor je příliš velký. Maximální velikost je 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Příliš mnoho souborů. Maximálně lze nahrát 10 souborů najednou.'
      });
    }
  }
  
  res.status(400).json({
    success: false,
    message: error.message || 'Chyba při nahrávání souborů'
  });
});

module.exports = router;