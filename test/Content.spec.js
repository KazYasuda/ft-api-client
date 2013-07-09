'use strict';

var events = require('events'),
  loadModule = require('./utils/module-loader.js').loadModule,
  STUB_API_KEY = 'bar',
  contentContext = loadModule('lib/Content.js'),
  ContentModule = contentContext.Content,
  content = new ContentModule(STUB_API_KEY);

describe('FT API Content Module', function () {
  it('exports a constructor for a content module instance',
  function () {
    var contentInstance;
    // Given an module constructor and a stub api key as above
    // When we invoke it
    contentInstance = new ContentModule(STUB_API_KEY);
    // Then the instance should be a content module
    expect(contentInstance instanceof ContentModule).toBeTruthy();
  });

  it('exports a constructor which throws an error unless an api key is given',
  function () {
    var contentInstance;
    // Given the content module as above
    // When we call the constructor with no arguments
    // Then it should throw an error
    expect(function () { new ContentModule(); }).toThrow();

    // Given an api import as above
    // When we call the constructor with an arbitrary string
    contentInstance = new ContentModule(STUB_API_KEY);
    // Then it should have returned an object
    expect(contentInstance).toBeDefined();
    expect(typeof contentInstance).toBe('object');
  });

  it('sets the instance config api key from the API key passed to the constructor',
  function () {
    var instance;
    // Given an arbitrary stub api key as above
    // When we create a new instance
    instance = new ContentModule(STUB_API_KEY);
    // Then we should find that its config has an api which is the one passed
    expect(instance.config.apiKey).toBeDefined();
    expect(instance.config.apiKey).toEqual(STUB_API_KEY);
  });

  it('includes all the default config into the instance\'s config',
  function () {
    var defaultConfig, instance, key;
    // Given some default config from the context and an api key
    defaultConfig = contentContext.DEFAULT_CONFIG;
    // When we instantiate a Content module
    instance = new ContentModule(STUB_API_KEY);
    // We should find all the keys from the default config have been included
    for (key in defaultConfig) {
      if (defaultConfig.hasOwnProperty(key)) {
        expect(instance.config[key]).toBeDefined();
        expect(instance.config[key]).toEqual(defaultConfig[key]);
      }
    }
  });

  it('is an EventEmitter',
  function () {
    // Given the an instance of the event module as above
    // When we have a look at it
    // Then we find it's an event emitter :D
    expect(content instanceof events.EventEmitter).toBeTruthy();
  });
});

describe('Content API Getter Calls', function () {
  var CALL_NAMES = [
    'getApiContent',
    'getPage',
    'getPageMainContent',
    'getPages'
  ],
  CONFIG_NAMES = [
    'GET_CONTENT_CONFIG',
    'GET_PAGE_CONFIG',
    'GET_PAGE_CONTENT_CONFIG',
    'GET_PAGES_CONFIG'
  ];

  afterEach(function () {
    // Reset the content objects
    content = new ContentModule(STUB_API_KEY);
  });

  it('exports ' + CALL_NAMES.join(', ') + ' calls',
      function () {
    CALL_NAMES.forEach(function (callName) {
      expect(content[callName]).toBeDefined();
      expect(typeof content[callName]).toEqual('function');
    });
  });

  CALL_NAMES.forEach(function (callName, index) {
    it(callName + ' calls getApiItem with ' + CONFIG_NAMES[index],
    function () {
      // Given a spy on getApiItem
      spyOn(content, 'getApiItem');

      // When we make the call with an arbitrary itemsList and config object
      content[callName]({}, {});

      // Then getApiItem should have been called with the corresponding call config
      expect(content.getApiItem).toHaveBeenCalled();
      expect(content.getApiItem.mostRecentCall.args[3])
          .toEqual(contentContext[CONFIG_NAMES[index]]);
    });

    it(callName + ' calls getApiItem with merged optional config ' +
      'and the content object\'s own config',
    function () {
      var callConfig, configKey, passedConfig;

      // Given a fresh content item with default config
      expect(content.config).toBeDefined();
      expect(typeof content.config).toEqual('object');
      // And arbitrary call config
      callConfig = {
        a: 'a',
        b: 'b'
      };
      // And a spy on 'getApiItem' to stop it executing getApiItem after
      spyOn(content, 'getApiItem');

      // When make the call with the call config passed
      if (callName === 'getPages') {
        content[callName](callConfig);
      } else {
        content[callName]([], callConfig);
      }

      // Then we expect that getItem has been called with merged config passed
      passedConfig = content.getApiItem.mostRecentCall.args[4];
      // And the callConfig has been merged with the content's own config
      expect(passedConfig).toBeDefined();
      expect(typeof passedConfig).toEqual('object');
      for (configKey in callConfig) {
        if (callConfig.hasOwnProperty(configKey)) {
          expect(passedConfig[configKey]).toEqual(callConfig[configKey]);
        }
      }
    });

    it(callName + ' gracefully handles not being passed the optional config argument',
    function () {
      // Given a stub itemsList, and content's config before the call
      var stubItemsList = [],
        configBeforeCall = content.config;
      // When we call our function with no config specified
      if (callName === 'getPages') {
        content[callName]();
      } else {
        content[callName](stubItemsList);
      }
      // Then we should find that content's own config is still fine
      expect(content.config).toBeDefined();
      expect(typeof content.config).toEqual('object');
      // And is equal to the config before the call was made :D
      expect(content.config).toEqual(configBeforeCall);
    });
  });
});

describe('Content API Paths', function () {
  it('makes the get content path by joining api item path with the item id and api key',
      function () {
    // Given a stub config with an apiItemPath and api key, and an arbitrary id
    var stubConfig = {apiItemPath: 'path/', apiKey: 'key'},
      id = 'id',
      path;

    // When we make the get content path
    path = contentContext.makeGetContentPath(stubConfig, id);

    // Then it's equal to the chaps joined together
    expect(path).toEqual([
      stubConfig.apiItemPath, id, contentContext.API_PARAM, stubConfig.apiKey
    ].join(''));
  });

  it('makes the get page path by joining page path with the item id and api key',
      function () {
    // Given a stub config with a page path and api key, and an arbitrary id
    var stubConfig = {pagePath: 'path/', apiKey: 'key'},
      id = 'id',
      path;

    // When we make the get content path
    path = contentContext.makeGetPagePath(stubConfig, id);

    // Then it's equal to the chaps joined together
    expect(path).toEqual([
      stubConfig.pagePath, id, contentContext.API_PARAM, stubConfig.apiKey
    ].join(''));
  });

  it('makes the get page content path by joining page path with page main content path,' +
      'the item id and api key',
      function () {
    // Given a stub config with a page path, page main content and api key, and an id
    var stubConfig = {pagePath: 'path/', pageMainContent: 'pmc/', apiKey: 'key'},
      id = 'id',
      path;

    // When we make the get content path
    path = contentContext.makeGetPageContentPath(stubConfig, id);

    // Then it's equal to the chaps joined together
    expect(path).toEqual([
      stubConfig.pagePath, id, stubConfig.pageMainContent,
      contentContext.API_PARAM, stubConfig.apiKey
    ].join(''));
  });

  it('makes the get pages path by joining page path with the api key',
      function () {
    // Given a stub config with an apiItemPath and api key
    var stubConfig = {pagePath: 'path/', apiKey: 'key'},
      path;

    // When we make the get content path
    path = contentContext.makeGetPagesPath(stubConfig);

    // Then it's equal to the chaps joined together
    expect(path).toEqual([
      stubConfig.pagePath, contentContext.API_PARAM, stubConfig.apiKey
    ].join(''));
  });
});
