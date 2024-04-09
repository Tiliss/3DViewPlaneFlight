import * as THREE from 'three';

// Действия для управления камерой
const FORWARD = 1 << 0;
const LEFT = 1 << 1;
const RIGHT = 1 << 2;
const BACK = 1 << 3;
const UP = 1 << 4;
const DOWN = 1 << 5;
const SPRINT = 1 << 6;
const ROLL_LEFT = 1 << 7;
const ROLL_RIGHT = 1 << 8;

// Параметры по умолчанию
const MOVESPEED = 50;
const FRICTION = 0.9;
const LOOKSPEED = 0.01;
const SPRINTMULT = 2;
const KEYMAPPING = {
    87: 'FORWARD', /* W */
    83: 'BACK', /* S */
    65: 'LEFT', /* A */
    68: 'RIGHT', /* D */
    32: 'UP', /* Spacebar */
    67: 'DOWN', /* C */
    16: 'SPRINT', /* Shift */
    81: 'ROLL_LEFT', /* Q */
    69: 'ROLL_RIGHT', /* E */
};

/**
 * Класс SpectatorControls предоставляет управление камерой в режиме наблюдателя.
 */
export default class SpectatorControls {
    /**
     * Создает экземпляр SpectatorControls.
     * @param {THREE.Camera} camera - Камера, которой будет управлять SpectatorControls.
     * @param {object} options - Дополнительные параметры управления.
     * @param {number} options.lookSpeed - Скорость обзора камеры.
     * @param {number} options.moveSpeed - Скорость перемещения камеры.
     * @param {number} options.friction - Коэффициент трения для замедления движения камеры.
     * @param {object} options.keyMapping - Карта сопоставления клавиш и действий.
     * @param {number} options.sprintMultiplier - Множитель скорости при спринте.
     */
    constructor(camera, {
        lookSpeed = LOOKSPEED,
        moveSpeed = MOVESPEED,
        friction = FRICTION,
        keyMapping = KEYMAPPING,
        sprintMultiplier = SPRINTMULT
    } = {}) {
        this.camera = camera;
        this.lookSpeed = lookSpeed;
        this.moveSpeed = moveSpeed;
        this.friction = friction;
        this.sprintMultiplier = sprintMultiplier;
        this.keyMapping = Object.assign({}, KEYMAPPING, keyMapping);
        this.enabled = false;
        this._mouseState = { x: 0, y: 0 };
        this._keyState = { press: 0, prevPress: 0 };
        this._moveState = { velocity: new THREE.Vector3(0, 0, 0) };
        this._processMouseMoveEvent = this._processMouseMoveEvent.bind(this);
        this._processKeyEvent = this._processKeyEvent.bind(this);
    }

    /**
     * Обрабатывает событие движения мыши.
     * @param {MouseEvent} event - Событие движения мыши.
     * @private
     */
    _processMouseMoveEvent(event) {
        if (event.buttons != 0) {
            this._processMouseMove(
                event.movementX || event.mozMovementX || event.webkitMovementX,
                event.movementY || event.mozMovementY || event.webkitMovementY
            );
        }
    }

    /**
     * Обрабатывает движение мыши.
     * @param {number} x - Смещение по оси X.
     * @param {number} y - Смещение по оси Y.
     * @private
     */
    _processMouseMove(x = 0, y = 0) {
        this._mouseState = { x, y };
    }

    /**
     * Обрабатывает события клавиатуры.
     * @param {KeyboardEvent} event - Событие клавиатуры.
     * @private
     */
    _processKeyEvent(event) {
        this._processKey(event.keyCode, event.type === "keydown");
    }

    /**
     * Обрабатывает клавиши.
     * @param {number} key - Код клавиши.
     * @param {boolean} isPressed - Флаг нажатия клавиши.
     * @private
     */
    _processKey(key, isPressed) {
        const { press } = this._keyState;
        let newPress = press;
        switch (this.keyMapping[key]) {
            case 'FORWARD':
                isPressed ? newPress |= FORWARD : newPress &= ~FORWARD;
                break;
            case 'BACK':
                isPressed ? newPress |= BACK : newPress &= ~BACK;
                break;
            case 'LEFT':
                isPressed ? newPress |= LEFT : newPress &= ~LEFT;
                break;
            case 'RIGHT':
                isPressed ? newPress |= RIGHT : newPress &= ~RIGHT;
                break;
            case 'UP':
                isPressed ? newPress |= UP : newPress &= ~UP;
                break;
            case 'DOWN':
                isPressed ? newPress |= DOWN : newPress &= ~DOWN;
                break;
            case 'SPRINT':
                isPressed ? newPress |= SPRINT : newPress &= ~SPRINT;
                break;
            case 'ROLL_LEFT':
                isPressed ? newPress |= ROLL_LEFT : newPress &= ~ROLL_LEFT;
                break;
            case 'ROLL_RIGHT':
                isPressed ? newPress |= ROLL_RIGHT : newPress &= ~ROLL_RIGHT;
                break;
            default:
                break;
        }
        this._keyState.press = newPress;
    }

