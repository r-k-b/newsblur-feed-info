/// <reference path="../typings/index.d.ts" />

import {test} from 'tape';
import {Observable} from 'rxjs';
import * as index from '../index';

test('readfile and rxjs', t => {
    t.equal(
        index.readFileStream('foo') instanceof Observable,
        true,
        'it should return an Observable'
    );

    t.end();
});
