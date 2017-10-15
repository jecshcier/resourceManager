requirejs.config({
  "baseUrl": staticUrl + "/lib",
  "paths": {
    "jquery": "js/jquery-3.1.0.min",
    "jquery-ui/ui/widget": "js/jquery-ui.min",
    "jquery.fileupload": "jQuery-File-Upload/jquery.fileupload",
    "artDialog": "artDialog/dist/dialog-plus"
  },
  "shim": {
    "jquery-ui/ui/widget": ["jquery"],
    'artDialog': ["jquery"]
  }
});

requirejs(["../javascripts/main"]);
