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

// Mock react-konva/canvas-heavy deps to avoid requiring native modules in Jest
jest.mock('react-konva', () => ({
  Stage: () => null,
  Layer: () => null,
  Rect: () => null,
  Text: () => null,
  Group: () => null,
  Circle: () => null
}), { virtual: true });

jest.mock('konva', () => ({}), { virtual: true });

// Polyfill mínimo para crypto.randomUUID en entorno Jest
if (typeof global.crypto === 'undefined') {
  // eslint-disable-next-line no-undef
  global.crypto = { randomUUID: () => 'test-uuid' };
}