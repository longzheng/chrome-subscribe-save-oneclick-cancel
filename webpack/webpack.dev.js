/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-env node */
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

/** @type {import('webpack').Configuration} */
module.exports = merge(common, {
    devtool: 'inline-source-map',
    mode: 'development',
});
