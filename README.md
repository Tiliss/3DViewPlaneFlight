# 3D View Flight Visualization
<p align="center">
  <img src="https://github.com/Tiliss/3DViewFlightVisualization/blob/gg/image/plane.gif" width="700" height="400" />
</p>

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

4. Клонируйте репозиторий на свой компьютер:

    ```
    git clone https://github.com/Tiliss/3DViewFlightVisualization.git
    ```

5. Перейдите в директорию проекта:

    ```
    cd 3DViewFlightVisualization
    ```

6. Установите зависимости проекта:

    ```
    npm install
    ```
# Запуск приложения с использованием файла settings.json

## Настройка портов и сервера

В директории `static` в файле `settings.json` настройте порты для серверов:

```jsonc
{
  "TCP": {                //Сервер для получения json-объектов положения самолета
    "port": 8080 
  },
  "HTTP": {               //Сервер для запуска веб-приложения (http://localhost:3000)
    "host": "localhost", 
    "port": 3000
  },
  "WebSocket": {          //Сервер для связи веб-приложения и сервера
    "port": 3001
  }
}
```

Этот файл содержит настройки портов для TCP, HTTP и WebSocket серверов.

## Запуск приложения

1. Откройте терминал и перейдите в директорию вашего проекта.

2. Запустите приложение, выполнив команду:

    ```
    npm start
    ```

## Переход по ссылке

3. После успешного запуска приложения откройте веб-браузер и перейдите по следующей ссылке: [http://localhost:3000](http://localhost:3000).

    Помните, что вы можете настроить хост и порт в файле `settings.json` в соответствии с вашими требованиями.

## Работа с сервером

Для корректной работы приложения необходимо настроить подключение к серверу и отправку восьми видов JSON-сообщений. Ознакомится с примером можно по [ссылке](https://github.com/Tiliss/ViewRouteJSON).

### Подключение к серверу

Приложению необходимо подключиться к серверу c помощью __TCP__ протокола, используя порт и адрес, указанный в файле `settings.json`.
Если запросы отправляются часто, используйте символ `\0` в конце каждого объекта.

### Принимаемые json сообщения

1. **Обновление пути**:

```jsonc
{   
    "what": "update_path", //Обозначние json объекта
    "paths": [{
      "id": "path1", //id пути
      "isRemove": false, //false - создать, true - удалить
      "color": "#111111", //Цвет ображаемой линии пути
      "positions": [{
        "lat": -148.42995429865525, //Широта
        "lon": 15.097558831555673, //Долгота
        "alt": 200 //Высота в метрах
      },
      {
        "lat": -148.42995429865525, 
        "lon": -2.2234772556759594, 
        "alt": 600
      }
    ]
  },
  {
    "id": "path2",
    "isRemove": false,
    "color": "#732133",
    "positions": [
      {
        "lat": 125.98242506147994,
        "lon": 29.66258160855277,
        "alt": 200
      },
      {
        "lat": 118.75538037818689,
        "lon": 27.6579356572079,
        "alt": 200
      }
    ]
  }]
}

```
2. **Обновление положения**:
```jsonc
{
	"what": "update_positions", //Обозначние json объекта
	"positions": [
		{
			"id": "obj1", //id объекта к которому применяется позиция
			"lat": 125.98242506147994, //Широта
			"lon": 29.66258160855277, //Долгота 
			"alt": 200, //Высота в метрах
			"roll": 30.0, //Крен в градусах
			"pitch": -10.0, //Тангаж в градусах
			"yaw": 180.0 //Рысканье в градусах
		},
		{
			"id": "obj2",
			"lat": 125.98242506147994,
			"lon": 29.66258160855277,
			"alt": 150,
			"roll": 100.0,
			"pitch": 10.0,
			"yaw": 10.0
		}
	]
}
```

3. **Обновление объектов**: 
```jsonc
{
	"what": "update_objects", //Обозначние json объекта
	"objects":[
	{
		"id": "obj1", //id объекта
		"type": "Plane", //Тип объекта, совпадает с названием модели в settings.json
		"isRemove": false //false - создать, true - удалить
	},
	{
		"id": "obj2",
		"type": "Plane",
		"isRemove": false
	}
	]
}
```

4. **Переключение карт**
```jsonc
{
	"what": "update_map", //Обозначние json объекта
	"name": "Water" //Имя, отображаемое в настройках
}
```

5. **Запрос на получение id подключенных websocket клиентов**
```jsonc
{
	"what": "get_clientsID" //Обозначние json объекта
}
```
  В ответ приходит json сообщение:
	```jsonc
 	{
 		"what": "clientsID",
   		"clients": [ "socket1ID", "socket2ID", "socket3ID" ]
  	}
 	```

6. **Переключение камер определенного клиента**
```jsonc
{
	"what": "update_cam", //Обозначние json объекта
	"name": "Orbital", //Имя, отображаемое в настройках
	"client": "oVJ1QujH3sow1Wn7AAAF" //id клиента полученного с помощью "Запрос на получение id подключенных websocket клиентов"
}
```

7. **Изменение положения орбитальной камеры**
```jsonc
{
	"what": "update_orbital",
	"radius": 100,
	"horizontalValue": 1,
	"verticalValue": 1
}
```

8. **Изменение положения свободной камеры**
```jsonc
{
	"what": "update_spectator",
	"positionX": 0,
	"positionY": 0,
	"positionZ": 0,
	"rotationX": 0,
	"rotationY": 0,
	"rotationZ": 0
}
```

## Загрузка карт и моделей ##

Для загрузки карт перенесите папку с картой высот и ее текстурой в директорию `static/textures/map`, а затем добавьте карту в файл `settings.json`:

```jsonc
"map": [
    {
      "name": "Mountains", //Название, отображаемое в настройках
      "pathHeightMap": "Mountains/HeightMap.png", //Путь до карты высот
      "pathTextureMap": "Mountains/TexturesMap.png" //Путь до текстур
    },
    {
      "name": "Canyon",
      "pathHeightMap": "Сanyon/HeightMap.png",
      "pathTextureMap": "Сanyon/TextureMap.png"
    },
    {
      "name": "Snow",
      "pathHeightMap": "Snow/HeightMap.png",
      "pathTextureMap": "Snow/TexturesMap.png"
    }
  ],
```

Для загрузки моделей, переместите в директорию `static/models` папку с моделью формата __FBX__, а затем добавьте модель в файл `settings.json`:

```jsonc
"models": [
    {
      "type": "Plane", //Название, для запроса на создание или удаление
      "path": "/models/airplaneFBX/airplane.fbx", //Полный путь до модели формата fbx
      "rotationX": 0, //Поворот по оси X
      "rotationY": 0, //Поворот по оси Y
      "rotationZ": 0, //Поворот по оси Z
      "scale": 0.005 //Маштаб модели
    },
    {
      "type": "Rocket",
      "path": "/models/rocket/Rocket.fbx",
      "rotationX": 0,
      "rotationY": 0,
      "rotationZ": 0,
      "scale": 0.001
    }
  ]
```
