/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-env node */
const { merge } = require('webpack-merge');
const prod = require('./webpack.prod.js');

/** @type {import('webpack').Configuration} */
module.exports = merge(prod, {
    devtool: 'source-map',
});
