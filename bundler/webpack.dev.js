const path = require('path');
const { merge } = require('webpack-merge');
const commonConfiguration = require('./webpack.common.js');
const ip = require('ip');
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const net = require('net');
const fs = require('fs');

process.noDeprecation = true; //Время от времени отключать, проверять наличие ошибок

let settings;
//Путь к JSON-файлу с настройками
const pathToJsonFile = './static/serverSettings.json';
// Чтение содержимого файла JSON
try {
    const data = fs.readFileSync(pathToJsonFile, 'utf8');
    settings = JSON.parse(data);
} catch (error) {
    console.error('Error reading or parsing JSON file:', error);
}

let clientSockets = [];

// Отправляем данные всем подключенным клиентам
function sendToAllClients(data) {
    clientSockets.forEach(socket => {
        // Проверяем, подключен ли сокет
        if (socket.connected) {
            socket.emit('message', JSON.stringify(data));
        }
    });
}

function sendToSelectedClients(data, client) {
    clientSockets.forEach(socket => {
        // Проверяем, подключен ли сокет
        if (socket.connected && socket.id == client) {
            socket.emit('message', JSON.stringify(data));
        }
    });
}

const serverTCP = net.createServer();
serverTCP.on('connection', (socket) => {
    console.log(`${clientConnectColor(`Client TCP connected: ${socket.remoteAddress}:${socket.remotePort}`)}`);

    socket.on('data', (data) => {

        if (clientSockets.length > 0) {
            let jsonClients = JSON.parse(data)
            if (jsonClients.what === "get_clientsID") {
                let clients = []
                console.log(clientSockets.id)
                clientSockets.forEach(socket => {
                    // Проверяем, подключен ли сокет
                    if (socket.connected) {
                        clients.push(socket.id)
                    }
                });
                let clientsString = clients.join(";");
                socket.write(clientsString);
            }
            else if (jsonClients.what === "update_cam") {
                console.log(jsonClients.client);
                sendToSelectedClients(JSON.parse(data), jsonClients.client);
                // Отправка ответа обратно клиенту
                const responseMessage = 'Success';
                socket.write(responseMessage);
            }
            else {
                sendToAllClients(JSON.parse(data));
                // Отправка ответа обратно клиенту
                const responseMessage = 'Success';
                socket.write(responseMessage);
            }

        } else {
            // Отправка ответа обратно клиенту о том, что нет подключенных сокетов
            const responseMessage = 'No connected sockets';
            socket.write(responseMessage);
        }
    });

    // Обработка закрытия соединения
    socket.on('close', () => {
        console.log(`${clientDisconnectColor(`Client TCP disconnected: ${socket.remoteAddress}:${socket.remotePort}`)}`);
    });

    // Обработка ошибок
    socket.on('error', (error) => {
        console.error('TCP Server error:', error);
    });
});
serverTCP.listen(settings.TCP.port, () => {
    console.log(`${infoColor(`TCP Server is listening on port ${settings.TCP.port}`)}`);
});


const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "http://" + settings.HTTP.host + ":" + settings.HTTP.port,
        methods: ["POST"]
    }
});
io.on('connection', (socket) => {
    console.log(`${clientConnectColor('Client socket.io connected')}`);
    clientSockets.push(socket);
    console.log(socket.id);

    socket.on('disconnect', () => {
        console.log(`${clientDisconnectColor('Client socket.io disconnected')}`);
        clientSockets = clientSockets.filter(client => client !== socket);
    });
});
// Запуск сервера
server.listen(settings.WebSocket.port, () => {
    console.log(`${infoColor(`socket.io Server is listening on port ${settings.WebSocket.port}`)}`);
});

//Цвета для выделения сообщений в консоле
const infoColor = (message) =>
    `\u001b[1m\u001b[34m${message}\u001b[39m\u001b[22m`;
const clientConnectColor = (message) =>
    `\u001b[1m\u001b[32m${message}\u001b[39m\u001b[22m`;
const clientDisconnectColor = (message) => 
    `\u001b[1m\u001b[31m${message}\u001b[39m\u001b[22m`

module.exports = merge(commonConfiguration, {
    stats: 'errors-warnings',
    mode: 'development',
    infrastructureLogging: {
        level: 'warn',
    },
    devServer: {
        host: settings.HTTP.host,
        port: settings.HTTP.port,
        open: false,
        https: false,
        allowedHosts: 'all',
        hot: true,
        watchFiles: ['src/**', 'static/**'],
        static: {
            watch: true,
            directory: path.join(__dirname, '../static'),
        },
        client: {
            logging: 'none',
            overlay: true,
            progress: false,
        },
        onAfterSetupMiddleware: function (devServer) {
            const port = devServer.options.port;
            const https = devServer.options.https ? 's' : '';
            const localIp = ip.address();
            const domain1 = `http${https}://${settings.HTTP.host}:${settings.HTTP.port}`;

            console.log(
                `Проект запущен на:\n  - ${infoColor(domain1)}`
            );
        },
    },
});