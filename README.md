# 3D View Plane Flight Visualization

## Описание

Проект визуализации полета самолета в 3D представляет собой инструмент для наглядного отображения полетов в трехмерном пространстве.
## Особенности

- **Визуализация траектории полета**: Пользователи могут наблюдать траектории полетов в трехмерной среде, что позволяет рассматривать маршруты с разных углов и перспектив.

- **Интерактивное управление**: Приложение предоставляет интерактивное управление для пользователей, такое как масштабирование и вращение изображения.

- **Обновление в реальном времени**: Приложение поддерживает обновление в реальном времени, что позволяет пользователям отслеживать актуальную информацию о полетах и наблюдать изменения по мере их появления.

## Технологии

Проект визуализации полета самолета в 3D использует следующие технологии:

- **Three.js**: Библиотека JavaScript для создания и отображения трехмерной графики в веб-браузере.

- **HTML/CSS**: Создание пользовательского интерфейса и стилизация элементов приложения.

- **JavaScript**: Реализация интерактивных функций и обработка логики визуализации данных.
  
## Установка

Для запуска проекта 3D View Plane Flight Visualization убедитесь, что на вашем компьютере установлены Node.js и npm. Если они не установлены, вы можете использовать один из следующих способов:

### Установка через официальный сайт

1. Перейдите на [официальный сайт Node.js](https://nodejs.org/en/download/).

2. Скачайте установщик для вашей операционной системы и следуйте инструкциям по установке.

3. После установки проверьте версии Node.js и npm в вашем терминале:

    ```
    node -v
    ```

    ```
    npm -v
    ```

    Убедитесь, что вы видите версии Node.js и npm.

### Установка через пакетный менеджер (например, apt для Ubuntu)

Если вы используете Linux, вы можете установить Node.js и npm через ваш пакетный менеджер. Например, для Ubuntu выполните следующие команды в терминале:

1. Обновите индексы пакетов:

    ```
    sudo apt update
    ```

2. Установите Node.js и npm:

    ```
    sudo apt install nodejs npm
    ```

3. Проверьте версии Node.js и npm в вашем терминале:

    ```
    node -v
    ```

    ```
    npm -v
    ```

    Убедитесь, что вы видите версии Node.js и npm.

4. Продолжите установку проекта, выполнив оставшиеся шаги из инструкции выше.

5. Клонируйте репозиторий на свой компьютер:

    ```
    git clone https://github.com/Tiliss/3DViewPlane.git
    ```

6. Перейдите в директорию проекта:

    ```
    cd 3DViewPlane
    ```

7. Установите зависимости проекта:

    ```
    npm install
    ```
# Запуск приложения с использованием файла ServerSettings.json

## Настройка портов и сервера

1. Создайте файл `serversettings.json` в директории `static`, если его ещё нет. Убедитесь, что файл содержит следующее содержимое:

    ```json
    {
      "TCP": {
        "port": 8080
      },
      "HTTP": {
        "host": "localhost",
        "port": 3000
      },
      "WebSocket": {
        "port": 3001
      }
    }
    ```

    Этот файл содержит настройки портов для TCP, HTTP и WebSocket серверов.

## Запуск приложения

2. Откройте терминал и перейдите в директорию вашего проекта.

3. Запустите приложение, выполнив команду:

    ```
    npm start
    ```

## Переход по ссылке

4. После успешного запуска приложения откройте веб-браузер и перейдите по следующей ссылке: [http://localhost:3000](http://localhost:3000).

    Помните, что вы можете настроить хост и порт в файле `serversettings.json` в соответствии с вашими предпочтениями.
