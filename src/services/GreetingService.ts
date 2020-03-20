import { credentials } from 'grpc';
import { assert } from '../assert';
import { promisify } from 'util';
import { GreetingRequest } from '../../generated/greeting_pb';
import { GreetingClient } from '../../generated/greeting_grpc_pb';

type GreetingServiceOpts = {
    host: string;
    port: number;
};

/**
 * @summary Interacts with the Greeting API in Magento Core
 */
export class GreetingService {
    private client: GreetingClient;

    constructor({ host, port }: GreetingServiceOpts) {
        const address = `${host}:${port}`;
        const insecureCredentialsFixThis = credentials.createInsecure();
        this.client = new GreetingClient(address, insecureCredentialsFixThis);
    }

    async greet(name: string) {
        const { client } = this;
        const message = new GreetingRequest();
        message.setName(name);

        // TODO: Don't promisify on every invocation. Find more
        // general solution for all gRPC method fixtures
        const greet = promisify(client.greet.bind(client));
        const result = await greet(message);
        assert(result, 'Expected result from greet unary call');

        return result.getGreeting();
    }
}
