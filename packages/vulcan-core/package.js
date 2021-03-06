Package.describe({
  name: "vulcan:core",
  summary: "Vulcan core package",
  version: '1.11.2',
  git: "https://github.com/VulcanJS/Vulcan.git"
});

Package.onUse(function(api) {

  api.versionsFrom('1.6.1');

  api.use([
    'vulcan:lib@1.11.2',
    'vulcan:i18n@1.11.2',
    'vulcan:users@1.11.2',
    'vulcan:routing@1.11.2',
    'vulcan:debug@1.11.2',
  ]);

  api.imply([
    'vulcan:lib@1.11.2'
  ]);

  api.mainModule('lib/server/main.js', 'server');
  api.mainModule('lib/client/main.js', 'client');

});
