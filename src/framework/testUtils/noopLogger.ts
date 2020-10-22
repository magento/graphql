import { Writable } from 'stream';
import { createLogger } from '../logger';

const noopStream = new Writable({
    write(chunk, encoding, callback) {
        setImmediate(callback);
    },
});

export const noopLogger = createLogger({
    dest: noopStream,
    level: 'fatal',
});
