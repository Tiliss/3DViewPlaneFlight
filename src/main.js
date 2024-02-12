import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader' 
import { Water } from 'three/examples/jsm/objects/Water'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Sky } from 'three/examples/jsm/objects/Sky'
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js'
import Stats from 'stats.js';
import * as dat from 'lil-gui';
import './style.css';
import { CoordinatesConverter } from './CoordinatesConverter.js';
import { ThirdPersonCamera } from './ThirdPersonCamera.js' 
import io from 'socket.io-client';

// Путь к JSON-файлу настроек сервера
const jsonFilePath = 'serverSettings.json';
var jsonMap; //json c картами и их путями
var jsonObject //json c моделями и их путями
const guiMapParams = {
    selectedMap: 'Plane',
    mapOptions: ['Plane', 'Water'],
}
let sky, sun; //Небо и солнце


// Функция для загрузки JSON файла с использованием колбэков
function loadJsonFile(filePath, callback) {
    fetch(filePath)//Один раз, если не менять путь к файлу на сервере
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(jsonData => {
            callback(null, jsonData); // Передает данные обратно через колбэк
        })
        .catch(error => {
            callback(error, null); // Передает ошибку обратно через колбэк
        });
}

//Вызываем функцию загрузки JSON файла с колбэком
loadJsonFile(jsonFilePath, (error, jsonData) => {
    if (error) {
        console.error('Ошибка при загрузке файла:', error);
    } else {

        jsonObject = jsonData.models //Получение json с моделями
        jsonMap = jsonData.map; //Получения json с картами
        for (var i = 0; i < jsonMap.length; i++) {
            guiMapParams.mapOptions.push(jsonData.map[i].name);
        }
        dropDownMap.options(guiMapParams.mapOptions);

        // запуск сервера socket.io
        const socket = io(`http://${jsonData.HTTP.host}:${jsonData.WebSocket.port}`);
        socket.on('connect', () => {
            console.log('Connected to socket.io server');
            const textContainerID = document.getElementById('textContainerID');
            textContainerID.innerText = `ID: ${socket.id}`;
        }); 

        socket.on('message', (data) => {
            try {
                const json = JSON.parse(data);
                console.log('Received data from socket.io server:', json);
                switch (json.what) {
                    case 'update_path': //Обновление пути
                        getPath(json);
                        break;
                    case 'update_objects': //Обновление объектов
                        getObject(json);
                        break;
                    case 'update_positions': //Обновление позиции объектов
                        getPosition(json);
                        break;
                    case 'update_map': //Обновление карты
                        guiMapParams.selectedMap = json.name;
                        dropDownMap.setValue(json.name);
                        switchMap();
                        break;
                    case 'update_cam': //обновление камеры
                        viewOptions.view = json.name;
                        switchCamera();
                        viewSlider.setValue(json.name);
                        break;
                }

            } catch (error) {
                console.error('Error parsing JSON from socket.io server:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from socket.io server');
        });
    }
});

let vectorPointRouteArray = []; //Массив точек маршрута
let airplaneModel; //Модель самолета
let lastTime = Date.now(); //Текушее время для вычисления скорости
let currentIndex = 0; //Точка в которой самолет находится в данный момент

//Функция при получнии json с объектом
function getObject(jsonData) {
    LoadModel(jsonData);
}

//функция при получении json с маршрутами
function getPath(jsonData) {

    jsonData.paths.forEach(path => {
        const id = path.id;
        const isRemove = path.isRemove;
        console.log("id:", id, "isRemove:", isRemove);
        if (scene.getObjectByName(id)) {
            if (isRemove) {
                scene.remove(scene.getObjectByName(id));
            }
        }
        else {
            if (!isRemove) {
                vectorPointRouteArray = [];
                currentIndex = 0;

                for (const position of path.positions) {
                    const converter = new CoordinatesConverter(position.lat, position.lon, position.alt);
                    const converterCoordinates = converter.convertCoordinates();

                    const vector3 = new THREE.Vector3(
                        parseFloat(converterCoordinates.x).toFixed(2),
                        parseFloat(position.alt),
                        parseFloat(converterCoordinates.z).toFixed(2)
                    );
                    vectorPointRouteArray.push(vector3);
                }

                // //задаем начальное положение самолета
                // airplaneModel.position.y = parseFloat(intitialY);
                // airplaneModel.position.x = parseFloat(intitialX);
                // airplaneModel.position.z = parseFloat(intitialZ);

                // Создание геометрии линии с использованием точек маршрута
                const lineGeometry = new THREE.BufferGeometry().setFromPoints(vectorPointRouteArray);

                // Материал для линии (например, красный цвет)
                const lineMaterial = new THREE.LineBasicMaterial({ color: path.color, linewidth: 2});

                // Создание линии с использованием геометрии и материала
                const line = new THREE.Line(lineGeometry, lineMaterial);

                line.name = id;

                // Добавление линии в сцену
                scene.add(line);
                console.log(vectorPointRouteArray);

                //запуск анимации
                // updateAirplane();
            }
        }
    });
};

//Функция получения позиции
function getPosition(jsonData) {
    jsonData.positions.forEach(position => {
        if(scene.getObjectByName(position.id))
        {
            const converter = new CoordinatesConverter(position.lat, position.lon, position.alt);
            const converterCoordinates = converter.convertCoordinates();
            scene.getObjectByName(position.id).position.x = parseFloat((converterCoordinates.x).toFixed(2));
            scene.getObjectByName(position.id).position.y = parseFloat((position.alt).toFixed(2));
            scene.getObjectByName(position.id).position.z = parseFloat((converterCoordinates.z).toFixed(2));
    
            // Установка углов поворота через кватернион
            const quaternion = new THREE.Quaternion();
            quaternion.setFromEuler(new THREE.Euler(
                THREE.MathUtils.degToRad(position.pitch),  // тангаж
                THREE.MathUtils.degToRad(position.yaw),    // рыскание
                THREE.MathUtils.degToRad(position.roll),   // крен
                'XYZ'
            ));
            scene.getObjectByName(position.id).quaternion.copy(quaternion); 
            sky.position.copy(scene.getObjectByName(position.id).position);
        }
    })
}

//Английская раскладка
const keysEN = {
    w: false, //Скорсть+
    s: false, //Скорость-
    a: false, //Рысканье(yaw) влево
    d: false, //Рысканье(yaw) вправо
    r: false, //Тангаж(pitch) вверх
    f: false, //Тангаж(pitch) вниз
    q: false, //Крен(roll) влево
    e: false, //Крен(roll) вправо
};
//Русская раскалдка
const keysRU = {
    ц: false, //Скорость+
    ы: false, //Скорость-
    ф: false, //Рысканье(yaw) влево
    в: false, //Рысканье(yaw) вправо
    к: false, //Тангаж(pitch) вверх
    а: false, //Тангаж(pitch) вниз
    й: false, //Крен(roll) влево
    у: false, //Крен(roll) вправо
}

let viewSlider;
var viewOptions = { view: 'Third Person' };

let setRadiusCockpitCamera = 150; // Расстояние от камеры до самолета

document.addEventListener('wheel', (event) => {
    setRadiusCockpitCamera += event.deltaY * 0.1;
    setRadiusCockpitCamera = Math.max(50, Math.min(500, setRadiusCockpitCamera)); //Ограничение от 100 до 500
});

// Обработчик события нажатия клавиши
document.addEventListener('keydown', (event) => {
    handleKeyDown(event.key.toLowerCase()); // Вызываем функцию handleKeyDown с приведенным к нижнему регистру значением нажатой клавиши
    if (event.code === 'Digit1') {
        viewOptions.view = 'Third Person';
        switchCamera();
        viewSlider.setValue('Third Person');
    }

    if (event.code === 'Digit2') {
        viewOptions.view = 'Orbital';
        switchCamera();
        viewSlider.setValue('Orbital');
    }
    
    if(event.code === 'Digit3') {
        viewOptions.view = 'FreeCam';
        switchCamera();
        viewSlider.setValue('FreeCam');
    }
});

// Обработчик события отпускания клавиши
document.addEventListener('keyup', (event) => {
    handleKeyUp(event.key.toLowerCase()); // Вызываем функцию handleKeyUp с приведенным к нижнему регистру значением отпущенной клавиши
});

// Функция обработки нажатия клавиши
function handleKeyDown(key) {
    if (keysEN.hasOwnProperty(key)) {
        keysEN[key] = true; // Устанавливаем флаг в true для соответствующей клавиши в объекте keysEN
    }
    if (keysRU.hasOwnProperty(key)) {
        keysRU[key] = true; // Устанавливаем флаг в true для соответствующей клавиши в объекте keysRU
    }
}

// Функция обработки отпускания клавиши
function handleKeyUp(key) {
    if (keysEN.hasOwnProperty(key)) {
        keysEN[key] = false; // Устанавливаем флаг в false для соответствующей клавиши в объекте keysEN
    }
    if (keysRU.hasOwnProperty(key)) {
        keysRU[key] = false; // Устанавливаем флаг в false для соответствующей клавиши в объекте keysRU
    }
}

var heightMap;
var textureMap;

//сцена
const scene = new THREE.Scene();
const canvas = document.querySelector('.canvas');
const secondCanvas = document.querySelector('.secondCanvas')

scene.fog = new THREE.Fog(0xaaccff, 4000, 10000);

//вывод осей для помощи ориентирования
const axesHelper = new THREE.AxesHelper(600);
scene.add(axesHelper);





//Панель дебагинг
const gui = new dat.GUI({
    closeFolders: false,
    title: 'Settings'
});

function initSky() {

    // Add Sky
    sky = new Sky();
    sky.scale.setScalar( 450000 );
    scene.add( sky );

    sun = new THREE.Vector3();

    /// GUI

    const effectController = {
        turbidity: 2.8,
        rayleigh: 0.45,
        mieCoefficient: 0.001,
        mieDirectionalG: 0.73,
        elevation: 2,
        azimuth: 180,
        exposure: renderer.toneMappingExposure
    };

    function guiChanged() {

        const uniforms = sky.material.uniforms;
        uniforms[ 'turbidity' ].value = effectController.turbidity;
        uniforms[ 'rayleigh' ].value = effectController.rayleigh;
        uniforms[ 'mieCoefficient' ].value = effectController.mieCoefficient;
        uniforms[ 'mieDirectionalG' ].value = effectController.mieDirectionalG;

        const phi = THREE.MathUtils.degToRad( 90 - effectController.elevation );
        const theta = THREE.MathUtils.degToRad( effectController.azimuth );

        sun.setFromSphericalCoords( 1, phi, theta );

        uniforms[ 'sunPosition' ].value.copy( sun );

        renderer.toneMappingExposure = effectController.exposure;
        renderer.render( scene, camera );

    }

    //skyFolder.add( effectController, 'turbidity', 0.0, 20.0, 0.1 ).onChange( guiChanged );
    //skyFolder.add( effectController, 'rayleigh', 0.0, 10, 0.001 ).onChange( guiChanged );
    //skyFolder.add( effectController, 'mieCoefficient', 0.0, 0.1, 0.001 ).onChange( guiChanged );
    //skyFolder.add( effectController, 'mieDirectionalG', 0.0, 1, 0.001 ).onChange( guiChanged );
    skyFolder.add( effectController, 'elevation', 0, 90, 0.1 ).onChange( guiChanged );
    skyFolder.add( effectController, 'azimuth', - 180, 180, 0.1 ).onChange( guiChanged );
    //skyFolder.add( effectController, 'exposure', 0, 1, 0.0001 ).onChange( guiChanged );

    guiChanged();

}


const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    widthSC: secondCanvas.innerWidth,
    heightSC: secondCanvas.innerHeight,
};

