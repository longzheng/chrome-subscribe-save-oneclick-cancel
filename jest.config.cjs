/* eslint-env node */
/** @type {import('jest').Config} */
module.exports = {
    roots: ['src'],
    transform: {
        '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
    },
};
