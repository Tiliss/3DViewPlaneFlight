// Обновление пути, содержит все точки
class PathUpdate {
    constructor(what, paths) {
        this.what = what;
        this.paths = paths;
    }

    // Метод для извлечения координат из positions
    getCoordinates() {
        let coordinates = [];
        this.paths.forEach(path => {
            path.positions.forEach(position => {
                coordinates.push({
                    id: path.id,
                    isRemove: path.isRemove,
                    lat: position.lat,
                    lon: position.lon,
                    alt: position.alt
                });
            });
        });
        return coordinates;
    }
}

// Обновление объектов 
class ObjectUpdate {
    constructor(what, objects) {
        this.what = what;
        this.objects = objects;
    }

    getObjects() {
        return this.objects.map(object => ({
            id: object.id,
            type: object.type,
            isRemove: object.isRemove
        }));
    }
}

// Обновление положения обьектов, отправляется каждый раз  
class PositionUpdate {
    constructor(what, positions) {
        this.what = what;
        this.positions = positions;
    }

    getPositions() {
        return this.positions.map(position => ({
            id: position.id,
            lat: position.lat,
            lon: position.lon,
            alt: position.alt,
            roll: position.roll,
            pitch: position.pitch,
            yaw: position.yaw
        }));
    }
}

// Экспорт функций для использования в других скриптах
export { PathUpdate, ObjectUpdate, PositionUpdate };