# 🚀 SUPABASE STORAGE SETUP GUIDE

## SOUČASNÝ STAV:
- ❌ **2.4GB obrázků** je moc pro Vercel free (limit 100MB)
- ❌ **Všechny produktové obrázky = placeholders**
- ✅ **Supabase účet připraven** s access tokenem

## ŘEŠENÍ: 
**WebP konverze + Supabase Storage = 60% úspora místa + CDN**

---

## 📝 KROK 1: VYTVOŘENÍ STORAGE BUCKETU

### Manuálně v Supabase Dashboard:

1. **Jdi na:** https://supabase.com/dashboard/project/dbnfkzctensbpktgbsgn
2. **Naviguj:** Storage → Buckets  
3. **Klikni:** "New bucket"
4. **Nastavení:**
   ```
   Name: product-images
   Public: ✅ YES (důležité!)
   File size limit: 50MB
   Allowed MIME types: 
   - image/jpeg
   - image/webp  
   - image/png
   ```

### Nebo pomocí scriptu:
```bash
node setup-supabase-storage-simple.js
```

---

## 📝 KROK 2: KONVERZE A UPLOAD OBRÁZKŮ

```bash
# Nainstaluje sharp a supabase-js
node convert-and-upload-images.js
```

**Co script dělá:**
- ✅ **Konvertuje JPG → WebP** (80% kvalita, ~60% úspora)
- ✅ **Nahrává do Supabase Storage**
- ✅ **Testuje prvních 10 složek** (30 obrázků)
- ✅ **Loguje progress a chyby**

**Pro plný upload odstraň:**
```javascript
const maxFolders = 10; // Remove this line for full upload
Math.min(folders.length, maxFolders) // Change to folders.length
```

---

## 📝 KROK 3: UPDATE API

### A) Přidej helper funkci do obou API:
- `app/api/products/route.ts`
- `app/api/products/[id]/route.ts`

```typescript
const SUPABASE_STORAGE_URL = 'https://dbnfkzctensbpktgbsgn.supabase.co/storage/v1/object/public/product-images';

function getSupabaseImageUrl(imagePath: string) {
  if (!imagePath || typeof imagePath !== 'string') {
    return '/placeholder.svg';
  }
  
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  if (imagePath.startsWith('/images/') || imagePath.startsWith('/placeholder')) {
    return imagePath;
  }
  
  // Convert database path to Supabase URL with WebP
  if (imagePath.includes('/') && !imagePath.startsWith('/')) {
    const webpPath = imagePath.replace(/\.(jpg|jpeg)$/i, '.webp');
    return \`\${SUPABASE_STORAGE_URL}/\${webpPath}\`;
  }
  
  // Folder name → first image
  const folderName = imagePath;
  const imageFileName = \`1_\${folderName.toUpperCase().replace(/-/g, '_')}_1.webp\`;
  return \`\${SUPABASE_STORAGE_URL}/\${folderName}/\${imageFileName}\`;
}
```

### B) Replace image transformation:
```typescript
// Old placeholder logic
return '/placeholder.svg'

// New Supabase logic  
return getSupabaseImageUrl(img)
```

---

## 📝 KROK 4: DEPLOYMENT

```bash
git add .
git commit -m "Add Supabase storage integration for images"
git push origin master
```

**Vercel automaticky deployuje** ✅

---

## 🎯 OČEKÁVANÉ VÝSLEDKY:

### Before:
- ❌ **Všechny obrázky = placeholders**
- ❌ **2.4GB pro Vercel = impossible**

### After:  
- ✅ **Skutečné produktové obrázky**
- ✅ **WebP = rychlejší loading**
- ✅ **Supabase CDN = globálně rychlé**
- ✅ **~900MB místo 2.4GB**

---

## 🚨 DŮLEŽITÉ POZNÁMKY:

1. **Free tier limity:**
   - Supabase: 1GB storage + 10GB bandwidth/měsíc
   - Dostatečné pro ~1000 obrázků

2. **WebP kompatibilita:**
   - Modern browsers: ✅ 95% support
   - Fallback na placeholder pro staré prohlížeče

3. **Upload limit:**
   - Max 50MB per file (Supabase limit)
   - Script automaticky přeskakuje větší soubory

4. **Testing first:**
   - Script defaultně nahrává jen 30 obrázků (test)
   - Pro full upload změň `maxFolders`

---

## 📞 READY TO GO:

1. **Vytvoř bucket** (manual/script)
2. **Spusť:** `node convert-and-upload-images.js`  
3. **Zkontroluj upload v Supabase dashboard**
4. **Update API kód**
5. **Deploy & test**

**VŠECHNO JE PŘIPRAVENÉ! 🚀**