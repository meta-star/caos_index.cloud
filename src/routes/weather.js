"use strict";

// Import modules
const {StatusCodes} = require("http-status-codes");

// Import axios
const axios = require("axios");

// Import useApp, express
const {useApp, express} = require("../init/express");

const {useCache} = require("../init/cache");

const utilVisitor = require("../utils/visitor");
const utilNative = require("../utils/native");

// Create router
const {Router: newRouter} = express;
const router = newRouter();

const cache = useCache();

// Request body parser middleware
router.use(express.urlencoded({extended: true}));

const httpClient = {
    basic: axios.create({
        baseURL: "https://restapi.starinc.xyz",
    }),
    weather: axios.create({
        baseURL: "https://api.openweathermap.org/data",
    }),
};

const getIpLocation = async (ipAddr) => {
    try {
        const ipData = await httpClient.basic
            .get("basic/network/ip/geo", {
                params: {ip_addr: ipAddr},
            });
        return ipData?.data?.data?.location;
    } catch (e) {
        console.error(e);
        return null;
    }
};

const getWeatherData = async (locationData) => {
    try {
        return await httpClient.weather.get("2.5/weather", {
            params: {
                appid: process.env.OPENWEATHERMAP_API_KEY,
                lat: locationData.latitude,
                lon: locationData.longitude,
            },
        });
    } catch (e) {
        console.error(e);
        return null;
    }
};

router.get("/ip", async (req, res) => {
    const ipAddress = utilVisitor.getIPAddress(req);

    const cacheKey = `weather_ip_${ipAddress}`;
    if (cache.has(cacheKey)) {
        const result = cache.get(cacheKey);
        result.timestamp = utilNative.getPosixTimestamp();
        res.send(result);
        return;
    }

    const locationData = await getIpLocation(ipAddress);
    if (!locationData) {
        res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
        return;
    }

    const weatherData = await getWeatherData(locationData);
    if (!weatherData) {
        res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
        return;
    }

    const result = {
        weather: weatherData.data,
        network_timezone: weatherData?.time_zone,
    };
    cache.set(cacheKey, result, 60);

    result.timestamp = utilNative.getPosixTimestamp();
    res.send(result);
});


// Export routes mapper (function)
module.exports = () => {
    // Use application
    const app = useApp();

    // Mount the router
    app.use("/weather", router);
};
