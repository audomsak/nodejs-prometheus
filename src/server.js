import express from 'express';
import pino from 'pino';
import expressPino from 'express-pino-logger';
import promClient from 'prom-client';
import regeneratorRuntime from "regenerator-runtime";
import responseTime from 'response-time'

const PORT = process.env.PORT || 8080;

const logger = pino({ level: process.env.LOG_LEVEL || 'info' })
const expressLogger = expressPino({ logger });

const app = express();
app.use(express.json(), expressLogger);

const collectDefaultMetrics = promClient.collectDefaultMetrics;

collectDefaultMetrics();

const Histogram = promClient.Histogram;

const requestDuration = new Histogram({
    name: 'http_request_duration_milliseconds',
    help: 'request duration histogram',
    labelNames: ['handler', 'method', 'statuscode'],
});


const appResponseTime = new Histogram({
    name: 'app_response_time',
    help: 'REST APIs response time in milliseconds',
    labelNames: ['method', 'route', 'status_code']
});

const requestCounter = new promClient.Counter({
    name: 'request_count',
    help: 'A counter of total requests',
    labelNames: ['api']
});

const profilerMiddleware = (req, res, next) => {
    const start = Date.now();
    res.once('finish', () => {
        const duration = Date.now() - start;
        requestDuration.labels(req.url, req.method, res.statusCode).observe(duration)
    });

    next();
};

app.use(profilerMiddleware);
app.use(responseTime((req, res, time) => {
    if (req.route.path) {
        appResponseTime.observe(
            {
                method: req.method,
                route: req.route.path,
                status_code: res.statusCode,
            },
            time
        )
    }
}));

app.get('/health', async (req, res) => {
    logger.debug('Calling res.send');
    return res.status(200).send({ message: "Health is good" });
});

app.get("/hello", async (req, res) => {
    requestCounter.inc({ api: 'hello' });
    res.json({ hello: "world" });
});

app.post("/bye", (req, res) => {
    requestCounter.inc({ api: 'bye' });
    res.send("POST Request : " + req);
});

// Setup server to Prometheus scrapes:
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', promClient.register.contentType);
        res.end(await promClient.register.metrics());
    } catch (ex) {
        res.status(500).end(ex);
    }
});

app.listen(PORT, () => {
    logger.info('App is listening for requests on port %d', PORT);
});