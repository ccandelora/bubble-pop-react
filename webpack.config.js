const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/'
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif|webp)$/i,
                type: 'asset/resource',
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.jsx'],
        alias: {
            '@babylonjs/core': path.resolve(__dirname, 'node_modules/@babylonjs/core'),
            '@babylonjs/gui': path.resolve(__dirname, 'node_modules/@babylonjs/gui')
        }
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { 
                    from: 'public',
                    to: ''
                }
            ]
        })
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, 'public'),
        },
        compress: true,
        port: 3000,
        hot: true,
        historyApiFallback: true
    },
    devtool: 'source-map'
}; 