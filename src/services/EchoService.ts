import { credentials } from 'grpc';
import { assert } from '../assert';
import { promisify } from 'util';
import { EchoRequest } from '../../generated/echo_pb';
import { EchoClient } from '../../generated/echo_grpc_pb';

type EchoServiceOpts = {
    host: string;
    port: number;
};

/**
 * @summary Interacts with the Echo API in Magento Core
 */
export class EchoService {
    private client: EchoClient;

    constructor({ host, port }: EchoServiceOpts) {
        const address = `${host}:${port}`;
        const insecureCredentialsFixThis = credentials.createInsecure();
        this.client = new EchoClient(address, insecureCredentialsFixThis);
    }

    async greet(name: string) {
        const { client } = this;
        const message = new EchoRequest();
        message.setName(name);

        // TODO: Don't promisify on every invocation. Find more
        // general solution for all gRPC method fixtures
        const greet = promisify(client.greet.bind(client));
        const result = await greet(message);
        assert(result, 'Expected result from greet unary call');

        return result.getGreeting();
    }
}
