import { Product } from '../../../../../generated/catalog_pb';

/**
 */
export interface Resolver {
    resolveAttribute(product: Product, attribute: string, context: {}): any[];
}
