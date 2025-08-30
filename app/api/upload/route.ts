import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Nebyly nahrány žádné soubory' },
        { status: 400 }
      );
    }

    // Kontrola počtu souborů
    if (files.length > 10) {
      return NextResponse.json(
        { success: false, message: 'Maximálně lze nahrát 10 souborů najednou' },
        { status: 400 }
      );
    }

    // Vytvoření uploads složky, pokud neexistuje
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const uploadedFiles = [];

    for (const file of files) {
      // Kontrola typu souboru
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Nepodporovaný typ souboru: ${file.type}. Povolené jsou pouze JPEG, PNG a WebP obrázky.` 
          },
          { status: 400 }
        );
      }

      // Kontrola velikosti souboru (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Soubor ${file.name} je příliš velký. Maximální velikost je 5MB.` 
          },
          { status: 400 }
        );
      }

      // Generování unikátního názvu souboru
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1E9);
      const extension = path.extname(file.name);
      const filename = `image-${timestamp}-${randomSuffix}${extension}`;

      // Uložení souboru
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filepath = path.join(uploadsDir, filename);
      
      await writeFile(filepath, buffer);

      uploadedFiles.push({
        filename,
        originalName: file.name,
        url: `/uploads/${filename}`,
        size: file.size,
        mimetype: file.type
      });
    }

    return NextResponse.json({
      success: true,
      message: `Úspěšně nahráno ${uploadedFiles.length} souborů`,
      files: uploadedFiles
    });

  } catch (error) {
    console.error('Chyba při nahrávání souborů:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Chyba serveru při nahrávání souborů',
        error: error instanceof Error ? error.message : 'Neznámá chyba'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Upload endpoint - použijte POST metodu pro nahrání souborů' },
    { status: 405 }
  );
}