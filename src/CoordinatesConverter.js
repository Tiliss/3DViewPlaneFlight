/**
 * Класс CoordinatesConverter предоставляет методы для преобразования географических координат (широты, долготы, высоты) в трехмерные координаты.
 */
class CoordinatesConverter {
    /**
     * Создает экземпляр класса CoordinatesConverter с указанными значениями широты, долготы и высоты.
     * @param {number} latitude - Широта в градусах.
     * @param {number} longitude - Долгота в градусах.
     * @param {number} altitude - Высота в метрах.
     */
    constructor(latitude, longitude, altitude) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.altitude = altitude;
    }

    /**
     * Метод для преобразования географических координат в трехмерные координаты.
     * @returns {Object}  Объект с трехмерными координатами x, y, z.
     */
    convertCoordinates() {
        const radius = 6371000; // Радиус Земли в метрах

        // Преобразование географических координат в радианы
        const latRad = (this.latitude * Math.PI) / 180;
        const lonRad = (this.longitude * Math.PI) / 180;

        // Вычисление координат x, y, z
        const x = radius * Math.cos(latRad) * Math.cos(lonRad);
        const y = this.altitude;
        const z = radius * Math.cos(latRad) * Math.sin(lonRad);

        return { x, y, z };
    }
}

export { CoordinatesConverter };
