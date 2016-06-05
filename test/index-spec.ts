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


test('writefile and rxjs', t => {
    t.equal(
        index.writeFileStream('./foo')('foo') instanceof Observable,
        true,
        'it should return an Observable'
    );

    t.end();
});


test('map a xml file into an object', t => {
    t.plan(1);

    index.xmlToObservable('<foo>bar</foo>').subscribe(x => {
        t.deepEqual(x, {foo: 'bar'}, 'simple xml');
    });
});


test('better stringify', t => {
    // t.equal(
    //     index.stringify({}, {foo:'bar'}),
    //     '{"foo":"bar"}',
    //     'uncurried & no options works'
    // );

    // t.equal(
    //     index.stringify({space: 2}, {foo:'bar'}),
    //     '{\n  "foo": "bar"\n}`,
    //     'uncurried & "space" option works'
    // );

    t.equal(
        index.stringify({})({foo: 'bar'}),
        '{"foo":"bar"}',
        'curried & no options works'
    );

    t.equal(
        index.stringify({})({foo: 'bar'}),
        '{"foo":"bar"}',
        'curried & no options works'
    );

    t.end();
});

test('isFeedItem()', t => {
    const exampleFeedParent = {
        "$": {
            "htmlUrl": "http://sgrblog.blogspot.com/",
            "text": "A hundred dance moves per minute",
            "title": "A hundred dance moves per minute",
            "type": "rss",
            "version": "RSS",
            "xmlUrl": "http://sgrblog.blogspot.com/feeds/posts/default",
        }
    };

    t.equal(
        index.isFeedItem(exampleFeedParent),
        true,
        'correctly recognizes feed items'
    );

    t.equal(
        index.isFeedItem({
            "$": {
                "text": "webcomics",
                "title": "webcomics"
            },
            "outline": [
                exampleFeedParent,
                exampleFeedParent,
            ]
        }),
        false,
        'correctly recognizes non-(feed items)'
    );


    t.end();
});

test('create sortable URI from a regular URI', t => {
    t.equal(
        index.sortableURI('https://www.example.com/'),
        'com.example.www/'
    );

    t.equal(
        index.sortableURI('https://www.example.com/foo'),
        'com.example.www/foo'
    );

    t.end();
});

test('add sortable URI to a Feed item', t => {
    const exampleFeedItem = {
        "htmlUrl": "http://sgrblog.blogspot.com/",
        "text": "A hundred dance moves per minute",
        "title": "A hundred dance moves per minute",
        "type": "rss",
        "version": "RSS",
        "xmlUrl": "http://sgrblog.blogspot.com/feeds/posts/default",
    };

    t.deepEqual(
        index.addSortableURI(exampleFeedItem),
        {
            "htmlUrl": "http://sgrblog.blogspot.com/",
            "text": "A hundred dance moves per minute",
            "title": "A hundred dance moves per minute",
            "type": "rss",
            "version": "RSS",
            "xmlUrl": "http://sgrblog.blogspot.com/feeds/posts/default",
            "sortableUrl": "com.blogspot.sgrblog/feeds/posts/default",
        },
        'simple url gets added'
    );
    t.end();
});