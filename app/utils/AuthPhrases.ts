/**
 * Authentication phrases for voice verification
 * These phrases are used during account creation and transaction verification
 */

/**
 * Collection of phrases that users will speak for voice authentication
 */
export const AUTH_PHRASES = [
  "Sundays are not holidays",
  "My voice is my passport",
  "Verify my identity now",
  "I authorize this payment",
  "Please confirm my transaction",
  "Security is my priority",
  "Today is a good day",
  "Voice verification active",
  "Access my account securely",
  "Authenticate my request now"
];

/**
 * Returns a random authentication phrase from the collection
 */
export const getRandomAuthPhrase = (): string => {
  const randomIndex = Math.floor(Math.random() * AUTH_PHRASES.length);
  return AUTH_PHRASES[randomIndex];
};