    /**
     * Включает управление камерой.
     */
    enable() {
        document.addEventListener('mousemove', this._processMouseMoveEvent);
        document.addEventListener('keydown', this._processKeyEvent);
        document.addEventListener('keyup', this._processKeyEvent);
        this.enabled = true;
        this.camera.rotation.reorder("YXZ");
    }

    /**
     * Отключает управление камерой.
     */
    disable() {
        document.removeEventListener('mousemove', this._processMouseMoveEvent);
        document.removeEventListener('keydown', this._processKeyEvent);
        document.removeEventListener('keyup', this._processKeyEvent);
        this.enabled = false;
        this._keyState.press = 0;
        this._keyState.prevPress = 0;
        this._mouseState = { x: 0, y: 0 };
        this.camera.rotation.reorder("XYZ");
    }

    /**
     * Проверяет, включено ли управление камерой.
     * @returns {boolean} - True, если управление камерой включено, иначе false.
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Освобождает ресурсы и отключает управление камерой.
     */
    dispose() {
        this.disable();
    }

    /**
     * Обновляет состояние камеры.
     * @param {number} delta - Прошедшее время с предыдущего обновления.
     */
    update(delta = 1) {
        if (!this.enabled) {
            // Завершаем переход движения
            if (this._moveState.velocity.length() > 0) {
                this._moveCamera(this._moveState.velocity);
            }
            return;
        }

        this._updateCameraRoll();
        // Углы обзора
        const actualLookSpeed = delta * this.lookSpeed;
        const lon = ((20 * this._mouseState.x) * actualLookSpeed);
        const lat = ((20 * this._mouseState.y) * actualLookSpeed);
        this.camera.rotation.x = Math.max(Math.min(this.camera.rotation.x - lat, Math.PI / 2), - Math.PI / 2);
        this.camera.rotation.y -= lon;
        this._mouseState = { x: 0, y: 0 };

        // Движения
        let actualMoveSpeed = delta * this.moveSpeed;
        const velocity = this._moveState.velocity.clone();
        const { press } = this._keyState;
        if (press & SPRINT) actualMoveSpeed *= this.sprintMultiplier;
        if (press & FORWARD) velocity.z = -actualMoveSpeed;
        if (press & BACK) velocity.z = actualMoveSpeed;
        if (press & LEFT) velocity.x = -actualMoveSpeed;
        if (press & RIGHT) velocity.x = actualMoveSpeed;
        if (press & UP) velocity.y = actualMoveSpeed;
        if (press & DOWN) velocity.y = -actualMoveSpeed;
        this._moveCamera(velocity);

        this._moveState.velocity = velocity;
        this._keyState.prevPress = press;
    }

    /**
     * Производит перемещение камеры на указанную скорость.
     * @param {THREE.Vector3} velocity - Вектор скорости перемещения.
     * @private
     */
    _moveCamera(velocity) {
        velocity.multiplyScalar(this.friction);
        velocity.clampLength(0, this.moveSpeed);
        this.camera.translateZ(velocity.z);
        this.camera.translateX(velocity.x);
        this.camera.translateY(velocity.y);
    }

    /**
     * Обновляет угол крена камеры в зависимости от клавиш крена.
     * @private
     */
    _updateCameraRoll() {
        const { press } = this._keyState;
        const rollSpeed = 0.01; // Скорость крена
        if (press & ROLL_LEFT) {
            this.camera.rotation.z += rollSpeed;
        }
        if (press & ROLL_RIGHT) {
            this.camera.rotation.z -= rollSpeed;
        }
    }

    /**
     * Привязывает клавишу к действию.
     * @param {number} key - Код клавиши.
     * @param {string} action - Действие, которое будет связано с клавишей.
     */
    mapKey(key, action) {
        this.keyMapping = Object.assign({}, this.keyMapping, { [key]: action });
    }

    /**
     * Обновляет скорость движения камеры.
     * @param {number} speed - Новая скорость движения.
     */
    speedUpdate(speed) {
        this.moveSpeed = speed;
    }

    /**
    * Устанавливает позицию и повороты камеры.
    * @param {number} x - Координата X.
    * @param {number} y - Координата Y.
    * @param {number} z - Координата Z.
    * @param {number} rotationX - Угол поворота по оси X в радианах.
    * @param {number} rotationY - Угол поворота по оси Y в радианах.
    * @param {number} rotationZ - Угол поворота по оси Z в радианах.
    */
    setPositionAndRotation(x, y, z, rotationX, rotationY, rotationZ) {
        this.camera.position.set(x, y, z);
        this.camera.rotation.set(rotationX, rotationY, rotationZ);
    }
}
