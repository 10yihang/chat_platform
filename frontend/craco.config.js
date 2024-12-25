const { whenProd, getPlugin, pluginByName } = require('@craco/craco');

module.exports = {
    devServer: {
        https: false,
        setupMiddlewares: (middlewares, devServer) => {
            if (!devServer) {
              throw new Error('webpack-dev-server is not defined');
            }

            // 在所有其他中间件之前添加中间件
            middlewares.unshift({
                name: 'First Middleware',
                path: '/first',
                middleware: (req, res, next) => {
                    console.log('first middleware');
                    next();
                }
            });
            // 在所有其他中间件之后添加中间件
            middlewares.push({
                name: 'Last Middleware',
                path: '/last',
                middleware: (req, res, next) => {
                    console.log('last middleware');
                    next();
                }
            });

            return middlewares;
        },
    },
};