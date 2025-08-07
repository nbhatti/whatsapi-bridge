import { Request, Response } from 'express';
import { DeviceManager } from '../services/DeviceManager';
import { logError, logInfo } from '../config/logger';

const deviceManager = DeviceManager.getInstance();

/**
 * Mentions and Groups Controller - Handles user mentions and group operations
 */

/**
 * GET /api/v1/devices/:id/groups
 * Get all groups the device is part of
 */
export const getGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { includeParticipants = false } = req.query;

    logInfo(`Getting groups for device ${id}`);

    const device = deviceManager.getDevice(id);
    if (!device || device.status !== 'ready') {
      res.status(400).json({ success: false, error: 'Device not ready.' });
      return;
    }

    const chats = await device.client.getChats();
    const groups = chats.filter(chat => chat.isGroup);

    const groupsData = await Promise.all(groups.map(async (group) => {
      // Cast to any to access group-specific properties
      const groupChat = group as any;
      
      const groupInfo = {
        id: group.id._serialized,
        name: group.name,
        description: groupChat.groupMetadata?.desc || '',
        participantCount: groupChat.participants?.length || 0,
        isAdmin: groupChat.participants?.some((p: any) => p.id._serialized === device.client.info.wid._serialized && p.isAdmin) || false,
        createdAt: groupChat.groupMetadata?.creation?.toString() || null,
        archived: group.archived || false,
        pinned: group.pinned || false,
        muted: group.isMuted || false,
      };

      if (includeParticipants === 'true') {
        (groupInfo as any).participants = groupChat.participants?.map((participant: any) => ({
          id: participant.id._serialized,
          isAdmin: participant.isAdmin,
          isSuperAdmin: participant.isSuperAdmin,
        })) || [];
      }

      return groupInfo;
    }));

    res.json({
      success: true,
      data: groupsData,
      totalGroups: groupsData.length
    });

  } catch (error: any) {
    logError('Error getting groups:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get groups.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * GET /api/v1/devices/:id/groups/:groupId/participants
 * Get participants of a specific group
 */
export const getGroupParticipants = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, groupId } = req.params;

    logInfo(`Getting participants for group ${groupId} from device ${id}`);

    const device = deviceManager.getDevice(id);
    if (!device || device.status !== 'ready') {
      res.status(400).json({ success: false, error: 'Device not ready.' });
      return;
    }

    const group = await device.client.getChatById(groupId);
    
    if (!group.isGroup) {
      res.status(400).json({ success: false, error: 'Chat is not a group.' });
      return;
    }

    const groupData = group as any;
    const participants = groupData.participants?.map((participant: any) => ({
      id: participant.id._serialized,
      pushname: participant.pushname,
      isAdmin: participant.isAdmin,
      isSuperAdmin: participant.isSuperAdmin,
    })) || [];

    res.json({
      success: true,
      data: {
        groupId: group.id._serialized,
        groupName: group.name,
        participants,
        totalParticipants: participants.length,
        admins: participants.filter((p: any) => p.isAdmin || p.isSuperAdmin).length
      }
    });

  } catch (error: any) {
    logError('Error getting group participants:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get group participants.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * POST /api/v1/devices/:id/groups/:groupId/mention
 * Send a message with mentions to a group
 */
export const mentionUsersInGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, groupId } = req.params;
    const { text, mentions, mentionAll = false } = req.body;

    logInfo(`Sending message with mentions to group ${groupId} from device ${id}`);

    const device = deviceManager.getDevice(id);
    if (!device || device.status !== 'ready') {
      res.status(400).json({ success: false, error: 'Device not ready.' });
      return;
    }

    const group = await device.client.getChatById(groupId);
    
    if (!group.isGroup) {
      res.status(400).json({ success: false, error: 'Chat is not a group.' });
      return;
    }

    let mentionList: string[] = [];
    let messageText = text;

    if (mentionAll) {
      // Mention all participants
      const groupData = group as any;
      mentionList = groupData.participants?.map((p: any) => p.id._serialized) || [];
      messageText = `@everyone ${text}`;
      logInfo(`Mentioning all ${mentionList.length} participants`);
    } else if (mentions && Array.isArray(mentions) && mentions.length > 0) {
      // Mention specific users
      mentionList = mentions.map(mention => {
        if (typeof mention === 'string') {
          return mention.includes('@') ? mention : `${mention}@c.us`;
        }
        return mention;
      });
      logInfo(`Mentioning ${mentionList.length} specific users: ${mentionList.join(', ')}`);
    } else {
      res.status(400).json({ 
        success: false, 
        error: 'Must specify mentions array or set mentionAll to true.' 
      });
      return;
    }

    const message = await group.sendMessage(messageText, {
      mentions: mentionList
    });

    res.json({
      success: true,
      data: {
        message,
        groupId: group.id._serialized,
        groupName: group.name,
        mentionCount: mentionList.length,
        mentionedAll: mentionAll,
        mentions: mentionList
      }
    });

  } catch (error: any) {
    logError('Error mentioning users in group:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to mention users in group.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * POST /api/v1/devices/:id/mentions/send
 * Send a message with mentions to any chat (group or individual)
 */
export const sendMentionMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
      to, 
      text, 
      mentions, 
      quotedMessageId,
      media,
      mentionAll = false 
    } = req.body;

    logInfo(`Sending mention message from device ${id} to ${to}`);

    const device = deviceManager.getDevice(id);
    if (!device || device.status !== 'ready') {
      res.status(400).json({ success: false, error: 'Device not ready.' });
      return;
    }

    // Format recipient
    let formattedTo = to;
    if (!to.includes('@')) {
      formattedTo = `${to}@c.us`;
    }

    const chat = await device.client.getChatById(formattedTo);
    let mentionList: string[] = [];
    let messageText = text;

    if (chat.isGroup && mentionAll) {
      // For groups, mention all participants
      const chatData = chat as any;
      mentionList = chatData.participants?.map((p: any) => p.id._serialized) || [];
      messageText = `@everyone ${text}`;
      logInfo(`Group chat: mentioning all ${mentionList.length} participants`);
    } else if (mentions && Array.isArray(mentions) && mentions.length > 0) {
      // Mention specific users
      mentionList = mentions.map(mention => {
        if (typeof mention === 'string') {
          return mention.includes('@') ? mention : `${mention}@c.us`;
        }
        return mention;
      });
      logInfo(`Mentioning ${mentionList.length} specific users: ${mentionList.join(', ')}`);
    }

    // Build send options
    const sendOptions: any = {
      ...(quotedMessageId && { quotedMessageId }),
      ...(mentionList.length > 0 && { mentions: mentionList }),
    };

    let message;
    if (media && media.data) {
      // Send media with mentions
      const { MessageMedia } = await import('whatsapp-web.js');
      const mediaObj = new MessageMedia(
        media.mimetype || 'image/jpeg',
        media.data,
        media.filename || 'media'
      );
      
      if (messageText) {
        sendOptions.caption = messageText;
      }
      
      message = await chat.sendMessage(mediaObj, sendOptions);
      logInfo(`Media message with mentions sent to ${formattedTo}`);
    } else {
      // Send text message with mentions
      message = await chat.sendMessage(messageText, sendOptions);
      logInfo(`Text message with mentions sent to ${formattedTo}`);
    }

    res.json({
      success: true,
      data: {
        message,
        recipient: formattedTo,
        chatType: chat.isGroup ? 'group' : 'individual',
        groupName: chat.isGroup ? chat.name : null,
        mentionCount: mentionList.length,
        mentionedAll: mentionAll && chat.isGroup,
        mentions: mentionList,
        hasMedia: !!(media && media.data),
        isReply: !!quotedMessageId
      }
    });

  } catch (error: any) {
    logError('Error sending mention message:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send mention message.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * GET /api/v1/devices/:id/contacts/mentionable
 * Get contacts that can be mentioned (for autocomplete)
 */
export const getMentionableContacts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { search, limit = 50 } = req.query;

    logInfo(`Getting mentionable contacts for device ${id}`);

    const device = deviceManager.getDevice(id);
    if (!device || device.status !== 'ready') {
      res.status(400).json({ success: false, error: 'Device not ready.' });
      return;
    }

    const contacts = await device.client.getContacts();
    const searchTerm = (search as string)?.toLowerCase() || '';
    const contactLimit = Math.min(parseInt(limit as string) || 50, 100);

    let mentionableContacts = contacts
      .filter(contact => {
        // Filter out yourself and invalid contacts
        return contact.id._serialized !== device.client.info.wid._serialized && 
               contact.pushname &&
               contact.id._serialized.includes('@c.us');
      })
      .map(contact => ({
        id: contact.id._serialized,
        name: contact.pushname || contact.name || 'Unknown',
        number: contact.number,
        isMyContact: contact.isMyContact,
        // profilePicUrl: contact.profilePicUrl // Not available in this version
      }));

    // Apply search filter if provided
    if (searchTerm) {
      mentionableContacts = mentionableContacts.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm) ||
        contact.number.includes(searchTerm)
      );
    }

    // Limit results
    mentionableContacts = mentionableContacts.slice(0, contactLimit);

    res.json({
      success: true,
      data: mentionableContacts,
      totalResults: mentionableContacts.length,
      searchTerm: searchTerm || null
    });

  } catch (error: any) {
    logError('Error getting mentionable contacts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get mentionable contacts.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
