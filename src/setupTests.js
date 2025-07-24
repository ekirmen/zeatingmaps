import '@testing-library/jest-dom/extend-expect';

// Polyfill for TextEncoder, TextDecoder, and ReadableStream for Jest environment
import { TextEncoder, TextDecoder } from 'util';

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

// Polyfill for ReadableStream (minimal)
if (typeof global.ReadableStream === 'undefined') {
  class ReadableStream {
    constructor() {
      throw new Error('ReadableStream is not implemented in this environment.');
    }
  }
  global.ReadableStream = ReadableStream;
}
