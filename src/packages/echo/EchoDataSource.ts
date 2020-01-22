import { GRPCDataSource } from '../../GRPCDataSource';
import { EchoClient } from '../../../generated/echo_grpc_pb';
import { EchoRequest } from '../../../generated/echo_pb';
import { promisify } from 'util';
import { assert } from '../../assert';
import { credentials } from 'grpc';

type EchoDataSourceOpts = {
    echoClient: EchoClient;
};

type ClientOpts = {
    host: string;
    port: number;
};

/**
 * @summary Apollo Server DataSource for Echo API
 */
export class EchoDataSource extends GRPCDataSource<EchoClient> {
    static createClient(opts: ClientOpts) {
        return new EchoClient(
            `${opts.host}:${opts.port}`,
            credentials.createInsecure(),
        );
    }

    constructor(opts: EchoDataSourceOpts) {
        super(opts.echoClient);
        this.client = opts.echoClient;
    }

    async greet(name: string) {
        const { client } = this;
        const message = new EchoRequest();
        message.setName(name);

        const greet = promisify(client.greet.bind(client));
        const result = await greet(message);
        assert(result, 'Expected result from greet unary call');

        return result.getGreeting();
    }
}