var secondOptions = {
    showSecondCanvas: false,
    autoFly: false,
    manualСontrol: false,
    showStats: true,
    showCoords: true,
    FPS: 60
};

const sliders = {
    widthSeg: 100,
    heightSeg: 100,
    heightMap: '',
    horTexture: 1,
    vertTexture: 1,
    dispScale: 2000,
    distance: 5000, //дистаниция прорисовки
};

const guiObjectParams = {
    selectedOptions: 'empty',
    options: [],
}

/*
    Создание камер
    camera - камера от третьего лица
    orbitalCamera - камера с вращением
    firstCamera - камера из кабины
    activeCamera - активная камера
*/
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 1, sliders.distance);
camera.position.set(0, 100, -100);
let activeCamera = camera; //Начальная камера от третьего лица

const orbitalCamera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 1, sliders.distance); //Камера для вращения во круг объекта
orbitalCamera.position.set(0, 100, -100);
const controls = new OrbitControls(orbitalCamera, canvas)
controls.enabled = false;

const cameraFirst = new THREE.PerspectiveCamera( 75, sizes.width / sizes.height, 1, sliders.distance); //камера для свободного полета
cameraFirst.position.set(0, 100, -100);
const controlsFirst = new FlyControls(cameraFirst, canvas);
controlsFirst.movementSpeed = 500;
controlsFirst.autoForward = false;
controlsFirst.dragToLook = true;
controlsFirst.rollSpeed = 0.87266;
controlsFirst.enabled = false;

