class CoordinatesConverter {
    constructor(latitude, longitude, altitude) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.altitude = altitude;
    }

    // Метод для преобразования широты и долготы в координаты x, y, z
    convertCoordinates() {
        const radius = 6371000; // Радиус Земли в метрах

        // Преобразование географических координат в радианы
        const latRad = (this.latitude * Math.PI) / 180;
        const lonRad = (this.longitude * Math.PI) / 180;

        // Вычисление координат x, y, z
        const x = (radius * Math.cos(latRad) * Math.cos(lonRad));
        const y = (this.altitude);
        const z = (radius * Math.cos(latRad) * Math.sin(lonRad));

        return { x, y, z };
    }
}
export { CoordinatesConverter };