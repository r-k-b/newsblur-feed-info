/// <reference path="typings/index.d.ts" />

import 'fs';
import {Observable} from 'rxjs';
import {parseString} from 'xml2js';

const readFileStream = (path: string) => Observable.of('x');

export {
    readFileStream
}