//const firstCamera = new THREE.PerspectiveCamera(75, 400 / 250, 1, sliders.distance);
//firstCamera.position.set(0, 30, -60);

//scene.add(firstCamera);
scene.add(activeCamera);



gui.add(sliders, 'distance').min(200).max(10000).step(5).name('Draw distance').onChange(updateCamera); //Изменение дистанции прорисовки

gui.add(secondOptions, 'FPS').min(10).max(120).step(1).name('FPS').onChange(updateFPS);

const dropDownObj = gui.add(guiObjectParams, 'selectedOptions', guiObjectParams.options).name('Select object').onChange(switchObject);
function switchObject()
{
    if(guiObjectParams.selectedOptions != 'empty')
    {
        airplaneModel = scene.getObjectByName(guiObjectParams.selectedOptions);
        const newPosition = airplaneModel.position;
        const newRotation = airplaneModel.quaternion;
        thirdPersonCamera.setCameraTarget(newPosition, newRotation); 
        sky.position.copy(airplaneModel.position);
    }
}

const dropDownMap = gui.add(guiMapParams, 'selectedMap', guiMapParams.mapOptions).name('Select map').onChange(switchMap); //выбор карты
function switchMap() {
    var selectedM = guiMapParams.selectedMap;
    if (selectedM !== 'Plane' && selectedM !== 'Water') {
        console.log(selectedM);
        for (var i = 0; i < jsonMap.length; i++) {
            if (jsonMap[i].name === selectedM) {
                heightMap = jsonMap[i].pathHeightMap;
                textureMap = jsonMap[i].pathTextureMap;
                console.log("Height Map: " + heightMap);
                console.log("Texture Map: " + textureMap);
                break;
            }
        }
    }
    createGround();
    updateTerrainChunksGeometryAndMaterial();
}

