/// <reference path="typings/index.d.ts" />

import * as fs from 'fs';
import {merge, prop, path, head} from 'ramda';
import * as Path from 'path';
import {Subscriber, Observable} from 'rxjs';
import {parseString} from 'xml2js';
import * as stringifyOld from 'json-stable-stringify';
import {first} from "rxjs/operator/first";

interface StringifyOptions {
    space?:number
}

interface OutlineFeed {
    htmlUrl:string,
    text:string,
    title:string,
    type:string,
    version:string,
    xmlUrl:string,
    folders?:Array<Array<string>>,
}

interface OutlineFeedParent {
    "$":OutlineFeed,
}

interface OutlineFolder {
    text:string,
    title:string,
}

interface OutlineFolderParent {
    "$":OutlineFolder,
    outline:Array<OutlineFeedParent>,
}

interface Outline {
    outline:Array<OutlineFeedParent> | Array<OutlineFolderParent>,
}


(function () { // sanity checking those types...
    const exampleFeedParent:OutlineFeedParent = {
        "$": {
            "htmlUrl": "http://sgrblog.blogspot.com/",
            "text": "A hundred dance moves per minute",
            "title": "A hundred dance moves per minute",
            "type": "rss",
            "version": "RSS",
            "xmlUrl": "http://sgrblog.blogspot.com/feeds/posts/default"
        }
    };

    const exampleFolderParent:OutlineFolderParent = {
        "$": {
            "text": "webcomics",
            "title": "webcomics"
        },
        "outline": [
            exampleFeedParent,
            exampleFeedParent,
        ]
    };

    //noinspection JSUnusedLocalSymbols,JSMismatchedCollectionQueryUpdate
    const exampleOutline:Array<Outline> = [
        {
            "outline": [
                exampleFolderParent,
                exampleFolderParent,
            ]
        }
    ];
})();


const logObs = (msg:string) => Subscriber.create(
    function logNext(x) {
        console.log({[`next ${msg}`]: x})
    },
    function logError(e) {
        console.log({[`ERROR! ${msg}`]: e});
    },
    function logCompleted() {
        console.log(`completed ${msg}`);
    }
);


const stringify = (options:StringifyOptions = {}) => (obj:any) => stringifyOld(obj, options);


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


const writeFileStream = (path:string) => (data:string|Buffer) =>
    Observable.create(function (observer) {
        function writeFileStreamCB(e, file) {
            if (e) return observer.error(e);

            observer.next(merge(
                getFilenameMetaData(path || ''),
                {file}
            ));
            observer.complete();
        }

        fs.writeFile(path, data, writeFileStreamCB);
    });


const xmlToObservable = Observable.bindNodeCallback(parseString);

readFileStream('opml/webcomics.xml')
    .map(prop('file'))
    // .do(x => console.log({'rfs result':x}))
    .flatMap(xmlToObservable)
    .map(path(['opml', 'body']))
    .map(function getXAttrs(Outlines:Array<Outline>):Array<OutlineFeed> {
        
    })
    .map(stringify({space: 2}))
    .flatMap(writeFileStream('output/webcomics.json'))
    .subscribe(logObs('afterWrite'));


export {
    readFileStream,
    writeFileStream,
    xmlToObservable,
    stringify
}