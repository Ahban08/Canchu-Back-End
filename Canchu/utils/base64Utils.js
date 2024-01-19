//const atob = require('atob');
const { Buffer } = require('buffer');

// Function to encode a string to Base64
exports.encodeBase64 = (string) => {
    const encodedString = Buffer.from(string).toString('base64');
    return encodedString;
}
  
// Function to decode a Base64 string
exports.decodeBase64 = (string) => {
    const decodedString = Buffer.from(string, 'base64').toString('utf-8');
    return decodedString;
}
  
  