function addOption(newOption) {
    guiObjectParams.options.push(newOption);
    dropDownObj.options(guiObjectParams.options); // Обновляем список в выпадающем списке
}
function removeOption(optionToRemove) {
    const index = guiObjectParams.options.indexOf(optionToRemove);
    if (index !== -1) {
        guiObjectParams.options.splice(index, 1); // Удаляем элемент из массива
        dropDownObj.options(guiObjectParams.options); // Обновляем список в выпадающем списке
    }
    // Если список пустой, выставляем выбранное значение в null или пустую строку
    if (guiObjectParams.options.length === 0) {
        dropDownObj.setValue('empty');

    }
}

const cameraFolder = gui.addFolder('Cameras');
const interfaceFolder = gui.addFolder('Interface').open(false);
const skyFolder = gui.addFolder('Sky').open(false);
const experementalFolder = gui.addFolder('Experemental').open(false);
experementalFolder.add(secondOptions, 'autoFly').name('Automatic flight').onChange(automaticFlight);
function automaticFlight() {
    if(secondOptions.autoFly) {
        updateAirplane();
        secondOptions.manualСontrol = false;
        experementalFolder.controllers[1].setValue(false);
    }
}

experementalFolder.add(secondOptions, 'manualСontrol').name('Manual control').onChange(mlСontrol);
function mlСontrol() {
    if(secondOptions.manualСontrol) {
        updateAirplane();
        secondOptions.autoFly = false;
        experementalFolder.controllers[0].setValue(false);
    }
}

//Скрыть/Показать статистику
interfaceFolder.add(secondOptions, 'showStats').name('Show stats').onChange(showStats);
function showStats() {
    stats.dom.style.display = secondOptions.showStats ? 'block' : 'none';
}

//Скрыть/Показать координаты
interfaceFolder.add(secondOptions, 'showCoords').name('Show coordinates').onChange(showCoordinates);
function showCoordinates() {
    document.getElementById('textContainer').style.display = secondOptions.showCoords ? 'block' : 'none';
}

viewSlider = cameraFolder.add(viewOptions, 'view', ['Third Person', 'Orbital', 'FreeCam']).name('View').onChange(switchCamera);
//cameraFolder.add(secondOptions, 'showSecondCanvas').name("Cockpit camera").onChange(handleCheckboxChange);
function handleCheckboxChange(value) {
    if (secondCanvas) {
        secondCanvas.style.display = value ? 'block' : 'none';
    }
};

function updateFirstPersonCamera() {
    camera.position.copy(airplaneModel.position);
    camera.rotation.copy(airplaneModel.rotation);
}

//Функция обновления отрисовки поверхности
function updateCamera() {
    // Обновление far параметра камеры при изменении значения в GUI
    //firstCamera.far = sliders.distance;
    activeCamera.far = sliders.distance;
    activeCamera.updateProjectionMatrix();
    //firstCamera.updateProjectionMatrix();
}

//Функция переключения камеры
function switchCamera(view) {
    if (viewOptions.view === 'Third Person') {
        activeCamera = camera;
        controls.enabled = false;
        controlsFirst.enabled = false;
        updateCamera();

    } else if (viewOptions.view === 'Orbital') {
        activeCamera = orbitalCamera;
        controls.enabled = true;
        controlsFirst.enabled = false;

        orbitalCamera.position.copy(camera.position);
        orbitalCamera.rotation.copy(camera.rotation);

        controls.target.copy(airplaneModel.position);
        updateCamera();
    } else if(viewOptions.view === 'FreeCam') {
        controlsFirst.enabled = true;
        activeCamera = cameraFirst;
        cameraFirst.position.copy(camera.position);
        updateCamera()
    }
    // Обновление текущей активной камеры
    updateActiveCamera();
}

