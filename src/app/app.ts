import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';

// const userRoute = require('./routes/user');
// import * as userRoute from './routes/user';
import logger from '../utils/logger';

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));

// app.use('/api/user', userRoute as express.Router);

app.listen(3000, () => {
    logger.info(`Server is listening at port 3000`);
});

export default app;
