const {StatusCodes} = require('http-status-codes');
const {Router} = require('express');

const {create} = require('axios');
const ip_address = require('../../utils/ip_address');

const feature_router = Router();
const http_client = {
    basic: create({
        baseURL: 'https://restapi.starinc.xyz'
    }),
    weather: create({
        baseURL: 'https://api.openweathermap.org/data'
    }),
};

module.exports = (ctx, router) => {
    feature_router.get('/ip', async (req, res) => {
        const ip_addr = process.env.NODE_ENV !== 'development' ? ip_address(req) : '1.1.1.1';
        const ip_data = await http_client.basic.get('basic/network/ip/geo', {params: {ip_addr}});
        if (!ip_data?.data) {
            res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            return;
        }
        const location_data = ip_data.data?.data?.location;
        if (!location_data) {
            res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            return;
        }
        const weather_data = await http_client.weather.get('2.5/weather', {
            params: {
                appid: process.env.OPENWEATHERMAP_API_KEY,
                lat: location_data.latitude,
                lon: location_data.longitude,
            }
        });
        res.send({
            timestamp: ctx.now(),
            network_timezone: location_data?.time_zone,
            weather: weather_data.data
        });
    });
    router.use('/weather', feature_router);
};