//Функция обновления активной камеры
function updateActiveCamera() {
    activeCamera.aspect = sizes.width / sizes.height;
    activeCamera.updateProjectionMatrix();
}


let anim = false;
//Метод загрузки модели
function LoadModel(jsonData) {
    jsonData.objects.forEach(object => {
        const id = object.id;
        const isRemove = object.isRemove;
        const type = object.type;
        console.log("id:", id, "isRemove:", isRemove);
        if (scene.getObjectByName(id)) {
            if (isRemove) {
                scene.remove(scene.getObjectByName(id));
                removeOption(id);
            }
        }
        else {
            if (!isRemove) {
                for (var i = 0; i < jsonObject.length; i++) {
                    if (jsonObject[i].type === type) {
                        FBXLoadMod(jsonObject[i], id)
                        break;
                    }
                }
            }
        }
    });
}

function FBXLoadMod(jsonObject, id)
{
    const loader = new FBXLoader(); //Создание FBX загрузчика 
    console.log(jsonObject);
    loader.load(jsonObject.path, (fbx) => { // Загрузка FBX
        fbx.traverse(c => {
            if (c.isMesh) {
                c.castShadow = true;
            }
        });
        fbx.position.y = 500;
        fbx.position.x = 0;
        fbx.position.z = 0;
        fbx.rotation.set(jsonObject.rotationX, jsonObject.rotationY, jsonObject.rotationZ)
        fbx.scale.set(jsonObject.scale, jsonObject.scale, jsonObject.scale);
        fbx.name = id;
        airplaneModel = fbx;
        scene.add(fbx);

        const thirdPersonCamera = new ThirdPersonCamera({
            camera: camera,
            target: {
                Position: fbx.position,
                Rotation: fbx.quaternion,
            },
        });

        window.thirdPersonCamera = thirdPersonCamera;
        //fbx.add(firstCamera);
        addOption(id);
        dropDownObj.setValue(id);
        if (!anim) {
            animate();
            anim = true;
        }
    });
}

let groundGeo; let groundMesh;
let groundMaterial; //материал поверхности
const terrainChunks = new Map();

function createGround() {

    if (guiMapParams.selectedMap === 'Plane') {
        // Создаем геометрию плоскости
        groundGeo = new THREE.PlaneGeometry(15000, 15000, 10, 10); // Ширина, высота, сегменты
        // Создаем материал для плоскости
        groundMaterial = new THREE.MeshStandardMaterial({ color: 0xA5A5A5, side: THREE.DoubleSide });
    }
    else {
        groundGeo = new THREE.PlaneGeometry(15000, 15000, sliders.widthSeg, sliders.heightSeg)
        let disMap = new THREE.TextureLoader()
            .setPath('/textures/map/') //heightmap folder
            .load(heightMap); //heightmap filename from dat.gui choice

        //horizontal vertical texture can repeat on object surface
        disMap.wrapS = disMap.wrapT = THREE.RepeatWrapping;
        disMap.repeat.set(sliders.horTexture, sliders.vertTexture); //# horizontal & vertical textures

        //Текстуры
        let mapTexture = new THREE.TextureLoader().setPath('/textures/map/').load(textureMap);
        mapTexture.wrapS = mapTexture.wrapT = THREE.RepeatWrapping;
        mapTexture.repeat.set(sliders.horTexture, sliders.vertTexture);
        groundMaterial = new THREE.MeshStandardMaterial({
            displacementMap: disMap,
            displacementScale: sliders.dispScale,
            map: mapTexture,
        });
    }


    // Создание экземпляра InstancedMesh для повторяющихся поверхностей
    groundMesh = new THREE.InstancedMesh(groundGeo, groundMaterial, 1);
    groundMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    groundMesh.rotation.x = -Math.PI / 2;
}

createGround();

// Функция создания чанка
function createTerrainChunk(position, name) {
    let newChunk;
    if (guiMapParams.selectedMap === 'Water') {
        const waterGeometry = new THREE.PlaneGeometry(15000, 15000);
        newChunk = new Water(
            waterGeometry,
            {
                textureWidth: 512,
                textureHeight: 512,
                waterNormals: new THREE.TextureLoader().load('textures/waternormals.jpg', function ( texture ) {

                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

                } ),
                sunDirection: new THREE.Vector3(),
                sunColor: 0x00ffff,
                waterColor: 0x001e0f,
                distortionScale: 3.7,
                //fog: scene.fog,
            }
        );
        newChunk.position.y = 1;
        newChunk.rotation.x = Math.PI * -0.5;
    } else {
        newChunk = groundMesh.clone();
    }

    newChunk.position.copy(position);
    newChunk.name = name;
    scene.add(newChunk);

    // Добавляем чанк в коллекцию Map
    terrainChunks.set(name, { chunk: newChunk, position: new THREE.Vector3().copy(position) });

    return newChunk;
}

