import { Request, Response } from 'express';
import { GroupChat } from 'whatsapp-web.js';
import { DeviceManager } from '../services/DeviceManager';
import { logError, logInfo } from '../config/logger';

const deviceManager = DeviceManager.getInstance();

export class GroupsController {
  /**
   * POST /api/v1/devices/:id/groups/:groupId/join
   * Accept group invite link or code
   */
  public static async joinGroup(req: Request, res: Response): Promise<void> {
    try {
      const { id: deviceId, groupId } = req.params;
      const { inviteCode, inviteLink } = req.body;

      logInfo(`Device ${deviceId} attempting to join group ${groupId}`);
      
      const device = deviceManager.getDevice(deviceId);
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
          error: 'Device is not ready. Please ensure the device is connected to WhatsApp.',
        });
        return;
      }

      // Validate that either inviteCode or inviteLink is provided
      if (!inviteCode && !inviteLink) {
        res.status(400).json({
          success: false,
          error: 'Either inviteCode or inviteLink must be provided',
        });
        return;
      }

      try {
        let result;
        
        if (inviteLink) {
          // Extract invite code from invite link if it's a full URL
          const inviteCodeFromLink = inviteLink.includes('chat.whatsapp.com/') 
            ? inviteLink.split('chat.whatsapp.com/')[1]
            : inviteLink;
          result = await device.client.acceptInvite(inviteCodeFromLink);
        } else if (inviteCode) {
          // Join group via invite code
          result = await device.client.acceptInvite(inviteCode);
        }

        logInfo(`Device ${deviceId} successfully joined group ${groupId}`);
        
        res.status(200).json({
          success: true,
          data: {
            deviceId,
            groupId: result || groupId, // result is the group ID string
            message: 'Successfully joined the group',
            joinedGroupId: result
          },
        });

      } catch (whatsappError: any) {
        logError(`WhatsApp error when joining group ${groupId}`, whatsappError);
        
        // Handle specific WhatsApp errors
        let errorMessage = 'Failed to join group';
        if (whatsappError.message?.includes('invite')) {
          errorMessage = 'Invalid or expired invite link/code';
        } else if (whatsappError.message?.includes('already')) {
          errorMessage = 'Already a member of this group';
        }

        res.status(400).json({
          success: false,
          error: errorMessage,
          details: whatsappError.message,
        });
      }

    } catch (error) {
      logError('Error joining group', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while joining group',
      });
    }
  }

  /**
   * POST /api/v1/devices/:id/groups/:groupId/leave
   * Leave a group
   */
  public static async leaveGroup(req: Request, res: Response): Promise<void> {
    try {
      const { id: deviceId, groupId } = req.params;

      logInfo(`Device ${deviceId} attempting to leave group ${groupId}`);
      
      const device = deviceManager.getDevice(deviceId);
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
          error: 'Device is not ready. Please ensure the device is connected to WhatsApp.',
        });
        return;
      }

      try {
        // Get the chat instance for the group
        const chat = await device.client.getChatById(groupId);
        
        if (!chat || !chat.isGroup) {
          res.status(404).json({
            success: false,
            error: 'Group not found',
          });
          return;
        }

        // Leave the group
        const groupChat = chat as GroupChat; // Cast to GroupChat
        await groupChat.leave();

        logInfo(`Device ${deviceId} successfully left group ${groupId}`);
        
        res.status(200).json({
          success: true,
          data: {
            deviceId,
            groupId,
            message: 'Successfully left the group',
          },
        });

      } catch (whatsappError: any) {
        logError(`WhatsApp error when leaving group ${groupId}`, whatsappError);
        
        // Handle specific WhatsApp errors
        let errorMessage = 'Failed to leave group';
        if (whatsappError.message?.includes('not found')) {
          errorMessage = 'Group not found';
        } else if (whatsappError.message?.includes('not a participant')) {
          errorMessage = 'Not a member of this group';
        }

        res.status(400).json({
          success: false,
          error: errorMessage,
          details: whatsappError.message,
        });
      }

    } catch (error) {
      logError('Error leaving group', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while leaving group',
      });
    }
  }

  /**
   * POST /api/v1/devices/:id/groups/:groupId/participants/add
   * Add participants to a group (Future stub)
   */
  public static async addParticipants(req: Request, res: Response): Promise<void> {
    // Future implementation stub
    res.status(501).json({
      success: false,
      error: 'Not implemented yet',
      message: 'Add participants functionality will be implemented in a future version',
    });
  }

  /**
   * POST /api/v1/devices/:id/groups/:groupId/participants/remove
   * Remove participants from a group (Future stub)
   */
  public static async removeParticipants(req: Request, res: Response): Promise<void> {
    // Future implementation stub
    res.status(501).json({
      success: false,
      error: 'Not implemented yet',
      message: 'Remove participants functionality will be implemented in a future version',
    });
  }

  /**
   * PUT /api/v1/devices/:id/groups/:groupId/subject
   * Set group subject/name (Future stub)
   */
  public static async setGroupSubject(req: Request, res: Response): Promise<void> {
    // Future implementation stub
    res.status(501).json({
      success: false,
      error: 'Not implemented yet',
      message: 'Set group subject functionality will be implemented in a future version',
    });
  }

  /**
   * PUT /api/v1/devices/:id/groups/:groupId/description
   * Set group description (Future stub)
   */
  public static async setGroupDescription(req: Request, res: Response): Promise<void> {
    // Future implementation stub
    res.status(501).json({
      success: false,
      error: 'Not implemented yet',
      message: 'Set group description functionality will be implemented in a future version',
    });
  }
}
