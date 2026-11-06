const fs = require('fs');
const path = require('path');

/**
 * Storage provider interface / abstract base
 */
class BaseStorageProvider {
  async saveFile(file) {
    throw new Error('saveFile method must be implemented');
  }

  async deleteFile(filenameOrUrl) {
    throw new Error('deleteFile method must be implemented');
  }

  getFileUrl(filename) {
    throw new Error('getFileUrl method must be implemented');
  }
}

/**
 * Local Disk Storage Provider
 * Saves uploads locally to /uploads directory and generates relative/absolute URLs
 */
class LocalStorageProvider extends BaseStorageProvider {
  constructor(uploadsDir = path.resolve(__dirname, '../../uploads')) {
    super();
    this.uploadsDir = uploadsDir;
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async saveFile(file) {
    // Multer diskStorage automatically saves file to uploadsDir
    return this.getFileUrl(file.filename);
  }

  async deleteFile(filenameOrUrl) {
    if (!filenameOrUrl) return false;
    const filename = path.basename(filenameOrUrl);
    const filePath = path.join(this.uploadsDir, filename);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  }

  getFileUrl(filename) {
    if (!filename) return null;
    return `/uploads/${path.basename(filename)}`;
  }
}

// Service container exposing the active storage provider (default: local)
class StorageService {
  constructor(provider = new LocalStorageProvider()) {
    this.provider = provider;
  }

  setProvider(provider) {
    this.provider = provider;
  }

  async save(file) {
    return this.provider.saveFile(file);
  }

  async delete(url) {
    return this.provider.deleteFile(url);
  }

  getUrl(filename) {
    return this.provider.getFileUrl(filename);
  }
}

const storageService = new StorageService();

module.exports = {
  StorageService,
  LocalStorageProvider,
  storageService
};
