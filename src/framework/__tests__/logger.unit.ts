import { PassThrough } from 'stream';
import { createLogger } from '../logger';

test('Writes log when level threshold is met', () => {
    const out = new PassThrough({ encoding: 'utf8' });
    const logger = createLogger({
        level: 'info',
        dest: out,
    });

    logger.info('Test Message');
    const [firstLog] = (out.read() as string).split('\n');
    const { msg } = JSON.parse(firstLog);
    expect(msg).toBe('Test Message');
});

test('Does not write log when level threshold is not met', () => {
    const out = new PassThrough({ encoding: 'utf8' });
    const logger = createLogger({
        level: 'warn',
        dest: out,
    });

    logger.info('Test Message');
    expect(out.readableLength).toBe(0);
});
