/// <reference path="typings/index.d.ts" />

import * as fs from 'fs';
import * as Path from 'path';
import * as URI from 'urijs';
import {parseString} from 'xml2js';
import {Subscriber, Observable} from 'rxjs';
import * as stringifyOld from 'json-stable-stringify';
import {keys, map, flatten, merge, prop, path, compose, lt, length, sortBy, values} from 'ramda';

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
    sortableUrl?:string,
}

interface OutlineFeedParent {
    "$":OutlineFeed,
}

interface OutlineFolder {
    text:string,
    title:string,
}

interface OutlineFolderParent {
    "$"?:OutlineFolder,
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
    const exampleOutline:Array<OutlineFolderParent> = [
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

function isFeedItem(x:OutlineFeedParent|OutlineFolderParent):x is OutlineFeedParent {
    return compose(
        lt(0),
        length,
        path(['$', 'xmlUrl'])
    )(x)
}

const getOutline:(x:OutlineFolderParent) => Array<OutlineFolderParent> = prop('outline');


const sortableURI:(x:string) => string = (x = '')=> {
    const u = new URI(x);
    return u.hostname()
        .split('.')
        .reverse()
        .join('.')
        .concat('/', u.segment().join('/'));
};


const addSortableURI:(x:OutlineFeed) => OutlineFeed = x => merge(
    x,
    {sortableUrl: sortableURI(prop<string>('xmlUrl', x))}
);


const arrayToTable:(x:Array<OutlineFeed>) => string = x => {
    const colHeadings = {
        htmlUrl: 'Page',
        text: 'Desc',
        title: 'Title',
        type: 'Type',
        version: 'Version',
        xmlUrl: 'URL',
        sortableUrl: 'sortable',
    };

    const cells = x => map(
        key => `<td>${ prop(key, x) }</td>`,
        keys(colHeadings)
    );

    const toRow = x => `<tr>${ cells(x).join('\n') }</tr>`;

    const rows = x.map(toRow).join('\n');

    return `<table>
  <thead>
  <tr>
    ${ map(x => `<td>${ x }</td>\n`, values(colHeadings)).join('\n') }
  </tr>
  </thead>
  <tbody>
    ${ rows }
  </tbody>
</table>`
};


readFileStream('opml/webcomics.xml')
    .map(prop('file'))
    // .do(x => console.log({'rfs result':x}))
    .flatMap(xmlToObservable)
    .map(path(['opml', 'body']))
    .map(function getXAttrs(outlines:Array<OutlineFolderParent>):Array<OutlineFeed> {
        return flatten<any>( // fixme: use proper types!
            map(
                outline => isFeedItem(outline) ?
                    prop('$', outline) :
                    getXAttrs(getOutline(outline)),
                outlines
            )
        );
    })
    // .do(logObs('wtf is this'))
    .map(map(addSortableURI))
    .map(sortBy(prop('sortableUrl')))
    // .map(stringify({space: 2}))
    .map(arrayToTable)
    .flatMap(writeFileStream('output/webcomics.html'))
    .subscribe(logObs('afterWrite'));


export {
    readFileStream,
    writeFileStream,
    xmlToObservable,
    stringify,
    isFeedItem,
    sortableURI,
    addSortableURI
}