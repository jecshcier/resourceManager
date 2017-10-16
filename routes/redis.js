const config = require(process.cwd() + '/config')
const Redis = require('ioredis');
const redis = new Redis(config.redisConfig.option);

module.exports = {
    set:(key, value, time) => {
        return redis.set(key, value,'EX', time);
    },
    get:(key) => {
        return redis.get(key)
    }
}


// Or using a promise if the last argument isn't a function
// redis.get('foo').then(function (result) {
//     console.log(result);
// });

// Arguments to commands are flattened, so the following are the same:
// redis.sadd('set', 1, 3, 5, 7);
// redis.sadd('set', [1, 3, 5, 7]);

// All arguments are passed directly to the redis server:
