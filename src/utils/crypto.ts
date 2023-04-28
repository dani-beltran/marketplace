import crypto from 'crypto';

export const generateBase64Token = (length = 10) => {
  // Generate a random buffer of the specified length
  const buffer = crypto.randomBytes(length);
  // Convert the buffer to a base64 string
  const base64String = buffer.toString('base64');
  return base64String;
}