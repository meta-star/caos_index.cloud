const {StatusCodes} = require('http-status-codes');
const {Router} = require('express');

const {create} = require('axios');
const ip_address = require('../../utils/ip_address');

const http_client = {
    basic: create({
        baseURL: 'https://restapi.starinc.xyz'
    }),
    weather: create({
        baseURL: 'https://api.openweathermap.org/data'
    }),
};

async function _getIpLocation(ip_addr) {
    try {
        const ip_data = await http_client.basic
            .get('basic/network/ip/geo', {
                params: {ip_addr}
            });
        return ip_data?.data?.data?.location;
    } catch (e) {
        console.error(e);
        return null;
    }
}

async function _getWeatherData(location_data) {
    try {
        return await http_client.weather.get('2.5/weather', {
            params: {
                appid: process.env.OPENWEATHERMAP_API_KEY,
                lat: location_data.latitude,
                lon: location_data.longitude,
            }
        });
    } catch (e) {
        console.error(e);
        return null;
    }
}

module.exports = (ctx, r) => {
    const router = Router();
    router.get('/ip', async (req, res) => {
        const ip_addr = process.env.NODE_ENV !== 'development' ? ip_address(req) : '1.1.1.1';
        const cache_key = `weather_ip_${ip_addr}`;
        if (ctx.cache.has(cache_key)) {
            const result = ctx.cache.get(cache_key);
            result.timestamp = ctx.now();
            res.send(result);
            return;
        }
        const location_data = await _getIpLocation(ip_addr);
        if (!location_data) {
            res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            return;
        }
        const weather_data = await _getWeatherData(location_data);
        if (!weather_data) {
            res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            return;
        }
        const result = {
            weather: weather_data.data,
            network_timezone: location_data?.time_zone
        };
        ctx.cache.set(cache_key, result, 60);
        result.timestamp = ctx.now();
        res.send(result);
    });
    r.use('/weather', router);
};
