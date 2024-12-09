//@ts-check

'use strict';

const path = require('path');

/** @type {import('webpack').Configuration} */
const extensionConfig = {
    target: 'node',
    mode: 'development',
    entry: './src/extension.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'extension.js',
        libraryTarget: 'commonjs2'
    },
    externals: {
        vscode: 'commonjs vscode'
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader'
                    }
                ]
            }
        ]
    },
    devtool: 'nosources-source-map'
};

/** @type {import('webpack').Configuration} */
const webviewConfig = {
    name: 'webview',
    target: ['web', 'es2020'],
    mode: 'development',
    entry: './src/webview/index.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'webview.js',
        libraryTarget: 'window'
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            compilerOptions: {
                                module: 'es6',
                                moduleResolution: 'node'
                            }
                        }
                    }
                ]
            }
        ]
    },
    devtool: 'inline-source-map'
};

module.exports = [extensionConfig, webviewConfig]; 