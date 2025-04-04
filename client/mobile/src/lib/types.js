// This file mirrors the types from the web version in client/src/lib/types.ts
// but in JavaScript format for React Native

/**
 * @typedef {Object} Message
 * @property {string} id - Unique identifier for the message
 * @property {string} content - Text content of the message
 * @property {'user' | 'assistant'} role - Who sent the message
 * @property {string} timestamp - When the message was sent
 * @property {string} [imageData] - Optional base64 encoded image data
 */

/**
 * @typedef {Object} ChatHistoryItem
 * @property {number} id - Unique identifier for the chat history
 * @property {Message[]} messages - Array of messages in this chat
 * @property {string} createdAt - When the chat was created
 */

/**
 * @typedef {Object} FashionColor
 * @property {string} name - Color name
 * @property {string} hexCode - Hex code for the color
 */

/**
 * @typedef {Object} FashionOutfit
 * @property {string} id - Unique identifier for the outfit
 * @property {string} name - Name of the outfit
 * @property {string} description - Description of the outfit
 * @property {string} imageUrl - URL to the outfit image
 */

/**
 * @typedef {Object} FashionAccessory
 * @property {string} id - Unique identifier for the accessory
 * @property {string} name - Name of the accessory
 * @property {string} description - Description of the accessory
 * @property {string} icon - Icon name for the accessory
 */

/**
 * @typedef {Object} TrendResponse
 * @property {string} message - Text message about trends
 * @property {FashionColor[]} [colors] - Optional array of color trends
 * @property {FashionOutfit[]} [outfits] - Optional array of outfit trends
 * @property {FashionAccessory[]} [accessories] - Optional array of accessory trends
 */

/**
 * @typedef {Object} ChatResponse
 * @property {string} message - Response message text
 * @property {'text' | 'trends' | 'outfits' | 'accessories'} responseType - Type of response
 * @property {TrendResponse} [data] - Optional trend data
 */

export const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant'
};