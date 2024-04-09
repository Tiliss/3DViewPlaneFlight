import * as THREE from 'three';

/**
 * Класс OrbitalControls предоставляет управление камерой вокруг модели в трехмерном пространстве.
 */
export default class OrbitalControls {
    /**
     * Создает экземпляр класса OrbitalControls.
     * @param {THREE.Camera} camera - Камера, которой будет управлять OrbitalControls.
     * @param {HTMLElement} canvas - HTML-элемент (canvas), на котором происходит взаимодействие с мышью.
     */
    constructor(camera, canvas) {
        this.camera = camera;
        this.canvas = canvas;
        
        // Параметры камеры по умолчанию
        this.cameraAngleX = Math.PI;
        this.cameraAngleY = Math.PI;
        this.cameraHeight = 100;
        this.setRadiusCockpitCamera = 100;

        // Флаги для управления состоянием камеры
        this.isDragging = false;
        this.isEnable = false;

        // Предыдущая позиция мыши
        this.previousMousePosition = { x: 0, y: 0 };

        // Установка начальной позиции камеры
        this.updateCamera();
        
        // Добавление обработчиков событий для мыши
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this), false);
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this), false);
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this), false);
    }

    /**
     * Устанавливает модель, вокруг которой будет вращаться камера.
     * @param {THREE.Object3D} model - Модель для управления камерой.
     */
    setModel(model) {
        this.airplaneModel = model;
    }

    /**
     * Устанавливает радиус вращения камеры.
     * @param {number} radius - Радиус вращения камеры.
     */
    setRadius(radius) {
        this.setRadiusCockpitCamera = radius;
    }

    /**
     * Обновляет позицию и направление камеры в соответствии с текущими параметрами.
     */
    updateCamera() {
        if (!this.airplaneModel || !this.setRadiusCockpitCamera) {
            console.error("Model and radius must be set before updating camera.");
            return;
        }

        var targetPosition = new THREE.Vector3(this.airplaneModel.position.x, this.airplaneModel.position.y, this.airplaneModel.position.z);

        var spherical = new THREE.Spherical(this.setRadiusCockpitCamera, this.cameraAngleY, this.cameraAngleX);
        var offsetVector = new THREE.Vector3().setFromSpherical(spherical);

        this.camera.position.copy(targetPosition).add(offsetVector);
        this.camera.lookAt(targetPosition);
    }

    /**
     * Обработчик события движения мыши.
     * @param {MouseEvent} event - Событие движения мыши.
     */
    onMouseMove(event) {
        if (this.isEnable && this.isDragging) {
            var rect = this.canvas.getBoundingClientRect();
            var canvasX = event.clientX - rect.left;
            var canvasY = event.clientY - rect.top;

            var deltaMove = {
                x: canvasX - this.previousMousePosition.x,
                y: canvasY - this.previousMousePosition.y
            };

            var sensitivity = 0.005; // Уменьшаем скорость передвижения камеры

            var deltaRotationQuaternion = new THREE.Quaternion()
                .setFromEuler(new THREE.Euler(
                    -deltaMove.y * sensitivity,
                    -deltaMove.x * sensitivity,
                    0,
                    'XYZ'
                ));

            this.camera.quaternion.multiplyQuaternions(deltaRotationQuaternion, this.camera.quaternion);
            this.cameraAngleX -= deltaMove.x * sensitivity; // Инвертирование поворота мышью
            this.cameraAngleY -= deltaMove.y * sensitivity; // Инвертирование поворота мышью

            // Ограничение по вращению
            this.cameraAngleY = Math.max(0.1, Math.min(Math.PI, this.cameraAngleY));

            this.updateCamera();
        }

        this.previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }

    /**
     * Обработчик события нажатия кнопки мыши.
     * @param {MouseEvent} event - Событие нажатия кнопки мыши.
     */
    onMouseDown(event) {
        if (this.isEnable && event.button === 0) { // Проверка, что нажата левая кнопка мыши
            var rect = this.canvas.getBoundingClientRect();
            var canvasX = event.clientX - rect.left;
            var canvasY = event.clientY - rect.top;
            if (canvasX >= 0 && canvasX <= this.canvas.width && canvasY >= 0 && canvasY <= this.canvas.height) {
                this.isDragging = true;
            }
        }
    }

    /**
     * Обработчик события отпускания кнопки мыши.
     * @param {MouseEvent} event - Событие отпускания кнопки мыши.
     */
    onMouseUp(event) {
        this.isDragging = false;
    }

    /**
     * Устанавливает новую позицию камеры.
     * @param {number} rotateXDegrees - Угол поворота по оси X в градусах.
     * @param {number} rotateYDegrees - Угол поворота по оси Y в градусах.
     */
    setCameraPosition(rotateXDegrees, rotateYDegrees) {
        // Преобразование углов из градусов в радианы
        var rotateX = THREE.MathUtils.degToRad(rotateXDegrees);
        var rotateY = THREE.MathUtils.degToRad(rotateYDegrees);

        // Применение углов к камере
        this.cameraAngleX = rotateX;
        this.cameraAngleY = rotateY;

        // Обновление позиции камеры
        this.updateCamera();
    }

    /**
     * Включает управление камерой.
     */
    enable() {
        this.isEnable = true;
    }

    /**
     * Выключает управление камерой.
     */
    disable() {
        this.isEnable = false;
    }

    /**
     * Проверяет, включено ли управление камерой.
     * @returns {boolean} - True, если управление камерой включено, иначе false.
     */
    isEnabled() {
        return this.isEnable;
    }
}
