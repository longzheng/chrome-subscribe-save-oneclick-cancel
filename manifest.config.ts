import { defineManifest } from '@crxjs/vite-plugin';
import { VERSION } from './src/version';

const amazonDomains = [
    'https://www.amazon.com',
    'https://www.amazon.ca',
    'https://www.amazon.co.uk',
    'https://www.amazon.de',
    'https://www.amazon.fr',
    'https://www.amazon.it',
    'https://www.amazon.es',
    'https://www.amazon.co.jp',
    'https://www.amazon.in',
    'https://www.amazon.com.au',
];

export default defineManifest({
    manifest_version: 3,
    name: 'Amazon Subscribe & Save one-click cancel',
    description: 'Easy way to cancel Subscribe & Save subscriptions on Amazon with just one button click',
    version: VERSION,
    icons: {
        16: 'icon16.png',
        32: 'icon32.png',
        48: 'icon48.png',
        128: 'icon128.png',
    },
    content_scripts: [
        {
            matches: amazonDomains.map((domain) => `${domain}/*`),
            js: ['src/content_script.ts'],
        },
    ],
    permissions: ['storage'],
});