// Функция обновления положения чанков
function updateTerrainChunks() {
    const chunkSize = 15000; // Размер чанка
    const chunkRadius = 1; // Радиус обновляемой области в чанках
    const chunkStep = chunkSize; // Расстояние между центрами чанков

    // Определение центральной позиции чанка, в котором находится самолет
    const airplanePositionX = Math.round(airplaneModel.position.x / chunkSize) * chunkSize;
    const airplanePositionZ = Math.round(airplaneModel.position.z / chunkSize) * chunkSize;

    // Перебор чанков в области
    for (let x = -chunkRadius; x <= chunkRadius; x++) {
        for (let z = -chunkRadius; z <= chunkRadius; z++) {
            // Формирование ключа для чанка на основе его позиции
            const chunkKey = `${airplanePositionX + x * chunkStep}_${airplanePositionZ + z * chunkStep}`;
            // Рассчет позиции чанка в пространстве
            const chunkPosition = new THREE.Vector3(airplanePositionX + x * chunkStep, 0, airplanePositionZ + z * chunkStep);

            // Проверка, существует ли чанк по данному ключу
            if (!terrainChunks.has(chunkKey)) {
                // Если чанк не существует, создаем его
                const newChunk = createTerrainChunk(chunkPosition, chunkKey);
                terrainChunks.set(chunkKey, { chunk: newChunk, position: new THREE.Vector3().copy(chunkPosition) });
            }
        }
    }

    // Массив для хранения ключей чанков, которые нужно удалить
    const chunksToDelete = [];

    const chunkRaduisSquared = (chunkRadius * chunkStep) ** 2

    // Проверка дистанции между самолетом и чанками, и добавление к удалению, если дистанция слишком большая
    for (const [key, { chunk, position }] of terrainChunks) {
        const distanceSquared = airplaneModel.position.distanceToSquared(position);
        if (distanceSquared > chunkRaduisSquared) {
            chunksToDelete.push(key);
        }
    }

    // Удаление чанков, которые не подходят под радиус обновления
    chunksToDelete.forEach(key => {
        const { chunk } = terrainChunks.get(key);
        removeChunk(key);
        terrainChunks.delete(key);
    });
}

// Функция удаления чанка по ключу
function removeChunk(chunkKey) {
    // Получение чанка и его позиции по ключу
    const { chunk, position } = terrainChunks.get(chunkKey);

    // Освобождение памяти от геометрии и материалов всех объектов внутри чанка
    chunk.traverse(object => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) object.material.dispose();
    });

    // Удаление чанка со сцены и из коллекции
    scene.remove(chunk);
    terrainChunks.delete(chunkKey);
}

function updateTerrainChunksGeometryAndMaterial() {
    // Удаление старых объектов newChunk
    terrainChunks.forEach(({ chunk }) => {
        scene.remove(chunk);
    });

    // Очистка коллекции terrainChunks
    terrainChunks.clear();

    updateTerrainChunks();
}


// //полусферический источник света
const henLight = new THREE.AmbientLight(0xffffff, 1);
henLight.position.set(100, 250, 100);
scene.add(henLight);

// //напрвленный источник света
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
scene.add(dirLight);

const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(sizes.width, sizes.height);
renderer.render(scene, activeCamera);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;

const rendererSecondCanvas = new THREE.WebGLRenderer({ canvas: secondCanvas });
rendererSecondCanvas.setSize(400, 250);
//rendererSecondCanvas.render(scene, firstCamera);

const clock = new THREE.Clock();

let airplaneSpeed = 4; // Скорость самолета
const yawSpeed = 0.01; // Скорость поворота (yaw)
const rollSpeed = 0.01; // Скорость перекачивания (roll)
const pitchSpeed = 0.01; // Скорость тангажа (pitch)
let minHeight = 0; // Минимальная высота (верхняя точка меша)
let maxHeight = 2000; // Максимальная высота
let tempObject = new THREE.Object3D();


