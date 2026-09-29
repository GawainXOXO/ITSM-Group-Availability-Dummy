import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // jsdom provides a DOM implementation so view/rendering and routing
    // tests can make DOM assertions in a Node environment.
    environment: 'jsdom',
    include: ['src/**/*.test.js', 'test/**/*.test.js'],
  },
});
