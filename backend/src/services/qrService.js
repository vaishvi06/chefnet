const jwt = require('jsonwebtoken');
const qrcode = require('qrcode');
const env = require('../config/env');
const AppError = require('../utils/appError');

class QRService {
  /**
   * Generate a tamper-proof cryptographically signed QR token for a reservation
   */
  generateSignedToken({ reservationId, customerId, chefId, mealType, reserveDate }) {
    const payload = {
      sub: reservationId.toString(),
      cid: customerId.toString(),
      hid: chefId.toString(),
      mt: mealType,
      rd: reserveDate instanceof Date ? reserveDate.toISOString() : reserveDate
    };

    return jwt.sign(payload, env.QR_SECRET, { expiresIn: '7d' });
  }

  /**
   * Verify and decode a signed QR token
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, env.QR_SECRET);
      return decoded;
    } catch (err) {
      throw new AppError('Invalid or corrupted QR token', 400);
    }
  }

  /**
   * Generate a QR Code as PNG Base64 Data URL
   */
  async generateQRCodeDataURL(text) {
    try {
      const dataUrl = await qrcode.toDataURL(text, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 2,
        width: 300
      });
      return dataUrl;
    } catch (err) {
      throw new AppError(`Failed to generate QR code: ${err.message}`, 500);
    }
  }
}

const qrService = new QRService();

module.exports = qrService;