function updateAirplane() {
    if (!airplaneModel) {
        console.error("airplaneModel is not defined");
        return;

    }
    if (airplaneSpeed == 0) {
        return;
    }

    if (secondOptions.autoFly) {
        if (vectorPointRouteArray.length > 1 && currentIndex < vectorPointRouteArray.length) {
            const currentPosition = airplaneModel.position;
            const targetPoint = vectorPointRouteArray[currentIndex];

            // Вычисляем вектор направления к целевой точке
            const directionToTarget = new THREE.Vector3().subVectors(targetPoint, currentPosition).normalize();

            // Устанавливаем направление вектора движения в сторону целевой точки
            const targetEuler = new THREE.Euler(0, Math.atan2(-directionToTarget.x, -directionToTarget.z), 0);
            // Используем линейную интерполяцию для плавного поворота
            const targetQuaternion = new THREE.Quaternion().setFromEuler(targetEuler);
            airplaneModel.quaternion.slerp(targetQuaternion, 0.1);

            // Задаем скорость перемещения (в единицах расстояния за секунду)
            const moveSpeed = 150; // Можно регулировать

            // Вычисляем расстояние до целевой точки
            const distanceToTarget = currentPosition.distanceTo(targetPoint);

            // Вычисляем изменение высоты
            const deltaHeight = targetPoint.y - currentPosition.y;
            // Задаем коэффициент для угла тангажа
            const pitchFactor = 0.1; // Можно регулировать
            // Рассчитываем угол тангажа
            const targetPitch = Math.atan2(deltaHeight, distanceToTarget) * pitchFactor;
            // Создаем кватернион для угла тангажа
            const pitchQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), targetPitch);
            // Применяем кватернион угла тангажа к текущему кватерниону
            airplaneModel.quaternion.multiply(pitchQuaternion);

            // Вычисляем угол крена
            const bankAngle = Math.atan2(-directionToTarget.y, Math.sqrt(directionToTarget.x ** 2 + directionToTarget.z ** 2));
            // Задаем коэффициент для угла крена
            const rollFactor = 0.1; // Можно регулировать
            // Рассчитываем угол крена
            const targetRoll = bankAngle * rollFactor;
            // Создаем кватернион для угла крена
            const rollQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), targetRoll);
            // Применяем кватернион угла крена к текущему кватерниону
            airplaneModel.quaternion.multiply(rollQuaternion);

            // Вычисляем дельту времени
            const currentTime = Date.now();
            const deltaTime = (currentTime - lastTime) / 1000; // переводим в секунды

            // Используем линейную интерполяцию для плавного перемещения
            const moveDistance = deltaTime * moveSpeed;

            // Если текущее расстояние больше, чем перемещение, продолжаем движение
            if (distanceToTarget > moveDistance) {
                currentPosition.add(directionToTarget.multiplyScalar(moveDistance));
            } else {
                // Достигли целевой точки, переходим к следующей
                currentIndex++;
            }

            if (currentIndex == vectorPointRouteArray.length) {
                currentIndex = 0;
            }
            // Обновляем время
            lastTime = currentTime;
        }
    } else if (secondOptions.manualСontrol) {
        const quaternion = new THREE.Quaternion();
        quaternion.setFromEuler(airplaneModel.rotation);


        // Движение вперед
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(quaternion);
        direction.multiplyScalar(airplaneSpeed);
        airplaneModel.position.add(direction);

        if (keysEN.w || keysRU.ц) {
            //Увеличение скорости
            if (airplaneSpeed <= 5)
                airplaneSpeed += 0.01;

        }

        if (keysEN.a || keysRU.ф) {
            // Поворот влево
            const yawQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yawSpeed);
            quaternion.multiply(yawQuaternion);
            airplaneModel.setRotationFromQuaternion(quaternion);
        }

        if (keysEN.d || keysRU.в) {
            // Поворот вправо
            const yawQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -yawSpeed);
            quaternion.multiply(yawQuaternion);
            airplaneModel.setRotationFromQuaternion(quaternion);
        }

        if (keysEN.s || keysRU.ы) {
            //Уменьшение скорости
            if (airplaneSpeed > 2) {
                airplaneSpeed -= 0.01;
            }
        }

        if (keysEN.r || keysRU.к) {
            // Поворот вверх (тангаж)
            const pitchQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitchSpeed);
            quaternion.multiply(pitchQuaternion);
            airplaneModel.rotation.setFromQuaternion(quaternion);
            airplaneSpeed -= 0.005;
        }

        if (keysEN.f || keysRU.а) {
            // Поворот вниз (тангаж)
            const pitchQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -pitchSpeed);
            quaternion.multiply(pitchQuaternion);
            airplaneModel.rotation.setFromQuaternion(quaternion);
            airplaneSpeed += 0.005;

        }

        if (keysEN.q || keysRU.й) {
            // Поворот влево (roll)
            const rollQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rollSpeed);
            const updatedQuaternion = new THREE.Quaternion().copy(quaternion).multiply(rollQuaternion);
            airplaneModel.rotation.setFromQuaternion(updatedQuaternion);
        }

        if (keysEN.e || keysRU.у) {
            // Поворот вправо (roll)
            const rollQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -rollSpeed);
            const updatedQuaternion = new THREE.Quaternion().copy(quaternion).multiply(rollQuaternion);
            airplaneModel.rotation.setFromQuaternion(updatedQuaternion);
        }


        // Проверка по низу
        if (airplaneModel.position.y < minHeight) {
            airplaneModel.position.y = minHeight;

            // Сохраняем текущую ориентацию и позицию
            tempObject.rotation.copy(airplaneModel.rotation);
            tempObject.position.copy(airplaneModel.position);

            // Устанавливаем целевой кватернион для выравнивания вверх
            const targetRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0); // например, выравниваем по горизонтали
            airplaneModel.setRotationFromQuaternion(targetRotation);

            // Восстанавливаем ориентацию и позицию
            airplaneModel.rotation.copy(tempObject.rotation);
            airplaneModel.position.copy(tempObject.position);
        }

        // Проверка по высоте
        if (airplaneModel.position.y > maxHeight) {
            airplaneModel.position.y = maxHeight;

            // Сохраняем текущую ориентацию и позицию
            tempObject.rotation.copy(airplaneModel.rotation);
            tempObject.position.copy(airplaneModel.position);

            // Устанавливаем целевой кватернион для выравнивания вниз
            const targetRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI); // например, выравниваем вниз
            airplaneModel.setRotationFromQuaternion(targetRotation);

            // Восстанавливаем ориентацию и позицию
            airplaneModel.rotation.copy(tempObject.rotation);
            airplaneModel.position.copy(tempObject.position);
        }
    }

    thirdPersonCamera.Update(clock.getDelta());
};

