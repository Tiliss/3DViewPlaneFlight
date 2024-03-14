import * as THREE from 'three'

/**
 * Класс для создания камеры третьего лица.
 */
class ThirdPersonCamera {
    /**
     * Создает экземпляр камеры третьего лица.
     * @param {object} params - Параметры камеры.
     * @param {THREE.Camera} params.camera - Камера, которой управляет этот объект.
     */
    constructor(params) {
        this._params = params;
        this._camera = params.camera;
        this._currentPosition = new THREE.Vector3();
        this._currentLookat = new THREE.Vector3();
    }

    /**
     * Устанавливает цель камеры.
     * @param {THREE.Vector3} position - Позиция цели камеры.
     * @param {THREE.Quaternion} rotation - Вращение цели камеры.
     */
    setCameraTarget(position, rotation) {
        this._params.target.Position = position;
        this._params.target.Rotation = rotation;
    }

    /**
     * Рассчитывает идеальное смещение камеры относительно цели.
     * @returns {THREE.Vector3} - Идеальное смещение камеры.
     */
    _CalculateIdealOffset() {
        const idealOffset = new THREE.Vector3(0, -40, -100); // Изменено начальное положение (переместилось назад)
        idealOffset.applyQuaternion(this._params.target.Rotation);
        const offsetPosition = new THREE.Vector3().copy(this._params.target.Position).sub(idealOffset);
        return offsetPosition;
    }

    /**
     * Рассчитывает идеальную точку обзора камеры.
     * @returns {THREE.Vector3} - Идеальная точка обзора камеры.
     */
    _CalculateIdealLookat() {
        const lookatPosition = new THREE.Vector3(0, 50, 0);
        lookatPosition.applyQuaternion(this._params.target.Rotation);
        const lookat = new THREE.Vector3().copy(this._params.target.Position).add(lookatPosition);
        return lookat;
    }

    /**
     * Обновляет положение и обзор камеры.
     * @param {number} timeElapsed - Прошедшее время с предыдущего обновления.
     */
    Update(timeElapsed) {
        const idealOffset = this._CalculateIdealOffset();
        const idealLookat = this._CalculateIdealLookat();

        const t = 2.0 - Math.pow(0.001, timeElapsed);

        this._currentPosition.lerp(idealOffset, t);
        this._currentLookat.lerp(idealLookat, t);

        this._camera.position.copy(this._currentPosition);
        this._camera.lookAt(this._currentLookat);
    }
}

export { ThirdPersonCamera }
