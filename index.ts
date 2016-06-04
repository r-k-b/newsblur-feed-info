/// <reference path="typings/index.d.ts" />

import * as fs from 'fs';
import {merge, prop, curry} from 'ramda';
import * as Path from 'path';
import {Observable} from 'rxjs';
import {parseString} from 'xml2js';
import * as stringifyOld from 'json-stable-stringify';

interface StringifyOptions {
    space?: number
}


const stringify = (options:StringifyOptions = {}) => (obj: any) => stringifyOld(obj, options);


const getFilenameMetaData = (path:string) => ({
    extension: Path.extname(path),
    location: Path.dirname(path),
    name: Path.basename(path, Path.extname(path)),
    path: path
});

/**
 *   path → Observable( file )
 */
const readFileStream = (path:string = '', encoding:string = 'utf-8') =>
    Observable.create(function (observer) {
        function readFileStreamCB(e, file) {
            if (e) return observer.error(e);

            observer.next(merge(
                getFilenameMetaData(path || ''),
                {file}
            ));
            observer.complete();
        }

        fs.readFile(path, encoding, readFileStreamCB);
    });


const xmlToObservable = Observable.bindNodeCallback(parseString);

// readFileStream('opml/webcomics.xml')
//     .map(prop('file'))
//     // .do(x => console.log({'rfs result':x}))
//     .flatMap(xmlToObservable)
//     .map(stringify({}))
//     .subscribe(x => {console.log({x})});



export {
    readFileStream,
    xmlToObservable,
    stringify
}