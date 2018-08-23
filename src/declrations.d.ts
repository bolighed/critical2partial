//import { Critical } from './types';

declare module 'critical' {
    export function generate(option: any): PromiseLike<any>
}