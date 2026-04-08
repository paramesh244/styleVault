import Dexie from 'dexie';

const db = new Dexie('StyleVaultDB');

db.version(1).stores({
  clothes: '++id, name, type, subType, formality, createdAt',
  outfits: '++id, name, occasion, savedAt',
  settings: 'key',
});

// ===== Clothing CRUD =====

export async function addClothing(clothingData) {
  const id = await db.clothes.add({
    ...clothingData,
    createdAt: Date.now(),
  });
  return id;
}

export async function getAllClothing() {
  return db.clothes.orderBy('createdAt').reverse().toArray();
}

export async function getClothingById(id) {
  return db.clothes.get(id);
}

export async function updateClothing(id, updates) {
  return db.clothes.update(id, updates);
}

export async function deleteClothing(id) {
  // Also remove from any saved outfits
  const outfits = await db.outfits.toArray();
  for (const outfit of outfits) {
    if (outfit.clothingIds && outfit.clothingIds.includes(id)) {
      const newIds = outfit.clothingIds.filter(cid => cid !== id);
      if (newIds.length < 2) {
        await db.outfits.delete(outfit.id);
      } else {
        await db.outfits.update(outfit.id, { clothingIds: newIds });
      }
    }
  }
  return db.clothes.delete(id);
}

export async function getClothingCount() {
  return db.clothes.count();
}

// ===== Outfit CRUD =====

export async function saveOutfit(outfitData) {
  const id = await db.outfits.add({
    ...outfitData,
    savedAt: Date.now(),
  });
  return id;
}

export async function getAllOutfits() {
  return db.outfits.orderBy('savedAt').reverse().toArray();
}

export async function deleteOutfit(id) {
  return db.outfits.delete(id);
}

// ===== Settings =====

export async function setSetting(key, value) {
  return db.settings.put({ key, value });
}

export async function getSetting(key) {
  const result = await db.settings.get(key);
  return result ? result.value : null;
}

// ===== Helpers =====

export async function clearAllData() {
  await db.clothes.clear();
  await db.outfits.clear();
  await db.settings.clear();
}

// Convert a File/Blob to a base64 data URL for storage
export function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Create a thumbnail from an image data URL
export function createThumbnail(dataUrl, maxSize = 200) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = dataUrl;
  });
}

export default db;
