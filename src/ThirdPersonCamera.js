import * as THREE from 'three'

//Класс для создания камеры третьего лица
class ThirdPersonCamera {
    constructor(params) {
        this._params = params;
        this._camera = params.camera;
        this._currentPosition = new THREE.Vector3();
        this._currentLookat = new THREE.Vector3();
    }

    setCameraTarget(position, rotation) {
        this._params.target.Position = position;
        this._params.target.Rotation = rotation;
    }

    _CalculateIdealOffset() {
        const idealOffset = new THREE.Vector3(0, -40, -100); // Изменено начальное положение (переместилось назад)
        idealOffset.applyQuaternion(this._params.target.Rotation);
        const offsetPosition = new THREE.Vector3().copy(this._params.target.Position).sub(idealOffset);
        return offsetPosition;
    }

    _CalculateIdealLookat() {
        const lookatPosition = new THREE.Vector3(0, 50, 0);
        lookatPosition.applyQuaternion(this._params.target.Rotation);
        const lookat = new THREE.Vector3().copy(this._params.target.Position).add(lookatPosition);
        return lookat;
    }

    Update(timeElapsed) {
        const idealOffset = this._CalculateIdealOffset();
        const idealLookat = this._CalculateIdealLookat();

        const t = 1.0 - Math.pow(0.001, timeElapsed);

        this._currentPosition.lerp(idealOffset, t);
        this._currentLookat.lerp(idealLookat, t);

        this._camera.position.copy(this._currentPosition);
        this._camera.lookAt(this._currentLookat);
    }
}
export { ThirdPersonCamera }