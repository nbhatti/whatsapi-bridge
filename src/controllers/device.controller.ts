import { Request, Response } from 'express';
import { DeviceManager } from '../services/DeviceManager';
import logger, { logError, logInfo } from '../config/logger';
import QRCode from 'qrcode';

const deviceManager = DeviceManager.getInstance();

export class DeviceController {
  /**
   * POST /api/v1/devices
   * Create a new WhatsApp device
   */
  public static async createDevice(req: Request, res: Response): Promise<void> {
    try {
      logInfo('Creating new device');
      const device = await deviceManager.createDevice();
      
      res.status(201).json({
        success: true,
        data: {
          deviceId: device.id,
          status: device.status,
          createdAt: device.createdAt,
          lastSeen: device.lastSeen,
          phoneNumber: device.phoneNumber || null,
          clientName: device.clientName || null,
        },
      });
    } catch (error) {
      logError('Error creating device', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create device',
      });
    }
  }

  /**
   * GET /api/v1/devices
   * List all devices
   */
  public static async listDevices(req: Request, res: Response): Promise<void> {
    try {
      logger.debug('Listing all devices');
      const devices = await deviceManager.listDevices();
      
      res.json({
        success: true,
        data: devices.map(device => ({
          deviceId: device.id,
          status: device.status,
          createdAt: device.createdAt,
          lastSeen: device.lastSeen,
          phoneNumber: device.phoneNumber || null,
          clientName: device.clientName || null,
        })),
      });
    } catch (error) {
      logError('Error listing devices', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list devices',
      });
    }
  }

  /**
   * GET /api/v1/devices/:id/status
   * Get device status with QR data URL if waiting for scan
   */
  public static async getDeviceStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.debug(`Getting status for device ${id}`);
      
      const device = deviceManager.getDevice(id);
      if (!device) {
        res.status(404).json({
          success: false,
          error: 'Device not found',
        });
        return;
      }

      const responseData: any = {
        deviceId: device.id,
        status: device.status,
        lastSeen: device.lastSeen,
        phoneNumber: device.phoneNumber || null,
        clientName: device.clientName || null,
      };
      

      // If device is waiting for QR scan, include QR data URL
      if (device.status === 'qr' && device.qrCode) {
        try {
          // Generate base64 data URL for QR code
          const qrDataUrl = await QRCode.toDataURL(device.qrCode, {
            type: 'image/png',
            width: 256,
            margin: 2,
          });
          responseData.qrDataUrl = qrDataUrl;
          responseData.qrCode = device.qrCode; // Raw QR string for alternative usage
        } catch (qrError) {
          logError('Error generating QR data URL', qrError);
          // Still return status without QR if QR generation fails
        }
      }

      res.json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      logError('Error getting device status', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get device status',
      });
    }
  }

  /**
   * DELETE /api/v1/devices/:id
   * Graceful logout and cleanup of device
   */
  public static async deleteDevice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logInfo(`Initiating graceful logout and cleanup for device ${id}`);
      
      const device = deviceManager.getDevice(id);
      if (!device) {
        res.status(404).json({
          success: false,
          error: 'Device not found',
        });
        return;
      }

      // Perform graceful logout and cleanup
      await deviceManager.deleteDevice(id);

      res.json({
        success: true,
        message: 'Device logged out and cleaned up successfully',
      });
    } catch (error) {
      logError('Error during device logout and cleanup', error);
      res.status(500).json({
        success: false,
        error: 'Failed to logout and cleanup device',
      });
    }
  }

  // Legacy endpoints for backward compatibility
  /**
   * GET /api/v1/devices/:id
   * Get device details (legacy endpoint)
   */
  public static async getDevice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.debug(`Getting device ${id}`);
      
      const device = deviceManager.getDevice(id);
      if (!device) {
        res.status(404).json({
          success: false,
          error: 'Device not found',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          deviceId: device.id,
          status: device.status,
          createdAt: device.createdAt,
          lastSeen: device.lastSeen,
          phoneNumber: device.phoneNumber || null,
          clientName: device.clientName || null,
          qrCode: device.qrCode,
        },
      });
    } catch (error) {
      logError('Error getting device', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get device',
      });
    }
  }

  /**
   * GET /api/v1/devices/:id/qr
   * Get QR code for device (legacy endpoint)
   */
  public static async getDeviceQR(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logInfo(`Getting QR code for device ${id}`);
      
      const device = deviceManager.getDevice(id);
      if (!device) {
        res.status(404).json({
          success: false,
          error: 'Device not found',
        });
        return;
      }

      if (!device.qrCode) {
        res.status(404).json({
          success: false,
          error: 'QR code not available',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          qrCode: device.qrCode,
        },
      });
    } catch (error) {
      logError('Error getting QR code', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get QR code',
      });
    }
  }

  /**
   * GET /api/v1/devices/:id/qr.png
   * Get QR code as PNG image for device (legacy endpoint)
   */
  public static async getDeviceQRImage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logInfo(`Getting QR code as PNG for device ${id}`);
      
      const device = deviceManager.getDevice(id);
      if (!device) {
        res.status(404).json({
          success: false,
          error: 'Device not found',
        });
        return;
      }

      if (!device.qrCode) {
        res.status(404).json({
          success: false,
          error: 'QR code not available',
        });
        return;
      }

      const qrCodeImage = await QRCode.toBuffer(device.qrCode, {
        type: 'png',
        width: 256,
        margin: 2,
      });

      res.setHeader('Content-Type', 'image/png');
      res.send(qrCodeImage);
    } catch (error) {
      logError('Error getting QR code as PNG', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get QR code as PNG',
      });
    }
  }

  /**
   * POST /api/v1/devices/:id/contacts
   * Get contacts for a device with optional search and filtering
   */
  public static async getContacts(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { search, contactIds } = req.body || {};
      
      logInfo(`Getting contacts for device ${id}`, { search, contactIds });
      
      const device = deviceManager.getDevice(id);
      if (!device) {
        res.status(404).json({
          success: false,
          error: 'Device not found',
        });
        return;
      }

      if (device.status !== 'ready') {
        res.status(400).json({
          success: false,
          error: 'Device is not ready. Please wait for device to be connected.',
        });
        return;
      }
      

      let contacts;
      
      try {
        // Get all contacts from WhatsApp client
        const allContacts = await device.client.getContacts();
        
        // Convert to our contact format
        let formattedContacts = allContacts.map(contact => ({
          id: contact.id._serialized,
          name: contact.name || contact.pushname || 'Unknown',
          number: contact.number,
          profilePicUrl: null, // Will be fetched separately if needed
          isGroup: contact.isGroup,
          isBusiness: contact.isBusiness || false,
          isMyContact: contact.isMyContact,
        }));

        // Filter by specific contact IDs if provided
        if (contactIds && contactIds.length > 0) {
          formattedContacts = formattedContacts.filter(contact => 
            contactIds.includes(contact.id)
          );
        }
        
        // Filter by search term if provided
        if (search) {
          const searchLower = search.toLowerCase();
          formattedContacts = formattedContacts.filter(contact => 
            contact.name.toLowerCase().includes(searchLower) ||
            (contact.number && contact.number.includes(search))
          );
        }

        // Sort contacts by name
        formattedContacts.sort((a, b) => a.name.localeCompare(b.name));

        contacts = formattedContacts;
      } catch (contactError) {
        logError('Error fetching contacts from WhatsApp client', contactError);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch contacts from WhatsApp',
        });
        return;
      }

      res.json({
        success: true,
        data: contacts,
        meta: {
          total: contacts.length,
          search: search || null,
          filteredByIds: contactIds ? contactIds.length : null,
        },
      });
    } catch (error) {
      logError('Error getting contacts', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get contacts',
      });
    }
  }

  /**
   * DELETE /api/v1/devices/all
   * Delete all devices (admin endpoint)
   */
  public static async deleteAllDevices(req: Request, res: Response): Promise<void> {
    try {
      logInfo('Deleting all devices');
      await deviceManager.deleteAllDevices();
      
      res.json({
        success: true,
        message: 'All devices deleted successfully',
      });
    } catch (error) {
      logError('Error deleting all devices', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete all devices',
      });
    }
  }
}