let relativeCameraPosition = new THREE.Vector3(0, 50, 200);

let desiredFPS = 60
function updateFPS(value) //метод изменения фпс
{
    desiredFPS = value;
}
let then = performance.now();
let elapsed;
//Главный метод обновления
const animate = () => {
    requestAnimationFrame(animate);
    if(controlsFirst.enabled) {
       controlsFirst.update(clock.getDelta()); 
    }
    const now = performance.now();
    elapsed = now - then;
    if (elapsed > 1000 / desiredFPS) {
        then = now - (elapsed % (1000 / desiredFPS));
        stats.begin();
        if (airplaneModel) {
            if (secondOptions.autoFly || secondOptions.manualСontrol) {
                updateAirplane();
            }
            updateTerrainChunks();
            thirdPersonCamera.Update(clock.getDelta());

            // Сохраняем текущую позицию относительно самолета
            relativeCameraPosition.copy(airplaneModel.position);

            // Обновляем относительную позицию камеры при вращении
            if (controls.enabled) {
                const spherical = new THREE.Spherical().setFromVector3(orbitalCamera.position.clone().sub(airplaneModel.position));
                spherical.radius = setRadiusCockpitCamera; // Расстояние от камеры до самолета

                // Применяем сферические координаты к позиции камеры
                orbitalCamera.position.copy(airplaneModel.position).add(new THREE.Vector3().setFromSpherical(spherical));
                controls.target.copy(airplaneModel.position);
            }
            controls.update();
        }
        renderer.render(scene, activeCamera);

        // if (secondOptions.showSecondCanvas) {
        //     rendererSecondCanvas.render(scene, firstCamera);
        //     updateFirstPersonCamera();
        //     console.log('active')
        // }

        stats.end();
        updateCoordinates();
    }
    //requestAnimationFrame(animate);
}

//skybox
var skybox = new THREE.CubeTextureLoader()
    .load([
        'textures/skybox/yonder_ft.jpg',
        'textures/skybox/yonder_bk.jpg',
        'textures/skybox/yonder_up.jpg',
        'textures/skybox/yonder_dn.jpg',
        'textures/skybox/yonder_rt.jpg',
        'textures/skybox/yonder_lf.jpg'
    ]);
//scene.background = skybox;

//Метод обновленния размера окна
window.addEventListener('resize', () => {
    // Обновляем размеры
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Обновляем соотношение сторон камеры
    activeCamera.aspect = sizes.width / sizes.height;
    activeCamera.updateProjectionMatrix();
    //firstCamera.updateProjectionMatrix();

    // Обновляем renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.render(scene, activeCamera);
});

let airplanePosition;
function updateCoordinates() {
    airplanePosition = airplaneModel.position

    // Обновление текста с координатами
    const textContainer = document.getElementById('textContainer');
    textContainer.innerText = `Height: ${airplanePosition.y.toFixed(2)}\n x: ${airplanePosition.x.toFixed(2)} z: ${airplanePosition.z.toFixed(2)}`;
}
initSky();